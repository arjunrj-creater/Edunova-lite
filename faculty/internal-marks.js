import { auth, db } from "../js/firebase.js";
import {
  collection, getDocs, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subjectSelect");
const markTable = document.getElementById("markTable");

let students = [];

async function loadStudents() {
  const snap = await getDocs(collection(db, "students"));
  markTable.innerHTML = "";
  students = [];

  snap.forEach(doc => {
    const s = doc.data();
    students.push(s);

    markTable.innerHTML += `
      <tr>
        <td>${s.student_id}</td>
        <td>${s.student_name}</td>
        <td>
          <input type="number" min="0" class="markInput">
        </td>
      </tr>
    `;
  });
}

window.submitMarks = async () => {
  const maxMarks = parseInt(document.getElementById("maxMarks").value, 10);
  if (!maxMarks) return alert("Enter max marks");

  const rows = document.querySelectorAll(".markInput");
  const markData = [];

  rows.forEach((input, i) => {
    const marks = parseInt(input.value || 0, 10);
    const percent = ((marks / maxMarks) * 100).toFixed(2);

    markData.push({
      studentId: students[i].student_id,
      studentName: students[i].student_name,
      marks,
      percentage: percent
    });
  });

  await addDoc(collection(db, "internal_marks"), {
    classId: "CLASS_ID",
    subjectId: subjectSelect.value,
    subjectName: subjectSelect.options[subjectSelect.selectedIndex].text,
    maxMarks,
    marks: markData,
    published: false,
    verifiedByMentor: false,
    facultyUid: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });

  alert("Marks submitted for mentor verification ✅");
};

loadStudents();
