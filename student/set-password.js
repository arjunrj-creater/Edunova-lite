import { auth, db } from "../js/firebase.js";
import {
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================
   GLOBALS
===================== */
let currentUser = null;
let allClasses = [];
let studentDocRef = null;

const msg = document.getElementById("msg");
const saveBtn = document.getElementById("saveBtn");
const classSelect = document.getElementById("classSelect");

/* =====================
   AUTH CHECK
===================== */
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  currentUser = user;

  await findStudentDocument(); // 🔥 IMPORTANT
  loadClasses();
});

/* =====================
   FIND STUDENT DOC
===================== */
async function findStudentDocument() {
  const q = query(
    collection(db, "students"),
    where("authUid", "==", currentUser.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Student record not found. Contact admin.");
  }

  // There will be only ONE document
  studentDocRef = doc(db, "students", snap.docs[0].id);
}

/* =====================
   LOAD CLASSES
===================== */
async function loadClasses() {
  classSelect.innerHTML = "<option value=''>Loading classes...</option>";

  try {
    const snap = await getDocs(collection(db, "classes"));
    allClasses = [];

    snap.forEach(d => {
      allClasses.push({
        id: d.id,
        ...d.data()
      });
    });

    classSelect.innerHTML = "<option value=''>Select a class</option>";

    allClasses.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name || c.classCode || c.id;
      classSelect.appendChild(opt);
    });

  } catch (err) {
    console.error(err);
    msg.innerText = "Failed to load classes";
  }
}

/* =====================
   SAVE PASSWORD
===================== */
saveBtn.addEventListener("click", async () => {
  const classId = classSelect.value;
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

    /* ---------- UPDATE AUTH PASSWORD ---------- */
    await updatePassword(currentUser, pass);

    /* ---------- BUILD STUDENT UPDATE ---------- */
    const studentUpdate = {
      classId,
      profileCompleted: true,
      passwordSet: true,
      passwordSetDate: serverTimestamp(),
      updatedAt: serverTimestamp(),

      ...(selectedClass.classCode && { classCode: selectedClass.classCode }),
      ...(selectedClass.section && { section: selectedClass.section }),
      ...(selectedClass.semester && { semester: selectedClass.semester }),
      ...(selectedClass.department && { department: selectedClass.department }),
      ...(selectedClass.classCode && selectedClass.section && {
        class_section:
          selectedClass.classCode + "-" + selectedClass.section
      })
    };

    /* ---------- UPDATE STUDENT DOC (MERGE) ---------- */
    await setDoc(studentDocRef, studentUpdate, { merge: true });

    /* ---------- UPDATE USER META ---------- */
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        firstLogin: false,
        passwordUpdatedAt: serverTimestamp()
      },
      { merge: true }
    );

    msg.style.color = "green";
    msg.innerText = "Password set successfully! Redirecting...";

    setTimeout(() => {
      location.replace("dashboard.html");
    }, 1200);

  } catch (err) {
    console.error(err);
    msg.innerText = err.message;
  }
});
