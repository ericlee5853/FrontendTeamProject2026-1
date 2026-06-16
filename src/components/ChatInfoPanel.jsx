import { useState, useEffect } from "react";

export default function ChatInfoPanel({ selectedRoomId, rooms, fetchUserProfile, messages, handleLeaveRoom, user }) {
  const [roomMembersData, setRoomMembersData] = useState([]);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
  const [chatSearchText, setChatSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState(-1);

  useEffect(() => {
    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    if (currentRoom) {
      const loadMembers = async () => {
        const profiles = await Promise.all(currentRoom.members.map((uid) => fetchUserProfile(uid)));
        setRoomMembersData(profiles.filter((p) => p !== null));
      };
      loadMembers();
    }
  }, [selectedRoomId, rooms, fetchUserProfile]);

  const handleChatSearchSubmit = (e) => {
    e.preventDefault();
    if (!chatSearchText.trim()) return;
    const results = messages.filter((m) => m.text.toLowerCase().includes(chatSearchText.toLowerCase()));
    setSearchResults(results);
    if (results.length > 0) {
      setSearchIndex(results.length - 1);
      scrollToMessage(results[results.length - 1].id);
    } else { alert("검색 결과가 없습니다."); }
  };

  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    let newIndex = searchIndex + direction;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    if (newIndex >= searchResults.length) newIndex = 0;
    setSearchIndex(newIndex);
    scrollToMessage(searchResults[newIndex].id);
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`message-item-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlighted-message");
      setTimeout(() => el.classList.remove("highlighted-message"), 2000);
    }
  };

  return (
    <div id="chat-info-overlay-panel" className="info-panel" style={{ flexWrap: 'wrap' }}>
      <div id="chat-search-section" className="info-panel-section">
        <h4 className="info-section-title">채팅 검색</h4>
        <form onSubmit={handleChatSearchSubmit} className="search-form">
          <input type="text" className="text-input" placeholder="검색어 입력..." value={chatSearchText} onChange={(e) => setChatSearchText(e.target.value)} />
          <button type="submit" className="btn-submit btn-small">검색</button>
        </form>
        {searchResults.length > 0 && (
          <div className="search-nav-controls">
            <span className="search-status">{searchIndex + 1} / {searchResults.length}</span>
            <button type="button" className="btn-action btn-small" onClick={() => navigateSearch(-1)}>이전(↑)</button>
            <button type="button" className="btn-action btn-small" onClick={() => navigateSearch(1)}>다음(↓)</button>
          </div>
        )}
      </div>

      <div id="chat-members-section" className="info-panel-section">
        <h4 className="info-section-title">참여 인원 ({roomMembersData.length}명)</h4>
        {selectedMemberProfile ? (
          <div id="chat-info-member-profile" className="profile-card highlighted small-card" style={{ marginBottom: 0 }}>
            <button className="btn-back-link" onClick={() => setSelectedMemberProfile(null)}>← 목록으로</button>
            <p style={{ margin: '4px 0' }}><strong>이름:</strong> {selectedMemberProfile.name}</p>
            <p style={{ margin: '4px 0' }}><strong>코드:</strong> {selectedMemberProfile.friendCode}</p>
            <p style={{ margin: '4px 0' }}><strong>상태:</strong> {selectedMemberProfile.statusMessage || "없음"}</p>
          </div>
        ) : (
          <ul id="chat-members-list" className="member-list">
            {roomMembersData.map((member) => (
              <li key={member.uid} className="member-list-item" onClick={() => setSelectedMemberProfile(member)}>
                {member.name} {member.uid === user.uid && "(나)"}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div id="chat-leave-section" className="info-panel-section border-top">
        <button id="btn-leave-room" className="btn-danger" onClick={() => handleLeaveRoom(selectedRoomId)} style={{ width: '100%', height: '100%' }}>채팅방 나가기</button>
      </div>
    </div>
  );
}