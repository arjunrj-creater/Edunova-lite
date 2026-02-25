import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged, updatePassword } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const newPwd = document.getElementById("newPassword");
const confirmPwd = document.getElementById("confirmPassword");
const saveBtn = document.getElementById("saveBtn");
const msg = document.getElementById("msg");

let currentUser = null;
let studentDocId = null;
let studentClassId = null;

onAuthStateChanged(auth, async user => {
  if (!user) return location.replace("../index.html");
  currentUser = user;

  // 🔥 Read user profile
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists()) {
    msg.textContent = "User profile not found";
    return;
  }

  if (userSnap.data().firstLogin !== true) {
    // already set
    return location.replace("dashboard.html");
  }

  // 🔥 Find student record
  const studentSnap = await getDoc(doc(db, "students", user.uid));
  if (!studentSnap.exists()) {
    msg.textContent = "Student record not found. Contact admin.";
    return;
  }

  studentDocId = studentSnap.id;
  studentClassId = studentSnap.data().classId;

  if (!studentClassId) {
    msg.textContent = "Class not assigned. Contact mentor.";
    return;
  }
});

/* =====================
   SAVE PASSWORD
===================== */
saveBtn.onclick = async () => {
  const p1 = newPwd.value.trim();
  const p2 = confirmPwd.value.trim();

  if (!p1 || p1.length < 6)
    return show("Password must be at least 6 characters");

  if (p1 !== p2)
    return show("Passwords do not match");

  try {
    // 🔐 Update auth password
    await updatePassword(currentUser, p1);

    // ✅ Mark first login complete
    await updateDoc(doc(db, "users", currentUser.uid), {
      firstLogin: false
    });

    show("Password updated successfully ✔", "success");

    setTimeout(() => {
      location.replace("dashboard.html");
    }, 1200);

  } catch (err) {
    console.error(err);
    show("Failed to update password. Re-login and try again.");
  }
};

function show(text, type = "error") {
  msg.textContent = text;
  msg.style.color = type === "success" ? "green" : "red";
}
