// src/components/Menu.jsx
// (기존 Sidebar.jsx 를 Menu 로 이름 변경)
// 작동 원리: 좌측 메뉴 영역. 채팅/친구 탭 전환과 로그아웃을 담당함.
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Menu({ activeTab, setActiveTab }) {
  return (
    <div id="menu-container">
      <button
        id="btn-tab-friend"
        className={activeTab === "friend" ? "tab-active" : "tab-inactive"}
        onClick={() => setActiveTab("friend")}
      >
        친구
      </button>
      
      <button
        id="btn-tab-chat"
        className={activeTab === "chat" ? "tab-active" : "tab-inactive"}
        onClick={() => setActiveTab("chat")}
      >
        채팅
      </button>
      
      <button id="btn-logout" onClick={() => signOut(auth)}>
        로그아웃
      </button>
    </div>
  );
}
