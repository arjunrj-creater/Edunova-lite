/* =====================
   FIREBASE IMPORTS
===================== */
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =====================
   COUNTS + STATE
===================== */
let mentorCount = 0;
let facultyCount = 0;
let studentsCount = 0;

let mentors = [];
let faculties = [];
let students = [];

/* =====================
   SIDEBAR CONTROL
===================== */
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleSidebar(){
  sidebar.classList.add("open");
  overlay.classList.add("show");
}

function closeSidebar(){
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

/* =====================
   SIDEBAR NAVIGATION
===================== */
/* =====================
   SIDEBAR NAVIGATION (FIXED)
===================== */
document.querySelectorAll(".sidebar a[data-target]").forEach(link => {
  link.addEventListener("click", () => {
    const id = link.dataset.target;
    const targetEl = document.getElementById(id);

    if (!targetEl) {
      console.warn("Sidebar target not found:", id);
      return;
    }

    // hide all cards
    document.querySelectorAll(".card").forEach(c =>
      c.classList.add("hidden")
    );

    // show selected
    targetEl.classList.remove("hidden");

    // active link
    document.querySelectorAll(".sidebar a").forEach(a =>
      a.classList.remove("active")
    );
    link.classList.add("active");

    closeSidebar();

    if (id === "studentApproval") {
      loadPendingStudents();
    }
  });
});
function openProfile(){
  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );

  document.getElementById("profileCard").classList.remove("hidden");

  document.querySelectorAll(".sidebar a").forEach(a =>
    a.classList.remove("active")
  );

  closeSidebar();
}

/* =====================
   DASHBOARD QUICK NAV
===================== */
function openFacultyFromDashboard(){ openSection("faculty"); }
function openMentorFromDashboard(){ openSection("mentor"); }

function openSection(id){
  const targetEl = document.getElementById(id);
  if (!targetEl) {
    console.warn("openSection target not found:", id);
    return;
  }

  document.querySelectorAll(".card").forEach(c =>
    c.classList.add("hidden")
  );

  targetEl.classList.remove("hidden");

  document.querySelectorAll(".sidebar a").forEach(a =>
    a.classList.toggle("active", a.dataset.target === id)
  );
}
/* =====================
   AUTO PASSWORD
===================== */
function autoPassword(role){
  const name = document.getElementById(role + "Name").value.trim();
  const id = document.getElementById(role + "Id").value.trim();

  if (!name || !id) return alert("Enter Name & ID");

  document.getElementById(role + "Pass").value =
    name.replace(/\s+/g,"").slice(0,3).toLowerCase() + id + "@2026";
}

/* =====================
   CREATE MENTOR
===================== */
async function createMentor(){
  const name = mentorName.value.trim();
  const id = mentorId.value.trim();
  const pass = mentorPass.value.trim();
  if (!name || !id || !pass) return alert("All fields required");

  try {
    const cred = await createUserWithEmailAndPassword(auth, `${id}@edunova.com`, pass);
    const uid = cred.user.uid;

    await setDoc(doc(db,"users",uid),{ name, role:"mentor", mentorId:id, firstLogin:true });
    await setDoc(doc(db,"mentors",uid),{ name, mentorId:id });

    mentorName.value = mentorId.value = mentorPass.value = "";
    loadMentorsFromDB();
  } catch(e){ alert(e.message); }
}

/* =====================
   LOAD MENTORS
===================== */
async function loadMentorsFromDB(){
  mentors=[]; mentorList.innerHTML="";
  const snap = await getDocs(query(collection(db,"users"), where("role","==","mentor")));
  snap.forEach(d=>mentors.push(d.data()));
  document.getElementById("mentorCount").innerText = mentors.length;
  renderMentors();
}

function renderMentors(){
  mentorList.innerHTML="";
  mentors.forEach(m=>{
    mentorList.innerHTML += `
      <tr>
      <td>${m.name}</td>
      <td>${m.mentorId}</td>
      <td>${m.firstLogin === false ? "Active" : "Not Active"}</td>
      <td>****</td>
      </tr>`;
  });
}

/* =====================
   CREATE FACULTY
===================== */
async function createFaculty(){
  const name = facultyName.value.trim();
  const id = facultyId.value.trim();
  const pass = facultyPass.value.trim();
  if (!name || !id || !pass) return alert("All fields required");

  try {
    const cred = await createUserWithEmailAndPassword(auth, `${id}@edunova.com`, pass);
    const uid = cred.user.uid;

    await setDoc(doc(db,"users",uid),{ name, role:"faculty", firstLogin:true });
    await setDoc(doc(db,"faculties",uid),{ name, facultyId:id });

    facultyName.value = facultyId.value = facultyPass.value = "";
    loadFacultyFromDB();
  } catch(e){ alert(e.message); }
}

/* =====================
   LOAD FACULTY
===================== */
async function loadFacultyFromDB(){
  faculties=[]; facultyList.innerHTML="";
  const snap = await getDocs(query(collection(db,"users"), where("role","==","faculty")));
  snap.forEach(d=>faculties.push(d.data()));
  document.getElementById("facultyCount").innerText = faculties.length;
  renderFaculty();
}

function renderFaculty(){
  facultyList.innerHTML="";
  faculties.forEach(f=>{
    facultyList.innerHTML+=`
      <tr><td>${f.name}</td><td>${f.facultyId}</td><td>${f.firstLogin === false ? "Active" : "Not Active"}</td><td>****</td></tr>`;
  });
}

/* =====================================================
   ✅ STUDENT APPROVAL (NEW – IMPORTANT PART)
===================================================== */
async function loadPendingStudents(){
  const list = document.getElementById("pendingStudentList");
  if (!list) return;

  list.innerHTML = "";
  pendingStudents = [];

  const snap = await getDocs(
    query(collection(db,"students"), where("status","==","pending"))
  );

  snap.forEach(d=>{
    const s = d.data();
    pendingStudents.push({ id:d.id, ...s });

    list.innerHTML += `
      <tr>
        <td>${s.studentId}</td>
        <td>${s.name}</td>
        <td>${s.mentorUid}</td>
        <td>
          <button onclick="approveSingleStudent('${d.id}')">
            Approve
          </button>
        </td>
      </tr>`;
  });
}

async function approveAllStudents(){
  if (!pendingStudents.length) {
    alert("No pending students");
    return;
  }

  for (const s of pendingStudents){
    try {
      const email = `${s.studentId}@edunova.com`;
      const password = s.passwordHint || "Temp@123";

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db,"users",cred.user.uid), {
        role: "student",
        studentId: s.studentId,
        firstLogin: true,
        createdAt: new Date()
      });

      await updateDoc(doc(db,"students", s.docId), {
        authCreated: true
      });

    } catch (err) {
      console.error("Approve failed:", s.studentId, err.message);
    }
  }

  alert("All students approved successfully");
  loadPendingStudents();
}
async function approveSingleStudent(docId){
  const ref = doc(db,"students",docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const s = snap.data();

  try{
    const cred = await createUserWithEmailAndPassword(
      auth,
      `${s.studentId}@edunova.com`,
      s.passwordHint || "Temp@123"
    );

    await setDoc(doc(db,"users",cred.user.uid),{
      role:"student",
      studentId:s.studentId,
      firstLogin:true,
      createdAt:new Date()
    });

    await updateDoc(ref,{
      status:"active",
      approvedAt:new Date()
    });

    loadPendingStudents();
    loadApprovedStudents();

  }catch(err){
    alert("Approval failed: " + err.message);
  }
}
async function loadApprovedStudents(){
  const list = document.getElementById("approvedStudentList");
  if (!list) return;

  list.innerHTML = "";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const snap = await getDocs(
    query(collection(db,"students"), where("status","==","active"))
  );

  snap.forEach(d=>{
    const s = d.data();
    if (!s.approvedAt) return;

    const approvedDate = s.approvedAt.toDate
      ? s.approvedAt.toDate()
      : new Date(s.approvedAt);

    if (approvedDate >= sevenDaysAgo){
      list.innerHTML += `
        <tr>
          <td>${s.studentId}</td>
          <td>${s.name}</td>
          <td>${approvedDate.toLocaleDateString()}</td>
          <td>
            <button onclick="revokeStudent('${d.id}')">
              Revoke
            </button>
          </td>
        </tr>`;
    }
  });
}
async function revokeStudent(docId){
  if (!confirm("Revoke this student?")) return;

  await updateDoc(doc(db,"students",docId),{
    status:"revoked"
  });

  loadApprovedStudents();
}


/* =====================
   AUTH STATE
===================== */
onAuthStateChanged(auth, user=>{
  if(user){
    loadMentorsFromDB();
    loadFacultyFromDB();
  }
});

/* =====================
   LOGOUT
===================== */
async function logout(){
  await signOut(auth);
  window.location.href="../index.html";
}

/* =====================
   EXPOSE
===================== */
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.openFacultyFromDashboard = openFacultyFromDashboard;
window.openMentorFromDashboard = openMentorFromDashboard;
window.autoPassword = autoPassword;
window.createMentor = createMentor;
window.createFaculty = createFaculty;
window.logout = logout;
window.approveAllStudents = approveAllStudents;
window.approveSingleStudent = approveSingleStudent;
window.loadApprovedStudents = loadApprovedStudents;
window.revokeStudent = revokeStudent;

/* =====================
   ADVANCE ALL STUDENTS SEMESTER
   - increments `semester` (numeric) for every user with role 'student'
   - archives previous semester values in `archivedSemesters`
 ===================== */
async function advanceAllSemesters(){
  if(!confirm('Advance all students to next semester? This cannot be easily undone.')) return;

  try{
    const snap = await getDocs(query(collection(db,'users'), where('role','==','student')));
    let updated = 0;

    for(const d of snap.docs){
      const data = d.data();
      const ref = doc(db,'users', d.id);

      // parse semester as number if possible
      let sem = null;
      if (data.semester === undefined || data.semester === null) {
        sem = null;
      } else if (typeof data.semester === 'number') {
        sem = data.semester;
      } else if (typeof data.semester === 'string') {
        const m = data.semester.match(/\d+/);
        sem = m ? parseInt(m[0],10) : null;
      }

      if (sem === null) continue; // skip users without semester

      const nextSem = Math.min(8, sem + 1);

      await updateDoc(ref, {
        semester: nextSem,
        archivedSemesters: arrayUnion(sem),
        semesterUpdatedAt: serverTimestamp()
      });

      updated++;
    }

    alert(`Updated semester for ${updated} students`);
  }catch(err){
    console.error('Advance all semesters failed', err);
    alert('Failed to advance semesters: ' + (err.message || err));
  }
}

window.advanceAllSemesters = advanceAllSemesters;
