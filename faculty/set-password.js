// faculty/set-password.js
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

/* AUTH CHECK */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.replace("/index.html");
    return;
  }
  currentUser = user;
});

/* SET PASSWORD */
saveBtn.addEventListener("click", async () => {
  const pass = document.getElementById("newPassword").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();

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
    await updatePassword(currentUser, pass);

    // Faculty profile (NOT completed yet)
    await updateDoc(doc(db, "faculties", currentUser.uid), {
      profileCompleted: false,
      updatedAt: serverTimestamp()
    });

    // User meta
    await updateDoc(doc(db, "users", currentUser.uid), {
      firstLogin: false,
      passwordUpdatedAt: serverTimestamp()
    });

    msg.style.color = "green";
    msg.innerText = "Password updated. Continue setup…";

    setTimeout(() => {
      location.replace("/faculty/setup-teaching.html");
    }, 800);

  } catch (err) {
    console.error(err);
    msg.innerText = err.message || "Failed to update password";
  }
});
