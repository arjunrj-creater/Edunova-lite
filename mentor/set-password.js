import { auth, db } from "../js/firebase.js";
import {
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;

const msg = document.getElementById("msg");
const saveBtn = document.getElementById("saveBtn");

/* ---------- AUTH CHECK ---------- */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }
  currentUser = user;
});

/* ---------- SAVE PROFILE ---------- */
saveBtn.addEventListener("click", async () => {
  const cls = document.getElementById("mentorClass").value.trim();
  const pass = document.getElementById("newPassword").value.trim();
  const confirmPass = document.getElementById("confirmPassword").value.trim();

  msg.innerText = "";
  msg.style.color = "red";

  if (!cls || !pass || !confirmPass) {
    msg.innerText = "All fields are required";
    return;
  }

  if (pass.length < 6) {
    msg.innerText = "Password must be at least 6 characters";
    return;
  }

  if (pass !== confirmPass) {
    msg.innerText = "Passwords do not match";
    return;
  }

  try {
    // 🔐 Update auth password
    await updatePassword(currentUser, pass);

    // 🧾 Update mentor profile
    await updateDoc(doc(db, "mentors", currentUser.uid), {
      classId: cls,
      profileCompleted: true,
      updatedAt: serverTimestamp()
    });

    // 🔑 Update user meta
    await updateDoc(doc(db, "users", currentUser.uid), {
      firstLogin: false,
      passwordUpdatedAt: serverTimestamp()
    });

    msg.style.color = "green";
    msg.innerText = "Password updated successfully! Redirecting...";

    setTimeout(() => {
      location.replace("dashboard.html");
    }, 1200);

  } catch (err) {
    console.error(err);
    msg.innerText = err.message || "Failed to update password";
  }
});
