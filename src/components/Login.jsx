// src/pages/Login.jsx
import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

// onSwitchToSignUp: 회원가입 화면으로 전환하는 함수 (LoginPage에서 내려줌)
function Login({ onSwitchToSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("로그인 성공!");
      navigate("/"); // 메인 페이지로 이동
    } catch (error) {
      alert("로그인 실패: " + error.message);
    }
  };

  return (
    <div id="login-container">
      <h2 id="login-title">Login</h2>
      <form id="login-form" onSubmit={handleLogin}>
        <input
          id="login-email"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="login-password"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button id="login-submit" type="submit">
          로그인
        </button>
      </form>

      {/* type="button"이어야 form이 제출되지 않고 화면만 전환됨 */}
      <button id="login-switch" type="button" onClick={onSwitchToSignUp}>
        계정이 없으신가요? 회원가입
      </button>
    </div>
  );
}

export default Login;
