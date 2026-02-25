import { auth } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, user => {
  if (!user) {
    location.replace("../index.html");
  }
});

document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  location.replace("../index.html");
};
