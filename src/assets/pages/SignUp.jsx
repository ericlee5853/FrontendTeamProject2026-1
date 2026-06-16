import { useState } from "react";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("회원가입 완료! 로그인 페이지로 이동합니다.");
      navigate("/login"); // 성공 시 이동
    } catch (error) {
      alert("에러 발생: " + error.message);
    }
  };

  return (
    <div>
      <h2>회원가입</h2>
      <form onSubmit={handleSignUp}>
        <input type="email" placeholder="이메일" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호(6자 이상)" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">가입하기</button>
      </form>
      <button onClick={() => navigate("/login")}>이미 계정이 있나요? 로그인</button>
    </div>
  );
}

export default SignUp;