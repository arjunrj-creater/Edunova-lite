// faculty/set-password.js

const facultyId = sessionStorage.getItem("faculty_id");
const role = sessionStorage.getItem("role");

// 🚫 Basic protection: must be logged in as faculty
if (!facultyId || role !== "faculty") {
  window.location.href = "/faculty/login.html";
}

// 🚫 Block access if first login already completed
const firstLoginDone = sessionStorage.getItem("faculty_first_login") === "false";
if (firstLoginDone) {
  window.location.href = "/faculty/dashboard.html";
}

function setPassword() {
  const password = document.getElementById("password").value.trim();
  const confirm = document.getElementById("confirmPassword").value.trim();
  const error = document.getElementById("errorMsg");

  error.textContent = "";

  if (password.length < 6) {
    error.textContent = "Password must be at least 6 characters";
    return;
  }

  if (password !== confirm) {
    error.textContent = "Passwords do not match";
    return;
  }

  // Payload (future backend / Firebase use)
  const payload = {
    faculty_id: facultyId,
    new_password: password
  };

  console.log("Saving password:", payload);

  /*
    TODO (later):
    - Hash password
    - Save to DB / Firebase
    - Persist firstLogin = false
  */

  // ✅ MARK FIRST LOGIN COMPLETED (CRITICAL FIX)
  sessionStorage.setItem("faculty_first_login", "false");

  // optional: remove temp password flag if exists
  sessionStorage.removeItem("passwordSet");

  // next step → teaching setup
  window.location.href = "setup-teaching.html";
}
