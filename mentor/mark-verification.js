import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ======================
   AUTH CHECK
====================== */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.replace("../index.html");
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
   LOAD MARKS (FINAL)
====================== */
async function loadMarks() {
  const tbody = document.getElementById("markList");
  tbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    const snap = await getDocs(collection(db, "internal_marks"));
    let rows = 0;

    snap.forEach(docSnap => {
      const d = docSnap.data();

      // mentor only verifies UNPUBLISHED marks
      if (d.published === true) return;

      rows++;

      tbody.innerHTML += `
        <tr>
          <td>
            ${d.studentName}<br>
            <small>${d.studentId}</small>
          </td>
          <td>${d.subjectId}</td>
          <td>${d.marksObtained}/${d.totalMarks}</td>
          <td>${d.percentage}%</td>
          <td>
            <button class="primary-btn"
              onclick="verifyMark('${docSnap.id}')">
              Verify
            </button>
          </td>
        </tr>
      `;
    });

    if (rows === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No pending marks</td></tr>`;
    }

  } catch (err) {
    console.error("🔥 Mark load error:", err);
    tbody.innerHTML = `<tr><td colspan="5">Permission error</td></tr>`;
  }
}

/* ======================
   VERIFY MARK
====================== */
window.verifyMark = async function (id) {
  try {
    await updateDoc(doc(db, "internal_marks", id), {
      published: true,
      verifiedByMentor: true,
      verifiedAt: new Date()
    });

    loadMarks();
  } catch (err) {
    console.error("🔥 Verify error:", err);
    alert("Failed to verify mark");
  }
};

loadMarks();
