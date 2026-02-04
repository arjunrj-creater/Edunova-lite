function login() {
  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  status.innerText = "Logging in...";

  let email = role === "hod" ? username : `${username}@edunova.com`;

  auth.signInWithEmailAndPassword(email, password)
    .then(cred => {
      return db.collection("users").doc(cred.user.uid).get();
    })
    .then(doc => {
      const role = doc.data().role;

      if (role === "hod") location.href = "hod/dashboard.html";
      if (role === "mentor") location.href = "mentor/dashboard.html";
      if (role === "student") location.href = "student/dashboard.html";
    })
    .catch(err => status.innerText = err.message);
}
