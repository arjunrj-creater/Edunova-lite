import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const semSelect = document.getElementById("semSelect");
const subjectSelect = document.getElementById("subjectSelect");
const tableBody = document.getElementById("resultTableBody");

let mentorClassId = null;

/* =========================
   AUTH
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const mentorSnap = await getDoc(
    doc(db, "mentors", user.uid)
  );

  if (!mentorSnap.exists()) return;

  mentorClassId = mentorSnap.data().classId;
});

/* =========================
   LOAD SUBJECTS BY SEM
========================= */
semSelect.addEventListener("change", async () => {
  subjectSelect.innerHTML =
    `<option value="">-- Select Subject --</option>`;

  if (!mentorClassId || !semSelect.value) return;

  const snap = await getDocs(
    collection(db, "classes", mentorClassId, "subjects")
  );

  snap.forEach(docSnap => {
    const sub = docSnap.data();

    if (String(sub.semester) === semSelect.value) {
      subjectSelect.innerHTML += `
        <option value="${docSnap.id}">
          ${sub.subjectName}
        </option>
      `;
    }
  });
});

/* =========================
   LOAD STUDENTS (DEMO)
========================= */
document.getElementById("loadBtn").addEventListener("click", () => {
  if (!subjectSelect.value) {
    alert("Select semester and subject");
    return;
  }

  tableBody.innerHTML = "";

  const students = [
    { name: "Arun" },
    { name: "Bala" },
    { name: "Charan" }
  ];

  students.forEach(s => {
    tableBody.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td><input type="checkbox" class="presentCheck" checked></td>
        <td>
          <select class="resultSelect">
            <option value="">--</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </td>
      </tr>
    `;
  });
});

/* =========================
   CALCULATE
========================= */
window.calculateAnalysis = function () {
  const presentChecks = document.querySelectorAll(".presentCheck");
  const resultSelects = document.querySelectorAll(".resultSelect");

  let present = 0;
  let pass = 0;

  presentChecks.forEach((c, i) => {
    if (c.checked) {
      present++;
      if (resultSelects[i].value === "pass") pass++;
    }
  });

  document.getElementById("totalPresent").innerText = present;
  document.getElementById("totalPass").innerText = pass;
  document.getElementById("passPercentage").innerText =
    present ? ((pass / present) * 100).toFixed(2) + "%" : "0%";
};
