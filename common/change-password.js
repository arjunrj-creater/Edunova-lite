import { auth } from "../js/firebase.js";
import {
  onAuthStateChanged,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ======================
   LOGOUT (if button exists)
====================== */
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await signOut(auth);
    window.top.location.replace("../index.html");
  };
}

/* ======================
   AUTH CHECK
====================== */
onAuthStateChanged(auth, user => {
  if (!user) {
    window.top.location.replace("../index.html");
  }
});

/* ======================
   CHANGE PASSWORD
====================== */
window.changePassword = async function () {
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!newPassword || !confirmPassword) {
    showAlert("All fields are required", "danger");
    return;
  }

  if (newPassword.length < 6) {
    showAlert("Password must be at least 6 characters", "danger");
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert("Passwords do not match", "danger");
    return;
  }

  try {
    const user = auth.currentUser;
    await updatePassword(user, newPassword);

    showAlert("Password updated successfully ✅ Please login again.", "success");

    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    // 🔐 Force re-login (BEST PRACTICE)
    setTimeout(async () => {
      await signOut(auth);
      window.top.location.replace("../index.html");
    }, 1500);

  } catch (err) {
    console.error(err);

    if (err.code === "auth/requires-recent-login") {
      showAlert("Please logout and login again to change password", "danger");
    } else {
      showAlert("Failed to update password", "danger");
    }
  }
};

/* ======================
   ALERT HELPER
====================== */
function showAlert(message, type) {
  const alert = document.getElementById("alert");
  alert.textContent = message;
  alert.className = `alert alert-${type} show`;

  setTimeout(() => {
    alert.classList.remove("show");
  }, 3000);
}
