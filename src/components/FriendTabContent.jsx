// src/components/FriendTabContent.jsx
// 변경 사항: 함께 속한 채팅방 박스의 인라인 라이트 색상(#f9f9f9, #fff) 제거
//           → Content.css의 .shared-rooms-box 클래스로 교체
import { useState } from "react";

export default function FriendTabContent({
  myProfile,
  handleUpdateMyStatus,
  friends,
  selectedFriendProfile,
  handleSelectFriendProfile,
  handleStartDirectChat,
  handleGoToRoom,
  rooms,
  handleRemoveFriend,
}) {
  const [statusInput, setStatusInput] = useState("");
  const [expandedUid, setExpandedUid] = useState(null);

  // ── 상태 메시지 변경 ──
  const onUpdateStatusSubmit = (e) => {
    e.preventDefault();
    handleUpdateMyStatus(statusInput);
    setStatusInput("");
  };

  // ── 친구 아코디언 토글 ──
  const toggleFriendAccordion = (uid) => {
    if (expandedUid === uid) {
      setExpandedUid(null);
    } else {
      setExpandedUid(uid);
      handleSelectFriendProfile(uid);
    }
  };

  return (
    <div id="content-friend-wrapper" className="tab-content">

      {/* ── 내 프로필 카드 ── */}
      <div id="my-profile-card" className="profile-card">
        <h3 id="my-profile-title" className="card-title">내 프로필</h3>
        <p id="my-profile-name-info" className="profile-info-text">
          <span className="info-label">이름:</span> {myProfile.name}
        </p>
        <p id="my-profile-code-info" className="profile-info-text">
          <span className="info-label">내 코드:</span> {myProfile.friendCode}
        </p>
        <p id="my-profile-status-info" className="profile-info-text">
          <span className="info-label">상태:</span> {myProfile.statusMessage || "상태 메시지가 없습니다."}
        </p>

        {/* 상태 메시지 입력 폼 */}
        <form
          id="my-status-update-form"
          onSubmit={onUpdateStatusSubmit}
          style={{ display: 'flex', marginTop: '15px' }}
        >
          <input
            id="my-status-input"
            className="text-input"
            type="text"
            placeholder="새 상태 메시지 입력"
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
            maxLength={30}
          />
          <button id="btn-my-status-submit" className="btn-submit" type="submit">변경</button>
        </form>
      </div>

      <hr />

      {/* ── 친구 목록 ── */}
      <div>
        <h4 className="section-title" style={{ marginBottom: '15px' }}>
          친구 목록 ({friends.length}명)
        </h4>

        {friends.length === 0 ? (
          <p className="empty-hint">아직 등록된 친구가 없습니다. 왼쪽 패널에서 친구를 추가하세요.</p>
        ) : (
          <div className="accordion-list">
            {friends.map((f) => {
              const isExpanded = expandedUid === f.uid;
              const isProfileLoaded =
                isExpanded && selectedFriendProfile && selectedFriendProfile.uid === f.uid;

              return (
                <div key={f.uid} className="accordion-item">
                  {/* 아코디언 헤더 */}
                  <div className="accordion-header" onClick={() => toggleFriendAccordion(f.uid)}>
                    <strong style={{ fontSize: '1.05em' }}>{f.name}</strong>
                    <span style={{ float: 'right', opacity: 0.5 }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  {/* 아코디언 본문 */}
                  {isExpanded && (
                    <div className="accordion-body">
                      {isProfileLoaded ? (
                        <div className="profile-detail-content">
                          <p className="profile-info-text">
                            <span className="info-label">코드:</span> {selectedFriendProfile.friendCode}
                          </p>
                          <p className="profile-info-text">
                            <span className="info-label">상태:</span> {selectedFriendProfile.statusMessage || "없음"}
                          </p>

                          {/* 액션 버튼 */}
                          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button
                              className="btn-primary"
                              style={{ margin: 0, flex: 1 }}
                              onClick={() => handleStartDirectChat(selectedFriendProfile.uid, selectedFriendProfile.name)}
                            >
                              1:1 채팅방 생성/이동
                            </button>
                            <button
                              className="btn-danger"
                              style={{ flex: 1 }}
                              onClick={() => handleRemoveFriend(selectedFriendProfile.uid)}
                            >
                              친구 삭제
                            </button>
                          </div>

                          {/* 함께 속한 채팅방 */}
                          <div className="shared-rooms-box">
                            <h5>함께 속한 채팅방</h5>
                            <ul>
                              {rooms
                                .filter((r) => r.members.includes(selectedFriendProfile.uid))
                                .map((room) => (
                                  <li key={room.id} className="shared-room-item">
                                    <span>{room.displayName}</span>
                                    <button
                                      className="btn-action btn-small"
                                      onClick={() => handleGoToRoom(room.id, room.displayName)}
                                    >
                                      이동
                                    </button>
                                  </li>
                                ))}
                              {rooms.filter((r) => r.members.includes(selectedFriendProfile.uid)).length === 0 && (
                                <li className="shared-room-empty">함께 속한 방이 없습니다.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-hint">데이터를 불러오는 중입니다...</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
