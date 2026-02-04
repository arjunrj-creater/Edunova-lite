import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================
   GLOBAL CONTEXT
====================== */
let mentorUid = null;
const classId = "CS_A_2025";

/* ======================
   AUTH + PROFILE CHECK
====================== */
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  mentorUid = user.uid;

  try {
    const snap = await getDoc(doc(db, "mentors", mentorUid));
    if (!snap.exists() || snap.data().profileCompleted !== true) {
      location.replace("set-password.html");
      return;
    }

    showSection("dashboard");
    loadStudents();

  } catch (err) {
    console.error("Mentor profile check failed", err);
  }
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
   NAVIGATION (FIXED)
====================== */
window.showSection = function (id) {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );

  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");

  document.querySelectorAll(".sidebar a").forEach(a =>
    a.classList.remove("active")
  );

  document.querySelectorAll(".sidebar a").forEach(a => {
    if (a.getAttribute("onclick")?.includes(id)) {
      a.classList.add("active");
    }
  });

  closeSidebar();
};

/* ======================
   LOAD STUDENTS
====================== */
async function loadStudents() {
  const studentList = document.getElementById("studentList");
  const studentCount = document.getElementById("studentCount");

  if (!studentList || !mentorUid) return;

  studentList.innerHTML = "";

  const snap = await getDocs(
    query(
      collection(db, "students"),
      where("mentorUid", "==", mentorUid),
      where("classId", "==", classId)
    )
  );

  if (studentCount) studentCount.innerText = snap.size;

  snap.forEach(d => {
    const s = d.data();
    studentList.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.studentId}</td>
        <td>${s.active ? "Active" : "Inactive"}</td>
      </tr>`;
  });
}

/* ======================
   AUTO PASSWORD
====================== */
window.autoGenerateStudentPassword = () => {
  const reg = cs_regno.value.trim();
  const name = cs_name.value.trim();

  if (!reg || !name) {
    alert("Enter Register No and Name first");
    return;
  }

  cs_password.value =
    name.substring(0, 3).toLowerCase() +
    reg.slice(-3) +
    "@123";
};

/* ======================
   CREATE STUDENT (FIXED)
====================== */
window.createStudent = async () => {
  const regNo = cs_regno.value.trim();
  const name = cs_name.value.trim();
  const password = cs_password.value.trim();
  const msgBox = document.getElementById("createStudentMsg");

  msgBox.innerText = "";
  msgBox.style.color = "red";

  if (!regNo || !name) {
    msgBox.innerText = "Register Number and Name are required";
    return;
  }

  try {
    /* Firestore student profile */
await setDoc(doc(db, "students", regNo), {
  studentId: regNo,
  name,
  classId,
  mentorUid,
  active: true,
  authCreated: false,   // ✅ ADD THIS
  createdAt: new Date(),
  passwordHint: password || null
});


    /* Firestore user profile (NOT Auth) */
    await setDoc(doc(db, "users", regNo), {
      role: "student",
      firstLogin: true,
      authCreated: false,   // 🔥 IMPORTANT FLAG
      createdBy: mentorUid,
      createdAt: new Date()
    });

    msgBox.style.color = "green";
    msgBox.innerText =
      "Student created. Auth account must be created by HOD/Admin.";

    cs_regno.value = "";
    cs_name.value = "";
    cs_password.value = "";

    loadStudents();

  } catch (err) {
    console.error(err);
    msgBox.innerText = "Failed to create student";
  }
};
