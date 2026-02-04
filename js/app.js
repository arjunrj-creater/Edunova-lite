/* ---------------------------
   TEMP DATA (SIMULATED)
   This will later be created by Mentor
---------------------------- */

if (!localStorage.getItem("users")) {
  const users = [
    {
      role: "student",
      username: "S101",          // Student ID
      password: "edu@123",       // Temporary password
      firstLogin: true
    }
  ];
  localStorage.setItem("users", JSON.stringify(users));
}

/* ---------------------------
   LOGIN HANDLER
---------------------------- */

function handleLogin() {
  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  const user = users.find(
    u => u.role === role && u.username === username
  );

  if (!user) {
    alert("Invalid username");
    return;
  }

  if (user.password !== password) {
    alert("Incorrect password");
    return;
  }

  // First-time login → force password change
  if (user.firstLogin) {
    const newPassword = prompt("First login detected. Please set a new password:");

    if (!newPassword || newPassword.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }

    user.password = newPassword;
    user.firstLogin = false;

    localStorage.setItem("users", JSON.stringify(users));

    alert("Password updated successfully. Please login again.");
    return;
  }

  // Normal login
  if (role === "student") {
    window.location.href = "student.html";
  } else if (role === "mentor") {
    window.location.href = "mentor.html";
  } else if (role === "faculty") {
    window.location.href = "faculty.html";
  }
}

/* ---------------------------
   PLACEHOLDER ACTIONS
---------------------------- */

function showMessage(type) {
  alert(type + " will be handled by mentor/institution.");
}
