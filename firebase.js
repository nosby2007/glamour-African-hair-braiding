import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCSpkvRKMXCXVhfcx7HYbV4IQsqeLvWOvQ",
  authDomain: "calmloop.firebaseapp.com",
  projectId: "calmloop",
  storageBucket: "calmloop.firebasestorage.app",
  messagingSenderId: "988412283883",
  appId: "1:988412283883:web:a26e4bf4e2778f48de67ae"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
