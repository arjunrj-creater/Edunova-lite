import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const subjectList = document.getElementById("subjectList");

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    subjectList.innerHTML =
      `<tr><td colspan="4">Please login again</td></tr>`;
    return;
  }

  try {

/* =========================
   1️⃣ GET STUDENT DOCUMENT USING authUid
========================== */

const studentQuery = query(
  collection(db, "students"),
  where("authUid", "==", user.uid)
);

const studentSnap = await getDocs(studentQuery);

if (studentSnap.empty) {
  subjectList.innerHTML =
    `<tr><td colspan="4">Student record not found</td></tr>`;
  return;
}

const studentData = studentSnap.docs[0].data();
const classId = studentData.classId;


    /* =========================
       2️⃣ GET ALL FACULTIES
    ========================== */
    const facultySnap = await getDocs(collection(db, "faculties"));

    subjectList.innerHTML = "";
    let found = false;

    /* =========================
       3️⃣ CHECK ASSIGNMENTS
    ========================== */
    for (const facultyDoc of facultySnap.docs) {

      const facultyData = facultyDoc.data();
      const assignments = facultyData.assignments || [];

      for (const assign of assignments) {

        if (assign.classId === classId) {

          found = true;

          const subjectId = assign.subjectId;

          // Fetch subject document
          const subjectDoc = await getDoc(doc(db, "subjects", subjectId));

          if (subjectDoc.exists()) {

            const subjectData = subjectDoc.data();

            subjectList.innerHTML += `
              <tr>
                <td>${subjectData.subject_code || "-"}</td>
                <td>${subjectData.subject_name || "-"}</td>
                <td>${subjectData.credits || "-"}</td>
                <td>${facultyData.name || "-"}</td>
              </tr>
            `;
          }
        }
      }
    }

    if (!found) {
      subjectList.innerHTML =
        `<tr><td colspan="4">No subjects found</td></tr>`;
    }

  } catch (err) {
    console.error("Subjects load failed:", err);
    subjectList.innerHTML =
      `<tr><td colspan="4">Failed to load subjects</td></tr>`;
  }
});
