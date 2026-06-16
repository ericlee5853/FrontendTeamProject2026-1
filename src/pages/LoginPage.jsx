// src/pages/LoginPage.jsx
import { useState } from "react";
import Login from "../components/Login";
import SignUp from "../components/SignUp";
import "../css/AuthPage.css";   // 로그인/회원가입 화면 스타일

export default function LoginPage() {

  // false: 로그인 화면(기본), true: 회원가입 화면
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div id="auth-page">
      {showSignUp ? (
        // 회원가입 화면 → "로그인"을 누르면 다시 로그인 화면으로
        <SignUp onSwitchToLogin={() => setShowSignUp(false)} />
      ) : (
        // 로그인 화면 → "회원가입"을 누르면 회원가입 화면으로
        <Login onSwitchToSignUp={() => setShowSignUp(true)} />
      )}
    </div>
  );
}
