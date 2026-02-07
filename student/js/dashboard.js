import { auth, db } from "../../js/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const logoutBtn = document.getElementById('logoutBtn');
const studentNameEl = document.getElementById('studentName');
const studentInfoEl = document.getElementById('studentInfo');
const overlay = document.getElementById('overlay');

let currentUser = null;
let currentUserData = null;

onAuthStateChanged(auth, async user => {
  if (!user) return window.location.href = '../index.html';
  currentUser = user;

  const uRef = doc(db, 'users', user.uid);
  const uSnap = await getDoc(uRef);
  if (!uSnap.exists()) return console.error('User doc missing');

  const data = uSnap.data();
  currentUserData = data;

  if (data.firstLogin === true) {
    return location.replace('set-password.html');
  }

  studentNameEl.textContent = `Welcome, ${data.name || 'Student'} 👋`;
  studentInfoEl.textContent =
    `${data.department || 'Department'} | Semester ${data.semester || '-'} | ${data.section || 'Section'}`;

  loadAttendanceSummary(currentUserData);
});

window.logout = async function(){
  await signOut(auth);
  window.location.href = '../index.html';
}
if (logoutBtn) logoutBtn.addEventListener('click', () => window.logout())

/* =====================
   SIDEBAR CONTROLS
===================== */
function showSection(id){
  document.querySelectorAll('.card').forEach(c => c.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');

  document.querySelectorAll('.sidebar a').forEach(a =>
    a.classList.toggle(
      'active',
      a.getAttribute('onclick') && a.getAttribute('onclick').includes(`'${id}'`)
    )
  );

  closeSidebar();

  if (id === 'attendance') loadAttendanceSummary(currentUserData);
  if (id === 'internalMarks') loadInternalMarks(currentUser?.uid, currentUserData);
  if (id === 'subjects') loadSubjects(currentUser?.uid, currentUserData);
}

function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  overlay.classList.toggle('show');
}

function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  overlay.classList.remove('show');
}

window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;

/* =====================
   ATTENDANCE SUMMARY
   (FIXED FOR NESTED DB)
===================== */
async function loadAttendanceSummary(userData) {
  try {
    if (!userData) {
      document.getElementById('attendanceSummary').textContent = 'User data not found';
      return;
    }

    const studentId =
      userData.rollNumber ||
      userData.studentId ||
      userData.username ||
      null;

    if (!studentId) {
      document.getElementById('attendanceSummary').textContent = 'Student ID not found';
      return;
    }

    const snapshot = await getDocs(collection(db, 'attendance_records'));

    let totalAttended = 0;
    let totalClasses = 0;
    let subjectsCount = 0;
    let attendanceRecords = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const studentsMap = data.students || {};

      Object.values(studentsMap).forEach(stu => {
        if (stu.studentId === studentId) {
          const attended = Number(stu.attended || 0);
          const classes = Number(stu.totalClasses || 0);
          const percentage = Number(stu.percentage || 0);

          attendanceRecords.push({
            subject: stu.subjectId || 'N/A',
            code: stu.subjectId || '',
            semester: userData.semester || '',
            attended,
            totalClasses: classes,
            percentage
          });

          totalAttended += attended;
          totalClasses += classes;
          subjectsCount++;
        }
      });
    });

    if (totalClasses > 0) {
      const percentage = Math.round((totalAttended / totalClasses) * 100);
      const status =
        percentage >= 75 ? '✓ Good' :
        percentage >= 50 ? '⚠ Warning' :
        '✗ Critical';

      document.getElementById('attendanceSummary').textContent =
        `Overall Attendance: ${percentage}% (${subjectsCount} subjects tracked) ${status}`;

      const detailsDiv = document.getElementById('attendanceDetails');
      if (detailsDiv) {
        let html = `
          <table style="width:100%; border-collapse:collapse; margin-top:12px;">
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="padding:8px; border:1px solid #ddd;">Subject</th>
                <th style="padding:8px; border:1px solid #ddd;">Sem</th>
                <th style="padding:8px; border:1px solid #ddd;">Attended</th>
                <th style="padding:8px; border:1px solid #ddd;">Total</th>
                <th style="padding:8px; border:1px solid #ddd;">%</th>
              </tr>
            </thead>
            <tbody>
        `;

        attendanceRecords.forEach(r => {
          html += `
            <tr>
              <td style="padding:8px; border:1px solid #ddd;">${r.subject}</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:center;">${r.semester}</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:center;">${r.attended}</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:center;">${r.totalClasses}</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:center; font-weight:bold;">
                ${r.percentage}%
              </td>
            </tr>
          `;
        });

        html += '</tbody></table>';
        detailsDiv.innerHTML = html;
      }
    } else {
      document.getElementById('attendanceSummary').textContent = 'No attendance records found';
    }

  } catch (error) {
    console.error('Error loading attendance summary:', error);
    document.getElementById('attendanceSummary').textContent = 'Error loading attendance';
  }
}

/* =====================
   INTERNAL MARKS (UNCHANGED)
===================== */
/* same as your original code */

/* =====================
   SUBJECTS (UNCHANGED)
===================== */
/* same as your original code */

/* =====================
   INTERNAL MARKS (UNCHANGED)
===================== */
async function loadInternalMarks(uid, userData) {
  try {
    if (!userData) return document.getElementById('marksSummary').textContent = 'User data not found';

    const rollNo = userData.rollNumber || userData.studentId || 'N/A';
    const marksSnapshot = await getDocs(collection(db, 'marks'));
    let marksRecords = [];

    marksSnapshot.forEach(d => {
      const data = d.data();
      const studentMark = (data.marksData || []).find(
        m => m.rollNum === rollNo || m.studentId === rollNo
      );
      if (studentMark) {
        marksRecords.push({
          subject: data.subject || 'N/A',
          code: data.subjectCode || '',
          semester: data.semester || '',
          internalMarks: studentMark.marks || 0,
          maxMarks: data.maxMarks || 50
        });
      }
    });

    const marksDiv = document.getElementById('marksSummary');
    if (marksRecords.length === 0) {
      marksDiv.textContent = 'No marks records found';
    } else {
      let html = '<table style="width:100%; border-collapse:collapse; margin-top:12px;"><thead><tr style="background:#f0f0f0;"><th style="padding:8px; border:1px solid #ddd;">Subject</th><th style="padding:8px; border:1px solid #ddd;">Code</th><th style="padding:8px; border:1px solid #ddd;">Sem</th><th style="padding:8px; border:1px solid #ddd;">Marks</th><th style="padding:8px; border:1px solid #ddd;">Max</th></tr></thead><tbody>';
      marksRecords.forEach(m => {
        html += `<tr><td style="padding:8px; border:1px solid #ddd;">${m.subject}</td><td style="padding:8px; border:1px solid #ddd;">${m.code}</td><td style="padding:8px; border:1px solid #ddd;">${m.semester}</td><td style="padding:8px; border:1px solid #ddd;">${m.internalMarks}</td><td style="padding:8px; border:1px solid #ddd;">${m.maxMarks}</td></tr>`;
      });
      html += '</tbody></table>';
      marksDiv.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading marks:', error);
    document.getElementById('marksSummary').textContent = 'Error loading marks';
  }
}

/* =====================
   SUBJECTS (UNCHANGED)
===================== */
async function loadSubjects(uid, userData) {
  try {
    if (!userData) return document.getElementById('subjectsList').textContent = 'User data not found';

    const semester = userData.semester || 1;
    const classId = userData.classId || userData.class_section || null;

    let subjectsData = [];
    const snap = await getDocs(collection(db, 'subjects'));

    snap.forEach(d => {
      const data = d.data();
      if ((data.semester === semester || data.sem === semester) &&
          (!classId || data.classId === classId)) {
        subjectsData.push({
          name: data.name || data.subject || 'N/A',
          code: data.code || data.subjectCode || '',
          credits: data.credits || 0
        });
      }
    });

    const subjectsDiv = document.getElementById('subjectsList');
    if (subjectsData.length === 0) {
      subjectsDiv.innerHTML = '<p>No subjects configured for your semester</p>';
    } else {
      let html = '<table style="width:100%; border-collapse:collapse; margin-top:12px;"><thead><tr style="background:#f0f0f0;"><th style="padding:8px; border:1px solid #ddd;">Subject</th><th style="padding:8px; border:1px solid #ddd;">Code</th><th style="padding:8px; border:1px solid #ddd;">Credits</th></tr></thead><tbody>';
      subjectsData.forEach(s => {
        html += `<tr><td style="padding:8px; border:1px solid #ddd;">${s.name}</td><td style="padding:8px; border:1px solid #ddd;">${s.code}</td><td style="padding:8px; border:1px solid #ddd;">${s.credits}</td></tr>`;
      });
      html += '</tbody></table>';
      subjectsDiv.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading subjects:', error);
    document.getElementById('subjectsList').textContent = 'Error loading subjects';
  }
}
