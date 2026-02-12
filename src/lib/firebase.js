// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC91oXCOYGVjASn54E9sbGLiLzumYkxu34",
  authDomain: "mini-project-40b8c.firebaseapp.com",
  projectId: "mini-project-40b8c",
  storageBucket: "mini-project-40b8c.firebasestorage.app",
  messagingSenderId: "197937177960",
  appId: "1:197937177960:web:0220811442bcded6bea2dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;