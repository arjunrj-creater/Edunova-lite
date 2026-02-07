// faculty/setup-teaching.js

import { auth, db } from "../js/firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================
   UI ELEMENTS
====================== */
const classInput = document.getElementById("classInput");
const classDropdown = document.getElementById("classDropdown");
const subjectInput = document.getElementById("subjectInput");
const subjectDropdown = document.getElementById("subjectDropdown");
const tableBody = document.getElementById("assignmentTable");
const saveBtn = document.getElementById("saveBtn");
const msg = document.getElementById("msg");

/* ======================
   STATE
====================== */
let currentUser = null;
let assignments = [];
let classMap = {};
let subjectMap = {};
let classList = [];
let subjectList = [];
let selectedClassId = "";
let selectedSubjectId = "";

/* ======================
   AUTH CHECK
====================== */
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("/index.html");
    return;
  }

  currentUser = user;
  await loadClasses();
});

/* ======================
   LOAD CLASSES
====================== */
async function loadClasses() {
  classInput.value = "";
  classDropdown.innerHTML = "";
  subjectInput.value = "";
  subjectDropdown.innerHTML = "";
  subjectInput.disabled = true;
  selectedClassId = "";
  selectedSubjectId = "";

  try {
    const snap = await getDocs(collection(db, "classes"));
    classList = [];

    snap.forEach(docSnap => {
      const data = docSnap.data();
      classMap[docSnap.id] = data.name;
      classList.push({ id: docSnap.id, name: data.name });
    });

    classList.sort((a, b) => a.name.localeCompare(b.name));
    renderClassDropdown("");

  } catch (err) {
    console.error(err);
    msg.innerText = "Failed to load classes";
  }
}

/* ======================
   RENDER CLASS DROPDOWN
====================== */
function renderClassDropdown(searchTerm) {
  classDropdown.innerHTML = "";
  const filtered = classList.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    classDropdown.innerHTML = "<div class='dropdown-item'>No classes found</div>";
    classDropdown.classList.add("show");
    return;
  }

  filtered.forEach(cls => {
    const div = document.createElement("div");
    div.className = "dropdown-item";
    div.textContent = cls.name;
    div.onclick = () => selectClass(cls.id, cls.name);
    classDropdown.appendChild(div);
  });

  classDropdown.classList.add("show");
}

/* ======================
   SELECT CLASS
====================== */
function selectClass(classId, className) {
  selectedClassId = classId;
  classInput.value = className;
  classDropdown.classList.remove("show");
  loadSubjects(classId);
}

/* ======================
   CLASS INPUT EVENT
====================== */
classInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value;
  if (searchTerm.length > 0) {
    renderClassDropdown(searchTerm);
  } else {
    classDropdown.classList.remove("show");
  }
});

classInput.addEventListener("focus", () => {
  if (classList.length > 0) {
    renderClassDropdown(classInput.value);
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".select-box")) {
    classDropdown.classList.remove("show");
    subjectDropdown.classList.remove("show");
  }
});

/* ======================
   LOAD SUBJECTS
====================== */
async function loadSubjects(classId) {
  subjectInput.value = "";
  subjectDropdown.innerHTML = "";
  subjectInput.disabled = true;
  selectedSubjectId = "";

  if (!classId) return;

  try {
    const snap = await getDocs(collection(db, "subjects"));
    subjectList = [];
    subjectMap = {};

    snap.forEach(docSnap => {
      const data = docSnap.data();
      subjectMap[docSnap.id] = data.subject_name;
      subjectList.push({ id: docSnap.id, name: data.subject_name });
    });

    subjectList.sort((a, b) => a.name.localeCompare(b.name));
    subjectInput.disabled = false;
    renderSubjectDropdown("");

  } catch (err) {
    console.error(err);
    msg.innerText = "Failed to load subjects";
  }
}

/* ======================
   RENDER SUBJECT DROPDOWN
====================== */
function renderSubjectDropdown(searchTerm) {
  subjectDropdown.innerHTML = "";
  const filtered = subjectList.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    subjectDropdown.innerHTML = "<div class='dropdown-item'>No subjects found</div>";
    subjectDropdown.classList.add("show");
    return;
  }

  filtered.forEach(subject => {
    const div = document.createElement("div");
    div.className = "dropdown-item";
    div.textContent = subject.name;
    div.onclick = () => selectSubject(subject.id, subject.name);
    subjectDropdown.appendChild(div);
  });

  subjectDropdown.classList.add("show");
}

/* ======================
   SELECT SUBJECT
====================== */
function selectSubject(subjectId, subjectName) {
  selectedSubjectId = subjectId;
  subjectInput.value = subjectName;
  subjectDropdown.classList.remove("show");
}

/* ======================
   SUBJECT INPUT EVENT
====================== */
subjectInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value;
  if (searchTerm.length > 0) {
    renderSubjectDropdown(searchTerm);
  } else {
    subjectDropdown.classList.remove("show");
  }
});

subjectInput.addEventListener("focus", () => {
  if (subjectList.length > 0) {
    renderSubjectDropdown(subjectInput.value);
  }
});

/* ======================
   ADD ASSIGNMENT
====================== */
window.addAssignment = function () {
  const classId = selectedClassId;
  const subjectId = selectedSubjectId;

  msg.innerText = "";

  if (!classId || !subjectId) {
    msg.innerText = "Select both class and subject";
    return;
  }

  const exists = assignments.some(
    a => a.classId === classId && a.subjectId === subjectId
  );

  if (exists) {
    msg.innerText = "This assignment already exists";
    return;
  }

  assignments.push({ classId, subjectId });
  renderTable();
  
  // Clear selections
  classInput.value = "";
  subjectInput.value = "";
  selectedClassId = "";
  selectedSubjectId = "";
};

/* ======================
   RENDER TABLE
====================== */
function renderTable() {
  tableBody.innerHTML = "";

  assignments.forEach((a, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${classMap[a.classId]}</td>
      <td>${subjectMap[a.subjectId]}</td>
      <td>
        <span class="remove" onclick="removeAssignment(${index})">
          Remove
        </span>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

window.removeAssignment = function (index) {
  assignments.splice(index, 1);
  renderTable();
};

/* ======================
   SAVE ASSIGNMENTS
====================== */
window.saveAssignments = async function () {
  msg.innerText = "";
  msg.style.color = "red";

  if (assignments.length === 0) {
    msg.innerText = "Add at least one teaching assignment";
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerText = "Saving...";

  try {
    await updateDoc(
      doc(db, "faculties", currentUser.uid),
      {
        assignments: assignments,
        profileCompleted: true,
        updatedAt: serverTimestamp()
      }
    );

    msg.style.color = "green";
    msg.innerText = "Setup completed. Redirecting...";

    setTimeout(() => {
      location.replace("dashboard.html");
    }, 1200);

  } catch (err) {
    console.error(err);
    msg.innerText = err.message || "Failed to save assignments";
    saveBtn.disabled = false;
    saveBtn.innerText = "Save & Continue";
  }
};
