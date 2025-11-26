// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4_gBwJHYvVjqgr_ATOV80IG1nHhbki1Y",
  authDomain: "isac-cbd0a.firebaseapp.com",
  projectId: "isac-cbd0a",
  storageBucket: "isac-cbd0a.firebasestorage.app",
  messagingSenderId: "676965754838",
  appId: "1:676965754838:web:529983897adcb36138a677",
  measurementId: "G-4Z2RBSY1VD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };