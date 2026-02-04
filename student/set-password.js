import { auth, db } from "../js/firebase.js";
import {
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================
   AUTH CHECK
===================== */
let currentUser = null;
let studentId = null;

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  currentUser = user;

  // 🔥 get studentId from USERS collection
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists()) {
    alert("User profile missing");
    return;
  }

  studentId = userSnap.data().studentId;
});

/* =====================
   SET PASSWORD
===================== */
document.getElementById("saveBtn").addEventListener("click", async () => {
  const pass = newPassword.value.trim();
  const confirm = confirmPassword.value.trim();
  const msg = document.getElementById("msg");

  msg.innerText = "";
  msg.style.color = "red";

  if (!pass || !confirm) {
    msg.innerText = "All fields are required";
    return;
  }

  if (pass.length < 6) {
    msg.innerText = "Password must be at least 6 characters";
    return;
  }

  if (pass !== confirm) {
    msg.innerText = "Passwords do not match";
    return;
  }

  try {
    /* 🔐 Update AUTH password */
    await updatePassword(currentUser, pass);

    /* 🧾 Update USERS */
    await updateDoc(doc(db, "users", currentUser.uid), {
      firstLogin: false,
      passwordUpdatedAt: serverTimestamp()
    });

    /* 🧾 Update STUDENTS (IMPORTANT FIX) */
    await updateDoc(doc(db, "students", studentId), {
      passwordSet: true,
      updatedAt: serverTimestamp()
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
