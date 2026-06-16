import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div style={{ width: "80px", backgroundColor: "#2d2d2d", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
      <button onClick={() => setActiveTab("chat")} style={{ width: "60px", padding: "12px 0", marginBottom: "15px", backgroundColor: activeTab === "chat" ? "#4a4a4a" : "transparent", color: "white", border: "none", cursor: "pointer" }}>채팅</button>
      <button onClick={() => setActiveTab("friend")} style={{ width: "60px", padding: "12px 0", marginBottom: "auto", backgroundColor: activeTab === "friend" ? "#4a4a4a" : "transparent", color: "white", border: "none", cursor: "pointer" }}>친구</button>
      <button onClick={() => signOut(auth)} style={{ width: "60px", padding: "6px 0", fontSize: "11px", backgroundColor: "#cc0000", color: "white", border: "none", cursor: "pointer" }}>로그아웃</button>
    </div>
  );
}