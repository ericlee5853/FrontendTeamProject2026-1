import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
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
    <div>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="이메일" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">로그인</button>
      </form>
      <button onClick={() => navigate("/signup")}>계정이 없으신가요? 회원가입</button>
    </div>
  );
}

export default Login;