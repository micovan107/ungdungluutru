// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7cc6BCivqXBkvyVAN7IJfWwIdzlyHvLc",
    authDomain: "luutrutailieu-8b8a9.firebaseapp.com",
    projectId: "luutrutailieu-8b8a9",
    storageBucket: "luutrutailieu-8b8a9.firebasestorage.app",
    messagingSenderId: "546483705627",
    appId: "1:546483705627:web:6657f231053dc66c86e5be",
    measurementId: "G-P9899B32DX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, onAuthStateChanged, signOut };