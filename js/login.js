import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* =========================
   🔐 LOGIN HANDLER (UNCHANGED)
========================= */

window.handleLogin = async function () {

  const roleEl = document.getElementById("role");
  const userEl = document.getElementById("username");
  const passEl = document.getElementById("password");
  const status = document.getElementById("loginStatus");
  const btn = document.getElementById("loginBtn");

  const selectedRole = roleEl.value;
  const username = userEl.value.trim();
  const password = passEl.value.trim();

  if (!username || !password) {
    status.innerText = "⚠️ Enter username & password";
    return;
  }

  btn.disabled = true;
  btn.innerText = "Logging in...";
  status.innerText = "🔄 Verifying credentials...";

  const email = username.includes("@")
    ? username
    : `${username}@edunova.com`;

  try {

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) throw new Error("User profile not found");

    const data = snap.data();


    /* =========================
       STUDENT ACCESS CONTROL
    ========================= */

    if (data.role === "student") {

      if (data.authCreated !== true) {
        throw new Error("ACCOUNT_NOT_APPROVED");
      }

      if (data.revoked === true) {
        throw new Error("ACCOUNT_REVOKED");
      }
    }


    /* =========================
       ROLE VALIDATION
    ========================= */

    if (data.role !== "hod" && data.role !== selectedRole) {
      throw new Error(`ROLE_MISMATCH:${data.role}`);
    }

    status.innerText = "✅ Login successful";

    setTimeout(() => {

      /* FIRST LOGIN */

      if (data.firstLogin === true) {

        if (data.role === "mentor")
          location.href = "mentor/set-password.html";

        else if (data.role === "faculty")
          location.href = "faculty/set-password.html";

        else if (data.role === "student")
          location.href = "student/set-password.html";

        else if (data.role === "hod")
          location.href = "hod/set-password.html";

        return;
      }

      /* DASHBOARD */

      if (data.role === "mentor")
        location.href = "mentor/dashboard.html";

      else if (data.role === "faculty")
        location.href = "faculty/dashboard.html";

      else if (data.role === "student")
        location.href = "student/dashboard.html";

      else if (data.role === "hod")
        location.href = "hod/dashboard.html";

    }, 500);

  }
  catch (err) {

    console.error(err);

    if (err.message === "ACCOUNT_NOT_APPROVED") {
      status.innerText =
        "⏳ Your account is pending approval by HOD.";
    }
    else if (err.message === "ACCOUNT_REVOKED") {
      status.innerText =
        "🚫 Your account has been revoked. Please contact HOD.";
    }
    else if (err.message.startsWith("ROLE_MISMATCH")) {
      status.innerText =
        "❌ Role mismatch. Please select the correct role.";
    }
    else {
      status.innerText =
        "❌ Invalid username or password. Please try again.";
    }

    userEl.value = "";
    passEl.value = "";

    btn.disabled = false;
    btn.innerText = "Login";
    userEl.focus();
  }

};



/* =====================
   ROLE CARD SELECT
===================== */

window.selectRole = function (role) {

  document.getElementById("role").value = role;

  document
    .querySelector(".right-panel")
    ?.scrollIntoView({ behavior: "smooth" });

};



/* =========================================================
   ⭐ AUTO ROLE FROM HOMEPAGE  (NEW — SAFE ADDITION)
   loginpage.html?role=mentor → auto select mentor
========================================================= */

const params = new URLSearchParams(window.location.search);
const roleFromHome = params.get("role");

if (roleFromHome) {

  const roleBox = document.getElementById("role");

  if (roleBox) {
    roleBox.value = roleFromHome;
  }
}



/* =========================================================
   ⭐ REGISTER POPUP (FIXED FOR MODULE MODE)
========================================================= */

window.showRegister = function(){

  const modal = document.getElementById("registerModal");

  if(modal){
    modal.classList.add("show");
  }

};

window.closeRegister = function(){

  const modal = document.getElementById("registerModal");

  if(modal){
    modal.classList.remove("show");
  }

};
/* LOGIN POLISH */

const loginBtn = document.getElementById("loginBtn");
const panel = document.querySelector(".right-panel");

if(loginBtn){

  loginBtn.addEventListener("click",()=>{
    loginBtn.classList.add("loading");
  });

}

/* SHAKE WHEN ERROR TEXT APPEARS */

const statusBox = document.getElementById("loginStatus");

const observer = new MutationObserver(()=>{
  if(statusBox.innerText.includes("❌")){
    panel.classList.add("shake");
    setTimeout(()=>panel.classList.remove("shake"),400);
    loginBtn.classList.remove("loading");
  }
});

observer.observe(statusBox,{childList:true});

/* LOCK ROLE IF FROM HOMEPAGE */

const urlParams = new URLSearchParams(window.location.search);
const r = urlParams.get("role");

if(r){
  const roleSel = document.getElementById("role");
  if(roleSel){
    roleSel.value = r;
    roleSel.style.pointerEvents="none";
    roleSel.style.background="#eef3ff";
  }
}
