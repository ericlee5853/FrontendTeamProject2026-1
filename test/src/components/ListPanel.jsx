// src/components/ListPanel.jsx
export default function ListPanel({ 
  activeTab, searchEmail, setSearchEmail, handleSendFriendRequest, 
  pendingRequests, handleAcceptFriend, friends, handleCreateGroupRoom, 
  rooms, selectedRoomId, setSelectedRoomId, setCurrentRoomName 
}) {
  return (
    <div style={{ width: "300px", backgroundColor: "#252526", borderRight: "1px solid #3c3c3c", padding: "20px", display: "flex", flexDirection: "column", color: "white" }}>
      {activeTab === "friend" ? (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <h3>친구 목록</h3>
          <form onSubmit={handleSendFriendRequest} style={{ display: "flex", gap: "5px", marginBottom: "20px" }}>
            <input type="email" placeholder="친구 이메일 검색..." value={searchEmail} onChange={e => setSearchEmail(e.target.value)} style={{ flex: 1, padding: "8px", backgroundColor: "#3c3c3c", color: "white", border: "1px solid #3c3c3c" }} required />
            <button type="submit" style={{ padding: "8px 12px", backgroundColor: "#0e639c", color: "white", border: "none", cursor: "pointer" }}>요청</button>
          </form>

          {pendingRequests.length > 0 && (
            <div style={{ background: "#332a15", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>
              <h5 style={{ margin: "0 0 8px 0", color: "#f1c40f" }}>받은 요청 수락 대기</h5>
              {pendingRequests.map(req => (
                <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                  <span>ID: {req.senderId.substring(0, 5)}...</span>
                  <button onClick={() => handleAcceptFriend(req.id)} style={{ padding: "3px 8px", backgroundColor: "#4a7a4a", color: "white", border: "none", cursor: "pointer" }}>수락</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {friends.map(f => (
              <div key={f.uid} style={{ padding: "12px", background: "#2d2d2d", marginBottom: "8px", borderRadius: "4px" }}>
                <strong>{f.name}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <h3>채팅방</h3>
          
          {/* [기능 추가] 클릭 시 새로운 빈 대화방을 생성하는 버튼 */}
          <button 
            onClick={handleCreateGroupRoom}
            style={{ padding: "10px", marginBottom: "15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            + 새 대화방 만들기
          </button>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {rooms.map(room => (
              <div key={room.id} onClick={() => { setSelectedRoomId(room.id); setCurrentRoomName(room.displayName); }} style={{ padding: "12px", marginBottom: "8px", cursor: "pointer", backgroundColor: selectedRoomId === room.id ? "#37373d" : "#2d2d2d", borderRadius: "4px" }}>
                <strong>{room.displayName}</strong>
                <div style={{ fontSize: "12px", color: "#cccccc", marginTop: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.lastMessage}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}