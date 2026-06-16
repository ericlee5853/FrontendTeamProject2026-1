// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase 콘솔에서 복사한 config 객체
const firebaseConfig = {
  apiKey: "AIzaSyAxm2jbFejFQDalH6irJtyOszrekIc9jH4",
  authDomain: "test1-eaf41.firebaseapp.com",
  projectId: "test1-eaf41",
  storageBucket: "test1-eaf41.firebasestorage.app",
  messagingSenderId: "859291971632",
  appId: "1:859291971632:web:a225d1bfe427473279fdf5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 다른 파일에서 쓸 수 있도록 내보내기 (가장 중요한 부분)
export const auth = getAuth(app);
export const db = getFirestore(app);




