import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SignUp({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const generateFriendCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "#";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !name.trim()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      
      const newFriendCode = generateFriendCode();

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        friendCode: newFriendCode,
        createdAt: serverTimestamp(),
      });

      alert(`회원가입 성공! 당신의 친구 코드는 ${newFriendCode} 입니다.`);
      navigate("/");
    } catch (err) {
      console.error("회원가입 에러:", err);
      alert("회원가입 실패: " + err.message);
    }
  };

  return (
    <div id="signup-container" className="auth-container">
      <h2 id="signup-title">회원가입</h2>
      <form id="signup-form" onSubmit={handleSignUp}>
        <input
          id="signup-name"
          className="auth-input"
          type="text"
          placeholder="닉네임"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          id="signup-email"
          className="auth-input"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          id="signup-password"
          className="auth-input"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button id="signup-submit" className="auth-btn-submit" type="submit">
          가입하기
        </button>
      </form>

      {onSwitchToLogin && (
        <button id="signup-switch" className="auth-btn-switch" type="button" onClick={onSwitchToLogin}>
          이미 계정이 있으신가요? 로그인
        </button>
      )}
    </div>
  );
}