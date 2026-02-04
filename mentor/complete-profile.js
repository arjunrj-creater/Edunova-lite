import { auth, db } from "../js/firebase.js";
import { onAuthStateChanged, updatePassword } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser;
let mentorRef;

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("../index.html");
    return;
  }

  currentUser = user;
  mentorRef = doc(db, "mentors", user.uid);

  const snap = await getDoc(mentorRef);
  if (!snap.exists()) return;

  const data = snap.data();

  if (data.profileCompleted) {
    location.replace("dashboard.html");
    return;
  }

  document.getElementById("mentorClass").value = data.classId;
});

window.saveProfile = async () => {
  const name = mentorName.value.trim();
  const password = newPassword.value.trim();
  const msg = document.getElementById("msg");

  if (!name || password.length < 6) {
    msg.innerText = "Enter name and valid password";
    msg.style.color = "red";
    return;
  }

  try {
    await updatePassword(currentUser, password);

    await updateDoc(mentorRef, {
      name,
      profileCompleted: true
    });

    location.replace("dashboard.html");

  } catch (err) {
    msg.innerText = err.message;
    msg.style.color = "red";
  }
};
