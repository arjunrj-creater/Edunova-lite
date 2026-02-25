import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc, getDoc
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail
} from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const pName   = document.getElementById("pName");
  const pRole   = document.getElementById("pRole");
  const pRef    = document.getElementById("pRef");
  const pClass  = document.getElementById("pClass");
  const pEmail  = document.getElementById("pEmail");
  const pMentor = document.getElementById("pMentor");

  const emailRow = document.getElementById("emailRow");

  // reset UI
  [pName, pRole, pRef, pClass, pEmail, pMentor].forEach(el => {
    if (el) el.innerText = "-";
  });

  // Email hidden by default (ONLY HOD will see it)
  if (emailRow) emailRow.style.display = "none";

  /* ================= USERS (ROLE DETECTION) ================= */
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  pRole.innerText = (userData.role || "-").toUpperCase();

  /* ================= STUDENT ================= */
  if (userData.role === "student") {

    const studentDocId = userData.studentDocId;
    if (!studentDocId) return;

    const studentSnap = await getDoc(
      doc(db, "students", studentDocId)
    );
    if (!studentSnap.exists()) return;

    const s = studentSnap.data();

    pName.innerText = s.student_name || "-";
    pRef.innerText  = s.student_id || userData.studentId || "-";

    if (pClass) {
      pClass.innerText = s.classId || "-";
    }

    // Mentor name
    const mentorUid = s.mentorUid || userData.mentorUid;
    if (mentorUid) {
      const mentorSnap = await getDoc(
        doc(db, "mentors", mentorUid)
      );
      if (mentorSnap.exists()) {
        pMentor.innerText = mentorSnap.data().name || "-";
      }
    }
  }

  /* ================= FACULTY ================= */
  if (userData.role === "faculty") {

    pName.innerText = userData.name || "-";
    pRef.innerText  = userData.facultyId || userData.refId || "-";

    if (userData.facultyId) {
      const facSnap = await getDoc(
        doc(db, "faculties", userData.facultyId)
      );
      if (facSnap.exists() && pClass) {
        const f = facSnap.data();
        pClass.innerText = f.classId || f.department || "-";
      }
    }
  }

  /* ================= MENTOR ================= */
  if (userData.role === "mentor") {

    pName.innerText = userData.name || "-";
    pRef.innerText  = userData.mentorId || userData.refId || "-";

    const mentorSnap = await getDoc(
      doc(db, "mentors", user.uid)
    );
    if (mentorSnap.exists() && pClass) {
      pClass.innerText = mentorSnap.data().classId || "-";
    }
  }

  /* ================= HOD ================= */
  if (userData.role === "hod") {

    // Show email ONLY for HOD
    if (emailRow) emailRow.style.display = "block";

    pName.innerText  = userData.name || "HOD";
    pRef.innerText   = userData.refId || "HOD";
    pEmail.innerText = auth.currentUser.email;

    // Enable email change modal
    const changeEmailBox = document.getElementById("changeEmailBox");
    if (changeEmailBox) changeEmailBox.style.display = "block";

    const changeEmailBtn = document.getElementById("changeEmailBtn");
    if (changeEmailBtn) {
      changeEmailBtn.onclick = () => {
        document.getElementById("emailModal").style.display = "block";
      };
    }
  }
});

/* ================= HOD EMAIL CHANGE ================= */

const confirmBtn = document.getElementById("confirmEmailChange");

if (confirmBtn) {
  confirmBtn.onclick = async () => {
    const newEmail = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("currentPassword").value;

    if (!newEmail || !password) {
      alert("Fill all fields");
      return;
    }

    try {
      const user = auth.currentUser;

      const cred = EmailAuthProvider.credential(
        user.email,
        password
      );

      await reauthenticateWithCredential(user, cred);
      await verifyBeforeUpdateEmail(user, newEmail);

      alert(
        "Verification link sent to new email.\n" +
        "Please verify to complete update."
      );

      document.getElementById("emailModal").style.display = "none";

    } catch (err) {
      alert(err.message || "Email update failed");
    }
  };
}
