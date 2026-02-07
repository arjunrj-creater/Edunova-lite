import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let mentorUid = null;
let mentorClassId = null;

/* ======================
   AUTH CHECK
====================== */
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  mentorUid = user.uid;
  loadMarks();
});

/* ======================
   LOAD MARKS
====================== */
async function loadMarks() {
  const tbody = document.getElementById("markList");
  tbody.innerHTML = "";

  try {
    const snap = await getDocs(collection(db, "internal_marks"));
    let rows = 0;

    snap.forEach(docSnap => {
      const data = docSnap.data();

      if (data.published === true) return;

      (data.students || []).forEach(stu => {
        const percent = Math.round((stu.marks / data.maxMarks) * 100);

        tbody.innerHTML += `
          <tr>
            <td>
              ${stu.studentName}<br>
              <small>${stu.studentId}</small>
            </td>
            <td>${data.subjectId}</td>
            <td>${stu.marks} / ${data.maxMarks}</td>
            <td>${percent}%</td>
            <td>
              <button onclick="publishMark('${docSnap.id}')">
                Publish
              </button>
            </td>
          </tr>
        `;
        rows++;
      });
    });

    if (rows === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No pending marks</td></tr>`;
    }

  } catch (err) {
    console.error("Error loading marks:", err);
    tbody.innerHTML = `<tr><td colspan="5">Error loading data</td></tr>`;
  }
}

/* ======================
   PUBLISH MARK
====================== */
window.publishMark = async function (docId) {
  try {
    await updateDoc(doc(db, "internal_marks", docId), {
      published: true,
      verifiedByMentor: true,
      mentorUid,
      publishedAt: new Date()
    });

    alert("Marks published successfully ✅");
    loadMarks();
  } catch (err) {
    console.error("Publish failed:", err);
    alert("Failed to publish marks");
  }
};

console.log("mentor-mark-service.js loaded");
