import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ---------- AUTH + FIRST LOGIN CHECK ---------- */
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  try {
    const uid = user.uid;

    // 🔑 check users collection
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) {
      alert("User profile missing");
      await signOut(auth);
      location.replace("../index.html");
      return;
    }

    const userData = userSnap.data();

    // 🔄 First login
    if (userData.firstLogin === true) {
      location.replace("set-password.html");
      return;
    }

    // 👤 Load student profile
    loadStudentProfile(uid);

    // 📊 Load data
    loadAttendance();
    loadMarks();
    loadResults();

  } catch (err) {
    console.error("Student auth check failed", err);
  }
});

/* ---------- LOGOUT ---------- */
window.logout = async () => {
  await signOut(auth);
  location.replace("../index.html");
};

/* ---------- SECTION NAVIGATION ---------- */
window.showSection = function (id) {
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );

  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");
};

/* ---------- LOAD PROFILE ---------- */
async function loadStudentProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "students", uid));

    if (!snap.exists()) {
      alert("Student profile not found");
      return;
    }

    const s = snap.data();

    document.getElementById("studentName").innerText = s.name || "-";
    document.getElementById("studentId").innerText = s.studentId || "-";
    document.getElementById("studentClass").innerText = s.classId || "-";

  } catch (err) {
    console.error("Failed to load student profile", err);
  }
}

/* ---------- LOAD ATTENDANCE ---------- */
async function loadAttendance() {
  const attendanceList = document.getElementById("attendanceList");
  if (!attendanceList) return;

  attendanceList.innerHTML = "";

  try {
    const uid = auth.currentUser.uid;
    const snap = await getDocs(collection(db, "attendance"));

    snap.forEach(d => {
      const a = d.data();
      if (a.records && a.records[uid]) {
        attendanceList.innerHTML += `
          <tr>
            <td>${a.subjectId}</td>
            <td>${a.records[uid]}</td>
          </tr>
        `;
      }
    });

  } catch (err) {
    console.error("Failed to load attendance", err);
  }
}

/* ---------- LOAD MARKS ---------- */
async function loadMarks() {
  const markList = document.getElementById("markList");
  if (!markList) return;

  markList.innerHTML = "";

  try {
    const uid = auth.currentUser.uid;
    const snap = await getDocs(collection(db, "marks"));

    snap.forEach(d => {
      const m = d.data();
      if (m.marks && m.marks[uid] !== undefined) {
        markList.innerHTML += `
          <tr>
            <td>${m.subjectId}</td>
            <td>${m.marks[uid]}</td>
          </tr>
        `;
      }
    });

  } catch (err) {
    console.error("Failed to load marks", err);
  }
}

/* ---------- LOAD RESULTS ---------- */
async function loadResults() {
  const resultList = document.getElementById("resultList");
  if (!resultList) return;

  resultList.innerHTML = "";

  try {
    const uid = auth.currentUser.uid;
    const snap = await getDocs(collection(db, "marks"));

    snap.forEach(d => {
      const m = d.data();
      if (m.marks && m.marks[uid] !== undefined) {
        const mark = m.marks[uid];
        resultList.innerHTML += `
          <tr>
            <td>${m.subjectId}</td>
            <td>${mark}</td>
            <td>${mark >= 40 ? "PASS" : "FAIL"}</td>
          </tr>
        `;
      }
    });

  } catch (err) {
    console.error("Failed to load results", err);
  }
}
