// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase 콘솔에서 복사한 config 객체
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: "messenger-api-470ca.firebasestorage.app",
  messagingSenderId: "588688662251",
  appId: "1:588688662251:web:81094ed8692f326361e8ae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 다른 파일에서 쓸 수 있도록 내보내기 (가장 중요한 부분)
export const auth = getAuth(app);
export const db = getFirestore(app);

