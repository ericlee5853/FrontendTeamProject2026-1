// src/components/ChatWindow.jsx
import { useState } from "react";

export default function ChatWindow({ selectedRoomId, currentRoomName, messages, user, inputText, setInputText, handleSendMessage, friends, handleInviteUser }) {
  const [selectedFriendUid, setSelectedFriendUid] = useState("");

  if (!selectedRoomId) {
    return (
      <div style={{ flex: 1, display: "flex", backgroundColor: "#1e1e1e", color: "#777" }}>
        <div style={{ margin: "auto", textAlign: "center" }}>
          <h3>활성화된 대화창이 없습니다.</h3>
          <p>대화방을 생성하거나 선택하십시오.</p>
        </div>
      </div>
    );
  }

  const onInviteSubmit = (e) => {
    e.preventDefault();
    if (!selectedFriendUid) return;
    handleInviteUser(selectedFriendUid);
    setSelectedFriendUid(""); // 초기화
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px", backgroundColor: "#1e1e1e", color: "white" }}>
      
      {/* 상단 툴바: 대화방 이름 출력 및 상대를 초대하는 폼 결합 */}
      <div style={{ paddingBottom: "15px", borderBottom: "1px solid #3c3c3c", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{currentRoomName}</h3>
        
        {/* [기능 추가] 대화방 멤버 초대 폼 */}
        <form onSubmit={onInviteSubmit} style={{ display: "flex", gap: "5px" }}>
          <select 
            value={selectedFriendUid} 
            onChange={e => setSelectedFriendUid(e.target.value)}
            style={{ padding: "6px", backgroundColor: "#3c3c3c", color: "white", border: "1px solid #3c3c3c", borderRadius: "4px" }}
            required
          >
            <option value="">초대할 친구 선택</option>
            {friends.map(f => (
              <option key={f.uid} value={f.uid}>{f.name}</option>
            ))}
          </select>
          <button type="submit" style={{ padding: "6px 12px", backgroundColor: "#0e639c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>초대</button>
        </form>
      </div>

      {/* 대화 기록 출력 구역 */}
      <div style={{ flex: 1, overflowY: "auto", background: "#252526", padding: "15px", marginBottom: "15px", borderRadius: "8px" }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ textAlign: msg.senderId === user.uid ? "right" : "left", margin: "15px 0" }}>
            <div style={{ fontSize: "11px", color: "#858585", marginBottom: "4px" }}>
              {msg.senderName || "알 수 없는 사용자"}
            </div>
            <span style={{ backgroundColor: msg.senderId === user.uid ? "#0e639c" : "#3c3c3c", padding: "10px 14px", borderRadius: "8px", display: "inline-block" }}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* 메시지 전송 폼 */}
      <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px" }}>
        <input type="text" style={{ flex: 1, padding: "12px", backgroundColor: "#2d2d2d", color: "white", border: "1px solid #3c3c3c", borderRadius: "6px" }} value={inputText} onChange={e => setInputText(e.target.value)} placeholder="메시지를 입력하세요..." required />
        <button type="submit" style={{ padding: "0 25px", backgroundColor: "#0e639c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>전송</button>
      </form>
    </div>
  );
}