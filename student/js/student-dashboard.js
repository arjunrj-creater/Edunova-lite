import { auth } from "../../js/firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =====================
   AUTH CHECK
===================== */
onAuthStateChanged(auth, (user) => {
  if (!user) location.replace("../index.html");
});

/* =====================
   ELEMENTS
===================== */
const frame = document.getElementById("contentFrame");
const profileCard = document.getElementById(
  "profileCard"
);

/* =====================
   SIDEBAR HANDLING
===================== */
document.querySelectorAll(".sidebar a").forEach(link => {

  link.addEventListener("click", () => {

    // reset active state
    document.querySelectorAll(".sidebar a")
      .forEach(a => a.classList.remove("active"));
    link.classList.add("active");

    /* ---------- PAGE LINKS ---------- */
    if (link.dataset.page) {

      // hide profile
      if (profileCard)
        profileCard.style.display = "none";

      // show iframe
      frame.style.display = "block";
      frame.src = link.dataset.page;
      return;
    }

    /* ---------- TARGET LINKS (PROFILE) ---------- */
    if (link.dataset.target === "profileCard") {

      // hide iframe
      frame.style.display = "none";

      // show profile
      if (profileCard)
        profileCard.style.display = "block";
      return;
    }
  });
});

/* =====================
   LOGOUT
===================== */
document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  location.replace("../index.html");
};
