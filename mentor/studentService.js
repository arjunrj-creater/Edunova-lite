// ================= FIREBASE IMPORTS =================
import { auth, db } from "../js/firebase.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/*
  students/{studentId} structure:

  {
    student_id,
    student_name,
    phone,
    parent_phone,
    seat_type,
    status,

    department_id,
    department_name,
    semester,
    class_section,

    mentor_uid,
    auth_created,
    created_at
  }
*/

// ================= SAVE STUDENTS =================
export async function saveStudents(rows) {

  const user = auth.currentUser;
  if (!user) throw new Error("Mentor not logged in");

  const mentorUid = user.uid;

  // 🔹 Get mentor profile
  const mentorSnap = await getDoc(doc(db, "mentors", mentorUid));
  if (!mentorSnap.exists()) {
    throw new Error("Mentor profile not found");
  }

  const mentor = mentorSnap.data();

  // ✅ Mentor fields
  const department_id = mentor.department_id || null;
  const department_name = mentor.department_name || null;
  const semester = mentor.current_academic_year || null;
  const class_section = mentor.class_section || null;

  let successCount = 0;

  const studentsRef = collection(db, "students");

  // ================= CLEAN LOOP =================
  for (const row of rows) {

    // 🔥 normalize ID to prevent duplicates like sit23 / SIT23
    const studentId = row.student_id?.trim().toUpperCase();

    if (!studentId) {
      console.warn("Skipping row with empty student_id", row);
      continue;
    }

    const studentRef = doc(studentsRef, studentId);

    const studentDoc = {

      student_id: studentId,
      student_name: row.student_name || "",
      email: row.email || "",
      phone: row.phone || "",
      parent_phone: row.parent_phone || "",
      seat_type: row.seat_type || "",
      status: row.status === "true",

      department_id,
      department_name,
      semester,
      class_section,

      mentor_uid: mentorUid,
      auth_created: false,
      created_at: serverTimestamp()

    };

    // ⭐ UPSERT (create OR update safely)
    await setDoc(studentRef, studentDoc, { merge: true });

    successCount++;
  }

  return { successCount };
}
