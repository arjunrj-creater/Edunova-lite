import { auth } from "../js/firebase.js";
import {
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ======================
   SIDEBAR HANDLERS
====================== */
window.toggleSidebar = () => {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (!sidebar || !overlay) return;

  sidebar.classList.add("open");
  overlay.classList.add("show");
};

window.closeSidebar = () => {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("overlay")?.classList.remove("show");
};

/* ======================
   HANDLE HASH ON PAGE LOAD
   (🔥 THIS FIXES YOUR ISSUE)
====================== */
window.addEventListener("load", () => {
  // Only needed on dashboard page
  if (!location.pathname.includes("dashboard.html")) return;

  const hash = location.hash.replace("#", "");
  if (!hash) return;

  // Wait one frame to ensure dashboard JS + DOM are ready
  requestAnimationFrame(() => {
    const target = document.getElementById(hash);
    if (target) {
      document.querySelectorAll("section").forEach(sec => {
        sec.style.display = "none";
      });
      target.style.display = "block";

      // set active sidebar link
      document.querySelectorAll(".sidebar a").forEach(a => {
        a.classList.toggle(
          "active",
          a.getAttribute("href") === `#${hash}`
        );
      });
    }
  });
});

/* ======================
   LOGOUT
====================== */
window.logout = async () => {
  try {
    await signOut(auth);
    location.replace("../index.html");
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

console.log("mentor-layout.js loaded (hash-fix enabled)");
