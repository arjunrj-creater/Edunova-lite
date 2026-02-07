import { auth, db } from "../js/firebase.js";
import {
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let allClasses = [];

const msg = document.getElementById("msg");
const saveBtn = document.getElementById("saveBtn");
const classSelect = document.getElementById("classSelect");

/* ---------- AUTH CHECK ---------- */
onAuthStateChanged(auth, user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }
  currentUser = user;
  loadClasses();
});

/* ---------- LOAD CLASSES ---------- */
async function loadClasses() {
  classSelect.innerHTML = "<option value=''>Loading classes...</option>";

  try {
    const snap = await getDocs(collection(db, "classes"));
    allClasses = [];

    snap.forEach(d => {
      allClasses.push({ id: d.id, ...d.data() });
    });

    classSelect.innerHTML = "<option value=''>Select a class</option>";

    allClasses.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent =
        c.name ||
        (c.classCode ? `${c.classCode}-${c.section || ""}` : c.id);
      classSelect.appendChild(opt);
    });

  } catch (err) {
    console.error(err);
    msg.innerText = "Failed to load classes";
  }
}

/* ---------- SAVE PROFILE ---------- */
saveBtn.addEventListener("click", async () => {
  const classId = classSelect.value.trim();
  const pass = document.getElementById("newPassword").value.trim();
  const confirmPass = document.getElementById("confirmPassword").value.trim();

  msg.innerText = "";
  msg.style.color = "red";

  if (!classId || !pass || !confirmPass) {
    msg.innerText = "All fields are required";
    return;
  }

  if (pass.length < 6) {
    msg.innerText = "Password must be at least 6 characters";
    return;
  }

  if (pass !== confirmPass) {
    msg.innerText = "Passwords do not match";
    return;
  }

  try {
    const selectedClass = allClasses.find(c => c.id === classId);
    if (!selectedClass) {
      msg.innerText = "Invalid class selected";
      return;
    }

    // 🔐 Update Auth password
    await updatePassword(currentUser, pass);

    // 🧾 SELF-HEALING mentor update (creates fields if missing)
    const mentorUpdate = {
      classId: classId,
      profileCompleted: true,
      updatedAt: serverTimestamp()
    };

    mentorUpdate.classCode = selectedClass.classCode || "";
    mentorUpdate.section = selectedClass.section || "";
    mentorUpdate.semester = selectedClass.semester || "";
    mentorUpdate.department = selectedClass.department || "";
    mentorUpdate.totalStudents =
      selectedClass.totalStudents !== undefined
        ? selectedClass.totalStudents
        : 0;

    mentorUpdate.class_section =
      (selectedClass.classCode || "") +
      (selectedClass.section ? `-${selectedClass.section}` : "");

    // ✅ This works even if mentor doc had only name + mentorId
    await updateDoc(
      doc(db, "mentors", currentUser.uid),
      mentorUpdate
    );

    // 🔑 Update user meta
    await updateDoc(
      doc(db, "users", currentUser.uid),
      {
        firstLogin: false,
        passwordUpdatedAt: serverTimestamp()
      }
    );

    msg.style.color = "green";
    msg.innerText = "Password updated successfully! Redirecting...";

    setTimeout(() => {
      location.replace("dashboard.html");
    }, 1200);

  } catch (err) {
    console.error(err);
    msg.innerText = err.message || "Failed to update password";
  }
});
