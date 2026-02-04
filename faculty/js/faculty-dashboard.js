import { auth, db } from "../../js/firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================
   UI ELEMENTS
====================== */
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subjectSelect");
const title = document.getElementById("contextTitle");
const content = document.getElementById("dynamicContent");

/* ======================
   STATE
====================== */
let assignments = [];
let classMap = {};
let subjectMap = {};

/* ======================
   AUTH → LOAD DATA
====================== */
onAuthStateChanged(auth, async (user) => {
  if (!user) return; // dashboard.html already handles redirect

  try {
    // 🔎 Load faculty assignments
    const facultySnap = await getDoc(doc(db, "faculties", user.uid));
    if (!facultySnap.exists()) return;

    assignments = facultySnap.data().assignments || [];

    if (assignments.length === 0) {
      title.innerText = "No teaching assignments found";
      return;
    }

    // 🔎 Load classes
    const classSnap = await getDocs(collection(db, "classes"));
    classSnap.forEach(docSnap => {
      classMap[docSnap.id] = docSnap.data().name;
    });

    // 🔎 Load subjects
    const subjectSnap = await getDocs(collection(db, "subjects"));
    subjectSnap.forEach(docSnap => {
      subjectMap[docSnap.id] = docSnap.data().name;
    });

    populateClasses();

  } catch (err) {
    console.error(err);
  }
});

/* ======================
   POPULATE CLASSES
====================== */
function populateClasses() {
  classSelect.innerHTML = `<option value="">Select Class</option>`;
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  subjectSelect.disabled = true;

  const uniqueClasses = [
    ...new Set(assignments.map(a => a.classId))
  ];

  uniqueClasses.forEach(classId => {
    const opt = document.createElement("option");
    opt.value = classId;
    opt.textContent = classMap[classId] || classId;
    classSelect.appendChild(opt);
  });
}

/* ======================
   CLASS CHANGE
====================== */
classSelect.addEventListener("change", () => {
  const classId = classSelect.value;

  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  subjectSelect.disabled = true;
  content.innerHTML = "";
  title.innerText = "Please select subject";

  if (!classId) return;

  const subjectsForClass = assignments
    .filter(a => a.classId === classId)
    .map(a => a.subjectId);

  subjectsForClass.forEach(subjectId => {
    const opt = document.createElement("option");
    opt.value = subjectId;
    opt.textContent = subjectMap[subjectId] || subjectId;
    subjectSelect.appendChild(opt);
  });

  subjectSelect.disabled = false;
});

/* ======================
   SUBJECT CHANGE
====================== */
subjectSelect.addEventListener("change", () => {
  const classId = classSelect.value;
  const subjectId = subjectSelect.value;

  if (!classId || !subjectId) return;

  title.innerText =
    `${classMap[classId]} – ${subjectMap[subjectId]}`;

  loadContext(classId, subjectId);
});

/* ======================
   CONTEXT LOAD
====================== */
function loadContext(classId, subjectId) {
  content.innerHTML = `
    <p><strong>Selected Class:</strong> ${classMap[classId]}</p>
    <p><strong>Selected Subject:</strong> ${subjectMap[subjectId]}</p>

    <hr>

    <button onclick="goToAttendance()">Take Attendance</button>
    <button onclick="goToMarks()">Enter Marks</button>
  `;

  // context storage is OK
  sessionStorage.setItem("selected_class", classId);
  sessionStorage.setItem("selected_subject", subjectId);
}

/* ======================
   NAVIGATION
====================== */
window.goToAttendance = function () {
  location.href = "attendance.html";
};

window.goToMarks = function () {
  location.href = "marks.html";
};
