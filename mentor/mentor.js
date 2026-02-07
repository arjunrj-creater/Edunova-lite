import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================
   GLOBAL CONTEXT
====================== */
let mentorUid = null;
let mentorClassId = null;

/* ======================
   AUTH + PROFILE CHECK
====================== */
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  mentorUid = user.uid;

  const mentorSnap = await getDoc(doc(db, "mentors", mentorUid));
  if (!mentorSnap.exists() || mentorSnap.data().profileCompleted !== true) {
    location.replace("set-password.html");
    return;
  }

  mentorClassId = mentorSnap.data().classId;

  showSection("dashboard");
  loadStudents();
});

/* ======================
   LOGOUT
====================== */
window.logout = async () => {
  await signOut(auth);
  location.replace("../index.html");
};

/* ======================
   SIDEBAR
====================== */
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

window.toggleSidebar = () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
};

window.closeSidebar = () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
};

/* ======================
   SECTION SWITCHING (FIXED)
====================== */
window.showSection = function (id) {
  document.querySelectorAll(".main > .card")
    .forEach(c => c.classList.add("hidden"));

  document.getElementById(id)?.classList.remove("hidden");

  document.querySelectorAll(".sidebar a")
    .forEach(a => a.classList.remove("active"));

  const active = [...document.querySelectorAll(".sidebar a")]
    .find(a => a.getAttribute("onclick")?.includes(id));
  if (active) active.classList.add("active");

  history.replaceState(null, "", "dashboard.html");
  closeSidebar();
};

/* ======================
   ✅ CREATE STUDENT FIX (MISSING LOGIC)
====================== */
window.handleActionChange = function () {
  const action = document.getElementById("actionType").value;

  const selectSection = document.getElementById("selectStudentSection");
  const createSection = document.getElementById("createNewStudentSection");
  const passwordSelect = document.getElementById("passwordSectionSelect");

  // reset all
  selectSection.style.display = "none";
  createSection.style.display = "none";
  passwordSelect.style.display = "none";

  if (action === "select") {
    selectSection.style.display = "block";
  }

  if (action === "create") {
    createSection.style.display = "block";
  }
};

/* ======================
   STUDENT MODAL (BROWSE)
====================== */
window.openStudentDialog = async function () {
  const modal = document.getElementById("studentModal");
  const container = document.getElementById("studentListContainer");

  modal.style.display = "flex";
  container.innerHTML = "";

  const snap = await getDocs(collection(db, "students"));

  snap.forEach(d => {
    const s = d.data();
    container.innerHTML += `
      <div
        onclick="selectStudent('${s.student_id}', '${s.student_name}', '${s.email || "-"}', '${s.phone || "-"}')"
        style="padding:10px;border:1px solid #e5e7eb;border-radius:6px;cursor:pointer">
        <b>${s.student_name}</b><br>
        <small>${s.student_id}</small>
      </div>
    `;
  });
};

window.closeStudentDialog = function () {
  document.getElementById("studentModal").style.display = "none";
};

window.selectStudent = function (id, name, email, phone) {
  document.getElementById("selectedStudentInfo").style.display = "block";
  document.getElementById("passwordSectionSelect").style.display = "block";

  document.getElementById("selectedId").innerText = id;
  document.getElementById("selectedName").innerText = name;
  document.getElementById("selectedEmail").innerText = email;
  document.getElementById("selectedPhone").innerText = phone;

  closeStudentDialog();
};

/* ======================
   LOAD STUDENTS (TABLE)
====================== */
async function loadStudents() {
  const list = document.getElementById("studentList");
  const count = document.getElementById("studentCount");
  if (!list || !count) return;

  list.innerHTML = "";
  const snap = await getDocs(collection(db, "students"));
  count.innerText = snap.size;

  snap.forEach(d => {
    const s = d.data();
    list.innerHTML += `
      <tr>
        <td>${s.student_name || "-"}</td>
        <td>${s.student_id || "-"}</td>
        <td>
          <button onclick="viewStudentDetails('${s.student_id}')">
            View Details
          </button>
        </td>
      </tr>`;
  });
}

/* ======================
   VIEW STUDENT
====================== */
window.viewStudentDetails = id => {
  location.href = `student-details.html?id=${id}`;
};
window.createStudent = async function () {
  console.clear();
  console.log("🟢 createStudent() called");

  try {
    const id = document.getElementById("newStudentId")?.value.trim();
    const name = document.getElementById("newStudentName")?.value.trim();
    const email = document.getElementById("newStudentEmail")?.value.trim();
    const phone = document.getElementById("newStudentPhone")?.value.trim();
    const parentPhone = document.getElementById("newParentPhone")?.value.trim();
    const msg = document.getElementById("createStudentMsg");

    if (!id || !name) {
      msg.innerText = "Student ID and Name are required";
      msg.style.color = "red";
      console.error("❌ Validation failed");
      return;
    }

    console.log("📦 Student Data:", {
      id,
      name,
      email,
      phone,
      parentPhone,
      classId: mentorClassId
    });

    await addDoc(collection(db, "students"), {
      student_id: id,
      student_name: name,
      email: email || "",
      phone: phone || "",
      parent_phone: parentPhone || "",
      classId: mentorClassId,
      createdAt: new Date()
    });

    msg.innerText = "✅ Student created successfully";
    msg.style.color = "green";

    console.log("✅ Student saved to Firestore");

    // reset form
    document.getElementById("newStudentId").value = "";
    document.getElementById("newStudentName").value = "";
    document.getElementById("newStudentEmail").value = "";
    document.getElementById("newStudentPhone").value = "";
    document.getElementById("newParentPhone").value = "";

    loadStudents();

  } catch (err) {
    console.error("🔥 Create student failed:", err);
    alert("Create student failed. Check console.");
  }
};
