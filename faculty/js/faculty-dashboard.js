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

    // Check if there's a section parameter in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("section") === "students" && assignments.length > 0) {
      // Auto-select first class and load students
      const firstClassId = [...new Set(assignments.map(a => a.classId))][0];
      classSelect.value = firstClassId;
      classSelect.dispatchEvent(new Event("change"));
      setTimeout(() => {
        const firstSubjectId = assignments.find(a => a.classId === firstClassId)?.subjectId;
        if (firstSubjectId) {
          subjectSelect.value = firstSubjectId;
          subjectSelect.dispatchEvent(new Event("change"));
          setTimeout(() => viewStudentList(firstClassId), 300);
        }
      }, 300);
    }

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
    <button onclick="viewStudentList('${classId}')">View Students</button>
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

window.viewStudentList = async function (classId) {
  try {
    const studentsSnap = await getDocs(collection(db, "students"));
    const students = [];

    studentsSnap.forEach(doc => {
      const student = doc.data();
      if (student.class_section === classMap[classId] || student.semester === sessionStorage.getItem("selected_class")) {
        students.push(student);
      }
    });

    let studentTable = `
      <h3>Students List</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Name</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Register No</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1;">Details</th>
          </tr>
        </thead>
        <tbody>
    `;

    students.forEach(student => {
      studentTable += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px;">${student.student_name || "-"}</td>
          <td style="padding: 10px;">${student.student_id || "-"}</td>
          <td style="padding: 10px;"><button onclick="viewFacultyStudentDetails('${student.student_id}')" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">View Details</button></td>
        </tr>
      `;
    });

    studentTable += `
        </tbody>
      </table>
    `;

    content.innerHTML = studentTable;
  } catch (err) {
    console.error("Error loading student list:", err);
    content.innerHTML = "<p style='color: red;'>Failed to load students</p>";
  }
};

window.viewFacultyStudentDetails = function (studentId) {
  window.location.href = `student-details.html?id=${studentId}`;
};
