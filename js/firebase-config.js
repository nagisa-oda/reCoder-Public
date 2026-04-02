import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyArP0an90Vzshlzy80zETx0IHCQy3QLG3w",
    authDomain: "connector-6ce08.firebaseapp.com",
    projectId: "connector-6ce08",
    storageBucket: "connector-6ce08.firebasestorage.app",
    messagingSenderId: "568830060410",
    appId: "1:568830060410:web:55efd326158a5a5ca758c3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);