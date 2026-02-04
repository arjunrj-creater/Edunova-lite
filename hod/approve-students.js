import { auth, db } from "../js/firebase.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================
   GLOBAL STATE
===================== */
let pendingStudents = [];

/* =====================
   AUTH CHECK
===================== */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }
  loadPendingStudents();
});

/* =====================
   LOAD PENDING STUDENTS
===================== */
async function loadPendingStudents() {
  const list = document.getElementById("pendingList");
  if (!list) return;

  list.innerHTML = "";
  pendingStudents = [];

  const snap = await getDocs(
    query(collection(db, "students"), where("authCreated", "==", false))
  );

  if (snap.empty) {
    list.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center;color:#666;">
          No students pending approval
        </td>
      </tr>`;
    return;
  }

  snap.forEach(d => {
    const s = d.data();
    pendingStudents.push({ id: d.id, ...s });

    list.innerHTML += `
      <tr>
        <td>${s.studentId}</td>
        <td>${s.name}</td>
        <td>${s.mentorUid}</td>
      </tr>`;
  });
}

/* =====================
   APPROVE ALL
===================== */
window.approveAll = async () => {
  if (!pendingStudents.length) {
    alert("No students to approve");
    return;
  }

  for (const s of pendingStudents) {
    try {
      let authUid = s.authUid || null;

      // 🔹 CREATE AUTH ONLY IF NOT EXISTS
      if (!authUid) {
        const email = `${s.studentId}@edunova.com`;
        const password = s.passwordHint || "Temp@123";

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        authUid = cred.user.uid;

        // create users profile ONLY first time
        await setDoc(doc(db, "users", authUid), {
          role: "student",
          studentId: s.studentId,
          firstLogin: true,
          authCreated: true,
          revoked: false,
          createdAt: new Date()
        });
      } else {
        // 🔹 AUTH EXISTS → JUST UNBLOCK LOGIN
        await updateDoc(doc(db, "users", authUid), {
          authCreated: true,
          revoked: false
        });
      }

      // 🔹 UPDATE STUDENT DOC
      await updateDoc(doc(db, "students", s.id), {
        authCreated: true,
        authUid,
        revokedAt: null,
        approvedAt: new Date()
      });

    } catch (err) {
      console.error("Approve failed:", s.studentId, err.message);
    }
  }

  alert("Students approved successfully");
  window.location.reload(); // restore HOD session
};

/* =====================
   REVOKE PANEL CONTROL
===================== */
window.openRevokeBox = () => {
  const box = document.getElementById("revokeBox");
  if (box) box.style.display = "block";
  loadRevokeList();
};

window.closeRevokeBox = () => {
  const box = document.getElementById("revokeBox");
  if (box) box.style.display = "none";
};

/* =====================
   LOAD LAST 7 DAYS APPROVED
===================== */
async function loadRevokeList() {
  const list = document.getElementById("revokeList");
  if (!list) return;

  list.innerHTML = "";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // ✅ ONLY ONE WHERE (NO INDEX NEEDED)
  const snap = await getDocs(
    query(
      collection(db, "students"),
      where("authCreated", "==", true)
    )
  );

  let found = false;

  snap.forEach(d => {
    const s = d.data();
    if (!s.approvedAt) return;

    const approvedDate =
      s.approvedAt.seconds
        ? new Date(s.approvedAt.seconds * 1000)
        : new Date(s.approvedAt);

    // ✅ FILTER LAST 7 DAYS IN JS
    if (approvedDate < sevenDaysAgo) return;

    found = true;

    list.innerHTML += `
      <tr>
        <td>${s.studentId}</td>
        <td>${s.name}</td>
        <td>${s.classId || "-"}</td>
        <td>${approvedDate.toLocaleDateString()}</td>
        <td>
          <button onclick="revokeOne('${d.id}')">Revoke</button>
        </td>
      </tr>
    `;
  });

  if (!found) {
    list.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:#666;">
          No students approved in last 7 days
        </td>
      </tr>
    `;
  }
}

/* =====================
   REVOKE ONE STUDENT
===================== */
window.revokeOne = async (studentDocId) => {
  if (!confirm("Are you sure you want to revoke this student?")) return;

  try {
    await updateDoc(doc(db, "students", studentDocId), {
      authCreated: false,
      revokedAt: new Date()
    });

    alert("Student revoked successfully");
    loadRevokeList();
    loadPendingStudents();

  } catch (err) {
    console.error("Revoke failed", err);
    alert("Failed to revoke student");
  }
};
