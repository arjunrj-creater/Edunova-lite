/* 🔥 FIREBASE + STUDENT AUTO LOAD (MARKS VERSION) */
import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subjectSelect");
const tableBody = document.getElementById("tableBody");
const rowCount = document.getElementById("rowCount");

let assignments = [];
let classMap = {};
let subjectMap = {};

/* =========================
   AUTH + INITIAL LOAD
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const facultySnap = await getDoc(doc(db, "faculties", user.uid));
  assignments = facultySnap.data()?.assignments || [];

  const classSnap = await getDocs(collection(db, "classes"));
  classSnap.forEach(d => {
    classMap[d.id] = d.data().name;
  });

  /* ✅ FIX IS HERE */
  const subjectSnap = await getDocs(collection(db, "subjects"));
  subjectSnap.forEach(d => {
    subjectMap[d.id] = d.data().subject_name; // 🔥 correct field
  });

  populateClasses();
});

/* =========================
   POPULATE CLASSES
========================= */
function populateClasses() {
  classSelect.innerHTML = `<option value="">Select Class</option>`;

  const unique = [...new Set(assignments.map(a => a.classId))];
  unique.forEach(cid => {
    const opt = document.createElement("option");
    opt.value = cid;
    opt.textContent = classMap[cid] || cid;
    classSelect.appendChild(opt);
  });
}

/* =========================
   CLASS CHANGE HANDLER
========================= */
classSelect.addEventListener("change", async () => {
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  subjectSelect.disabled = true;
  tableBody.innerHTML = "";
  rowCount.innerText = "Total Rows: 0";

  const classId = classSelect.value;
  if (!classId) return;

  assignments
    .filter(a => a.classId === classId)
    .forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.subjectId;
      opt.textContent = subjectMap[a.subjectId]; // ✅ NAME ONLY
      subjectSelect.appendChild(opt);
    });

  subjectSelect.disabled = false;

  /* 🔥 LOAD STUDENTS */
  const snap = await getDocs(collection(db, "students"));
  let i = 1;

  snap.forEach(docSnap => {
    const s = docSnap.data();
    if (s.classId === classId) {
      tableBody.innerHTML += `
        <tr>
          <td>${i++}</td>
          <td>${s.student_id}</td>
          <td>${s.student_name}</td>
          <td><input type="number" min="0" class="mark-input" oninput="updateTotal(this)"></td>
          <td><input type="number" min="0" class="mark-input" oninput="updateTotal(this)"></td>
          <td><input type="number" min="0" class="mark-input" oninput="updateTotal(this)"></td>
          <td><input type="number" min="0" class="mark-input" oninput="updateTotal(this)"></td>
          <td class="total">0</td>
        </tr>
      `;
    }
  });

  rowCount.innerText = `Total Rows: ${i - 1}`;
});

/* =========================
   LIVE TOTAL CALCULATION
========================= */
window.updateTotal = function (input) {
  const row = input.closest("tr");
  const inputs = row.querySelectorAll(".mark-input");

  const test1 = parseFloat(inputs[0].value || 0);
  const test2 = parseFloat(inputs[1].value || 0);
  const assignment = parseFloat(inputs[2].value || 0);
  const attendance = parseFloat(inputs[3].value || 0);

  let total = ((test1 + test2) / 4) + assignment + attendance;

  const maxMarks = parseFloat(
    document.getElementById("maxMarks")?.value || 0
  );

  if (!row.dataset.alertShown) row.dataset.alertShown = "false";

  if (!isNaN(maxMarks) && maxMarks > 0 && total > maxMarks) {
    total = maxMarks;
    if (row.dataset.alertShown === "false") {
      showAlert("Maximum internal mark exceeded", "danger");
      row.dataset.alertShown = "true";
    }
  } else {
    row.dataset.alertShown = "false";
  }

  row.querySelector(".total").innerText = total.toFixed(2);
};

/* =========================
   SUBMIT MARKS
========================= */
window.submitMarks = async function () {
  const classId = classSelect.value;
  const subjectId = subjectSelect.value;

  if (!classId || !subjectId) {
    showAlert("Please select class and subject", "danger");
    return;
  }

  const rows = document.querySelectorAll("#tableBody tr");
  if (rows.length === 0) {
    showAlert("No students found", "danger");
    return;
  }

  const students = [];

  rows.forEach(row => {
    const studentId = row.children[1].innerText.trim();
    const studentName = row.children[2].innerText.trim();

    const inputs = row.querySelectorAll(".mark-input");
    const total = parseInt(row.querySelector(".total").innerText || 0, 10);

    students.push({
      studentId,
      studentName,
      test1: parseInt(inputs[0].value || 0, 10),
      test2: parseInt(inputs[1].value || 0, 10),
      assignment: parseInt(inputs[2].value || 0, 10),
      attendance: parseInt(inputs[3].value || 0, 10),
      total
    });
  });

  await addDoc(collection(db, "internal_marks"), {
    classId,
    subjectId,
    students,
    createdAt: serverTimestamp(),
    published: false,
    verifiedByMentor: false,
    mentorUid: null
  });

  showAlert("Internal marks submitted successfully ✅", "success");
};

/* =========================
   ALERT HELPER
========================= */
function showAlert(message, type) {
  const alert = document.getElementById("alert");
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;

  setTimeout(() => {
    alert.classList.remove("show");
  }, 3000);
}
