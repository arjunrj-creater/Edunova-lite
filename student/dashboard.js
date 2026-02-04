import { auth } from "../js/firebase.js";
import { signOut, onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =====================
   AUTH CHECK
===================== */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.replace("../index.html");
  }
});

/* =====================
   SIDEBAR CONTROL
===================== */
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

window.toggleSidebar = () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
};

window.closeSidebar = () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
};

/* =====================
   NAVIGATION
===================== */
document.querySelectorAll(".sidebar a[data-target]").forEach(link => {
  link.addEventListener("click", () => {
    const target = link.dataset.target;

    document.querySelectorAll(".card").forEach(c =>
      c.classList.add("hidden")
    );

    document.getElementById(target).classList.remove("hidden");

    document.querySelectorAll(".sidebar a")
      .forEach(a => a.classList.remove("active"));

    link.classList.add("active");

    closeSidebar();
  });
});

window.openProfile = () => {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );
  document.getElementById("profileCard").classList.remove("hidden");
  closeSidebar();
};

/* =====================
   LOGOUT
===================== */
window.logout = async () => {
  await signOut(auth);
  location.replace("../index.html");
};
