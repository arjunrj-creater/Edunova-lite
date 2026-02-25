import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const list = document.getElementById("list");

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {

    /* =====================
       GET STUDENT PROFILE
    ===================== */
    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {
      list.innerHTML = `<tr><td colspan="2">Student profile not found</td></tr>`;
      return;
    }

    const studentId = userSnap.data().studentId;

    if (!studentId) {
      list.innerHTML = `<tr><td colspan="2">Student ID not linked</td></tr>`;
      return;
    }

    /* =====================
       LOAD SUBJECT MAP
    ===================== */
    const subjectSnap = await getDocs(collection(db, "subjects"));
    const subjectMap = {};

    subjectSnap.forEach(docSnap => {
      const data = docSnap.data();
      subjectMap[docSnap.id] = data.subject_name || docSnap.id;
    });

    /* =====================
       LOAD ATTENDANCE RECORDS
    ===================== */
    const snap = await getDocs(collection(db, "attendance_records"));

    let hasData = false;
    list.innerHTML = "";

    snap.forEach(docSnap => {
      const data = docSnap.data();

      // ✅ MUST BE published AND verifiedByMentor
      if (!data.published || !data.verifiedByMentor || !data.students) return;

      const students = Object.values(data.students);
      const s = students.find(st => st.studentId === studentId);

      if (!s) return;

      hasData = true;

      const subjectName = subjectMap[data.subjectId] ?? "—";

      list.innerHTML += `
        <tr>
          <td>${subjectName}</td>
          <td>${typeof s.percentage === "number"
            ? s.percentage + "%"
            : "—"}
          </td>
        </tr>
      `;
    });

    if (!hasData) {
      list.innerHTML = `
        <tr>
          <td colspan="2">No attendance published yet</td>
        </tr>
      `;
    }

  } catch (err) {
    console.error("Attendance load failed:", err);
    list.innerHTML = `
      <tr>
        <td colspan="2">Failed to load attendance</td>
      </tr>
    `;
  }
});
