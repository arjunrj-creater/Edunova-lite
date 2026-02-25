import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc, getDoc,
  collection, query, where, getDocs
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const pName   = document.getElementById("pName");
  const pId     = document.getElementById("pId");
  const pClass  = document.getElementById("pClass");
  const pMentor = document.getElementById("pMentor");

  // reset
  [pName, pId, pClass, pMentor].forEach(el => el.innerText = "-");

  /* ================= USERS ================= */
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists()) {
    console.error("User document missing");
    return;
  }

  const userData = userSnap.data();
  if (userData.role !== "student") return;

  /* ================= STUDENT ================= */
  if (!userData.studentId) {
    console.error("studentId missing in users");
    return;
  }

  const q = query(
    collection(db, "students"),
    where("student_id", "==", userData.studentId)
  );

  const qs = await getDocs(q);
  if (qs.empty) {
    console.error("Student document not found");
    return;
  }

  const studentDoc = qs.docs[0];
  const s = studentDoc.data();

  // fill UI
  pName.innerText  = s.student_name || "-";
  pId.innerText    = s.student_id || "-";
  pClass.innerText = s.classId || "-";

  /* ================= MENTOR ================= */
  if (s.mentorUid) {
    const mentorSnap = await getDoc(
      doc(db, "mentors", s.mentorUid)
    );
    if (mentorSnap.exists()) {
      pMentor.innerText = mentorSnap.data().name || "-";
    }
  }
});
