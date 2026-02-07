// hod/service.js

import { db } from "../js/firebase.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Save Academic Structure (Subjects)
 * @param {Array} rows - validated rows from Excel
 */
export async function saveHODs(rows) {
  let successCount = 0;

  for (const row of rows) {
    // 🔑 Unique Subject ID
    const subjectId =
      `${row.department_name}_${row.semester}_${row.subject_code}`
        .replace(/\s+/g, "")
        .toUpperCase();

    const ref = doc(db, "subjects", subjectId);

    // 🔒 Prevent overwrite
    const snap = await getDoc(ref);
    if (snap.exists()) {
      console.warn("Duplicate skipped:", subjectId);
      continue;
    }

    // ✅ Save subject
    await setDoc(ref, {
      department_name: row.department_name,
      semester: row.semester,
      subject_code: row.subject_code,
      subject_name: row.subject_name,
      credits: Number(row.credits),
      status: row.status === "true",
      createdAt: serverTimestamp()
    });

    successCount++;
  }

  return { successCount };
}
