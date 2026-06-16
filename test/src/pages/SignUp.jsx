// src/pages/SignUp.jsx (또는 회원가입 담당 파일)
import { useState } from "react";
import { auth, db } from "../firebase"; // 반드시 본인의 firebase.js 경로 확인
import { createUserWithEmailAndPassword } from "firebase/auth";
// [핵심] setDoc과 doc 함수를 반드시 임포트해야 함
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // 피그마 시안에 꽂아줄 유저의 실제 이름 상태
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !name.trim()) return;

    try {
      // 1. Firebase Authentication에 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // 가입 완료된 유저 객체 (여기에 uid가 들어있음)

      // 2. [가장 중요] 가입된 유저의 UID를 '문서 ID'로 지정하여 users 컬렉션에 자동 저장
      // doc(db, "컬렉션명", "원하는문서ID")
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name: name.trim(), // 유저가 입력한 실제 이름 (이은표, 오명석, 김재호 등)
        createdAt: serverTimestamp() // 가입 일자 자동 기록
      });

      alert("회원가입 및 프로필 생성 성공!");
      navigate("/"); // 메인 화면으로 이동
    } catch (err) {
      console.error("회원가입 에러:", err);
      alert("회원가입 실패: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>회원가입</h2>
      <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="text" placeholder="이름 (피그마 표시용)" value={name} onChange={e => setName(e.target.value)} required />
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">가입하기</button>
      </form>
    </div>
  );
}