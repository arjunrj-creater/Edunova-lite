import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { doc, getDoc } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (!snap.exists()) {
    document.getElementById("pName").innerText = "-";
    document.getElementById("pEmail").innerText = user.email || "-";
    document.getElementById("pRole").innerText = "-";
    document.getElementById("pRef").innerText = "-";
    return;
  }

  const data = snap.data();

  document.getElementById("pName").innerText = data.name || "-";
  document.getElementById("pEmail").innerText = data.email || user.email || "-";
  document.getElementById("pRole").innerText = (data.role || "-").toUpperCase();
  document.getElementById("pRef").innerText = data.refId || data.mentorId || data.facultyId || "-";
});
