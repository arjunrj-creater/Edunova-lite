import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let studentId = null;

/* ======================
   GET STUDENT ID FROM URL
====================== */
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  studentId = params.get("id");

  if (!studentId) {
    showError("No student ID provided");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.replace("../index.html");
      return;
    }

    try {
      await loadStudentDetails(studentId);
    } catch (err) {
      console.error("Error loading details:", err);
      showError("Failed to load student details");
    }
  });
});

/* ======================
   LOAD STUDENT DETAILS
====================== */
async function loadStudentDetails(id) {
  const snap = await getDoc(doc(db, "students", id));

  if (!snap.exists()) {
    showError("Student not found");
    return;
  }

  const student = snap.data();

  // Hide loading, show content
  document.getElementById("loadingMsg").style.display = "none";
  document.getElementById("detailsContent").style.display = "block";

  // Populate fields
  document.getElementById("studentId").textContent = student.student_id || "-";
  document.getElementById("studentName").textContent = student.student_name || "-";
  document.getElementById("studentEmail").textContent = student.email || "-";
  document.getElementById("studentPhone").textContent = student.phone || "-";
  document.getElementById("studentParentPhone").textContent = student.parent_phone || "-";
  document.getElementById("studentSeatType").textContent = student.seat_type || "-";
  document.getElementById("studentStatus").textContent = student.status === true ? "Active" : "Inactive";
  document.getElementById("studentDepartment").textContent = student.department_name || "-";
}

/* ======================
   ERROR HANDLING
====================== */
function showError(msg) {
  document.getElementById("loadingMsg").style.display = "none";
  document.getElementById("errorMsg").style.display = "block";
  document.getElementById("errorMsg").textContent = msg;
}

/* ======================
   GO BACK
====================== */
window.goBack = () => {
  window.location.href = "dashboard.html?section=students";
};
