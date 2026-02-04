// Dummy student data (for semester demo)
const studentData = {
  name: "Student One",
  className: "S4 CSE",
  attendance: 82,
  marks: {
    dbms: 78,
    os: 74,
    cn: 80
  }
};

// Load data when page opens
document.getElementById("name").innerText = studentData.name;
document.getElementById("class").innerText = studentData.className;
document.getElementById("attendance").innerText = studentData.attendance;

document.getElementById("dbms").innerText = studentData.marks.dbms;
document.getElementById("os").innerText = studentData.marks.os;
document.getElementById("cn").innerText = studentData.marks.cn;

// Back navigation
function goBack() {
  window.location.href = "index.html";
}
