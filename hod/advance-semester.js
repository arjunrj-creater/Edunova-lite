import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===============================
   ADVANCE ALL STUDENTS & MENTORS
================================ */
window.advanceAllSemesters = async function () {
  if (!confirm(
    "Advance all students to next semester?\n\n⚠️ sem8 / CSE8 students & mentors will be permanently removed."
  )) {
    return;
  }

  try {
    const studentSnap = await getDocs(collection(db, "students"));

    if (studentSnap.empty) {
      alert("No students found");
      return;
    }

    let advanced = 0;
    let removedStudents = 0;
    const mentorUsage = {}; // mentorUid -> count

    /* ================= STUDENTS ================= */
    for (const d of studentSnap.docs) {
      const s = d.data();
      const studentRef = doc(db, "students", d.id);

      const semNum = s.semester?.match(/\d+/)?.[0];
      const classNum = s.classId?.match(/\d+/)?.[0];

const isFinalSem =
  (semNum && parseInt(semNum) > 8) ||
  (classNum && parseInt(classNum) > 8);


      // Track mentor usage
      if (s.mentorUid) {
        mentorUsage[s.mentorUid] = (mentorUsage[s.mentorUid] || 0) + 1;
      }

      /* ---- FINAL SEM: DELETE STUDENT ---- */
      if (isFinalSem) {
        await deleteDoc(studentRef);
        removedStudents++;
        continue;
      }

      /* ---- ADVANCE STUDENT ---- */
      const updates = {};

      if (semNum) {
        updates.semester = `sem${parseInt(semNum) + 1}`;
      }

      if (s.classId) {
        const match = s.classId.match(/(\D+)(\d*)/);
        if (match) {
          const base = match[1];
          const next = match[2] ? parseInt(match[2]) + 1 : 1;
          updates.classId = `${base}${next}`;
        }
      }

      await updateDoc(studentRef, {
        ...updates,
        updatedAt: new Date()
      });

      advanced++;
    }

    /* ================= MENTORS ================= */
    const mentorSnap = await getDocs(collection(db, "mentors"));
    let removedMentors = 0;

    for (const m of mentorSnap.docs) {
      const mentorId = m.id;

      // If no students remain for mentor → delete
      if (!mentorUsage[mentorId]) {
        await deleteDoc(doc(db, "mentors", mentorId));
        removedMentors++;
      }
    }

    alert(
      `DONE ✅\n\n` +
      `Advanced students: ${advanced}\n` +
      `Removed students (final sem): ${removedStudents}\n` +
      `Removed mentors (no students): ${removedMentors}`
    );

  } catch (err) {
    console.error(err);
    alert("Semester advance failed");
  }
};
