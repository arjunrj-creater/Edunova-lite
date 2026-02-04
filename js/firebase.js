import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXYOhMawTE8RIic5IibKQOwu0EXRWPg7A",
  authDomain: "edunova-lite.firebaseapp.com",
  projectId: "edunova-lite",
  storageBucket: "edunova-lite.appspot.com",
  messagingSenderId: "168299852090",
  appId: "1:168299852090:web:c336579b8a83d1b512a003"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
