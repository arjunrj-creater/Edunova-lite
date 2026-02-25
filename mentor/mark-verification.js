import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================
   DOM REFERENCES
====================== */
const tableBody = document.getElementById("markList");
const subjectFilter = document.getElementById("subjectFilter");
const searchInput = document.getElementById("studentSearch");
const alertBox = document.getElementById("alert");

/* ======================
   GLOBAL STATE
====================== */
let mentorUid = null;
let mentorClassId = null;

let markDocs = [];
let subjectMap = {};   // subjectId → subject_name

/* ======================
   AUTH + CLASS DETECTION
====================== */
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  mentorUid = user.uid;

  const mentorSnap = await getDoc(doc(db, "mentors", mentorUid));
  if (!mentorSnap.exists()) {
    showAlert("Mentor profile not found", "danger");
    return;
  }

  mentorClassId = mentorSnap.data().classId;

  await loadSubjects();
  loadMarks();
});

/* ======================
   LOGOUT
====================== */
window.logout = async () => {
  await signOut(auth);
  location.replace("../index.html");
};

/* ======================
   LOAD SUBJECT NAMES
====================== */
async function loadSubjects() {
  subjectMap = {};
  const snap = await getDocs(collection(db, "subjects"));
  snap.forEach(d => {
    subjectMap[d.id] =
      d.data().subject_name || d.id;
  });
}

/* ======================
   LOAD MARKS (CLASS ONLY)
====================== */
async function loadMarks() {
  tableBody.innerHTML =
    `<tr><td colspan="6">Loading...</td></tr>`;
  markDocs = [];
  subjectFilter.innerHTML =
    `<option value="">All Subjects</option>`;

  try {
    const q = query(
      collection(db, "internal_marks"),
      where("classId", "==", mentorClassId),
      where("published", "==", false)
    );

    const snap = await getDocs(q);
    const subjectSet = new Set();

    snap.forEach(docSnap => {
      const d = docSnap.data();
      if (!Array.isArray(d.students)) return;

      markDocs.push({ id: docSnap.id, ...d });
      subjectSet.add(d.subjectId);
    });

    // Populate subject filter (OPTIONAL filter)
    subjectSet.forEach(id => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = subjectMap[id] || id;
      subjectFilter.appendChild(opt);
    });

    renderTable();

  } catch (err) {
    console.error("🔥 Mark load error:", err);
    tableBody.innerHTML =
      `<tr><td colspan="6">Failed to load marks</td></tr>`;
  }
}

/* ======================
   SEARCH & FILTER
====================== */
window.searchStudents = () => renderTable();
subjectFilter.addEventListener("change", renderTable);

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") renderTable();
});

/* ======================
   RENDER TABLE
====================== */
function renderTable() {
  tableBody.innerHTML = "";
  let i = 1;

  const subjectValue = subjectFilter.value;
  const searchValue = searchInput.value.trim().toLowerCase();

  markDocs
    .filter(d => !subjectValue || d.subjectId === subjectValue)
    .forEach(record => {
      record.students.forEach(student => {

        if (
          searchValue &&
          !student.studentId.toLowerCase().includes(searchValue)
        ) return;

        tableBody.innerHTML += `
          <tr>
            <td>${i++}</td>
            <td>${student.studentId}</td>
            <td>${student.studentName}</td>
            <td>${subjectMap[record.subjectId]}</td>
            <td>${student.total}</td>
            <td>
              <button class="primary-btn"
                onclick="verifySingle('${record.id}')">
                Verify
              </button>
            </td>
          </tr>
        `;
      });
    });

  if (i === 1) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6"
          style="text-align:center;color:#6b7280;padding:20px;">
          No records found
        </td>
      </tr>
    `;
  }
}

/* ======================
   VERIFY SINGLE (DOC LEVEL)
====================== */
window.verifySingle = async function (docId) {
  try {
    await updateDoc(doc(db, "internal_marks", docId), {
      verifiedByMentor: true,
      published: true,
      verifiedAt: new Date(),
      mentorUid
    });

    showAlert("Marks verified ✔", "success");
    loadMarks();

  } catch (err) {
    console.error(err);
    showAlert("Failed to verify marks", "danger");
  }
};

/* ======================
   🔥 VERIFY ALL (SUBJECT-WISE)
====================== */
window.verifyAll = async function () {
  const subjectValue = subjectFilter.value;

  if (!subjectValue) {
    showAlert("Select a subject to verify all", "danger");
    return;
  }

  const records = markDocs.filter(
    r => r.subjectId === subjectValue
  );

  if (records.length === 0) {
    showAlert("No records to verify", "info");
    return;
  }

  try {
    for (const r of records) {
      await updateDoc(doc(db, "internal_marks", r.id), {
        verifiedByMentor: true,
        published: true,
        verifiedAt: new Date(),
        mentorUid
      });
    }

    showAlert(
      `Verified all marks for ${subjectMap[subjectValue]}`,
      "success"
    );
    loadMarks();

  } catch (err) {
    console.error(err);
    showAlert("Verify all failed", "danger");
  }
};

/* ======================
   ALERT
====================== */
function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = `alert alert-${type} show`;
  setTimeout(() => alertBox.classList.remove("show"), 2500);
}

loadMarks();
