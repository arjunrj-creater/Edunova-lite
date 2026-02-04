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
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subjectSelect");
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
  classSelect.innerHTML = `<option value="">Select Class</option>`;
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  subjectSelect.disabled = true;

  try {
    const snap = await getDocs(collection(db, "classes"));

    snap.forEach(docSnap => {
      const data = docSnap.data();
      classMap[docSnap.id] = data.name;

      const opt = document.createElement("option");
      opt.value = docSnap.id;
      opt.textContent = data.name;
      classSelect.appendChild(opt);
    });

  } catch (err) {
    console.error(err);
    msg.innerText = "Failed to load classes";
  }
}

/* ======================
   LOAD SUBJECTS
====================== */
classSelect.addEventListener("change", async () => {
  const classId = classSelect.value;

  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  subjectSelect.disabled = true;

  if (!classId) return;

  try {
    const q = query(
      collection(db, "subjects"),
      where("classId", "==", classId)
    );

    const snap = await getDocs(q);
    subjectMap = {};

    snap.forEach(docSnap => {
      const data = docSnap.data();
      subjectMap[docSnap.id] = data.name;

      const opt = document.createElement("option");
      opt.value = docSnap.id;
      opt.textContent = data.name;
      subjectSelect.appendChild(opt);
    });

    subjectSelect.disabled = false;

  } catch (err) {
    console.error(err);
    msg.innerText = "Failed to load subjects";
  }
});

/* ======================
   ADD ASSIGNMENT
====================== */
window.addAssignment = function () {
  const classId = classSelect.value;
  const subjectId = subjectSelect.value;

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
