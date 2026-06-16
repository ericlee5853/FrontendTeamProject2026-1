// src/components/List.jsx
// 변경 사항: 친구 요청 박스의 인라인 라이트 색상(#f0f8ff, #fff0f0) 제거
//           → MainPage.css의 .request-box 클래스로 교체
export default function List({
  activeTab,
  rooms,
  selectedRoomId,
  setSelectedRoomId,
  setCurrentRoomName,
  handleCreateGroupRoom,
  searchCode,
  setSearchCode,
  handleSendFriendRequest,
  pendingRequests,
  handleAcceptFriend,
  sentRequests,
  handleCancelFriendRequest,
}) {
  return (
    <div id="list-container" className="nav-list-wrapper">
      {activeTab === "friend" ? (
        /* ── 친구 관리 탭 ── */
        <div id="friend-tab-section" className="nav-tab-section">
          <h3 className="section-header">친구 관리</h3>

          {/* 친구 코드로 요청 보내기 */}
          <form
            id="friend-search-form"
            onSubmit={handleSendFriendRequest}
            style={{ display: 'flex', marginBottom: '15px' }}
          >
            <input
              className="text-input"
              type="text"
              placeholder="코드 (#A1B2)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              required
              maxLength={5}
            />
            <button className="btn-action" type="submit">요청</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            {/* 대기 중인 요청 없음 */}
            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <p className="empty-hint">대기 중인 요청이 없습니다.</p>
            )}

            {/* 받은 요청 — 주황 좌측 보더 */}
            {pendingRequests.length > 0 && (
              <div className="request-box request-box--received">
                <strong className="request-box-title">
                  받은 요청 ({pendingRequests.length})
                </strong>
                {pendingRequests.map(req => (
                  <div key={req.id} className="request-row">
                    <span className="request-row-name">{req.senderName}</span>
                    <div>
                      <button
                        className="btn-action btn-small"
                        onClick={() => handleAcceptFriend(req.id)}
                      >
                        수락
                      </button>
                      <button
                        className="btn-danger btn-small"
                        style={{ marginLeft: '5px' }}
                        onClick={() => handleCancelFriendRequest(req.id)}
                      >
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 보낸 요청 — 빨강 좌측 보더 */}
            {sentRequests.length > 0 && (
              <div className="request-box request-box--sent">
                <strong className="request-box-title">
                  보낸 요청 ({sentRequests.length})
                </strong>
                {sentRequests.map(req => (
                  <div key={req.id} className="request-row">
                    <span className="request-row-name">{req.receiverName}</span>
                    <button
                      className="btn-danger btn-small"
                      onClick={() => handleCancelFriendRequest(req.id)}
                    >
                      취소
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── 채팅방 탭 ── */
        <div id="room-tab-section" className="nav-tab-section">
          <h3 id="room-tab-title" className="section-header">채팅방</h3>
          <button id="btn-create-room" className="btn-primary" onClick={handleCreateGroupRoom}>
            + 새 대화방 만들기
          </button>
          <div id="room-list-wrapper" className="list-items-container" style={{ marginTop: '15px' }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                id={`room-list-item-${room.id}`}
                className={`list-item room-item ${selectedRoomId === room.id ? "active-room" : ""}`}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setCurrentRoomName(room.displayName);
                }}
              >
                <strong className="room-name">{room.displayName}</strong>
                <div className="room-last-message">
                  {room.lastMessage || "대화 내용이 없습니다."}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
