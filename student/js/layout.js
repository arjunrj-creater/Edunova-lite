// SIMPLE, GUARANTEED HAMBURGER TOGGLE

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

menuBtn.addEventListener("click", function () {
  sidebar.classList.toggle("open");
});
