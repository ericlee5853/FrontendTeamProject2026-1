// src/components/ChatTabContent.jsx
// 변경 사항: 메시지 하단 타임스탬프 추가
//   - 형식: "6월 12일 14:32" (날짜 + 시 + 분)
//   - 같은 사람이 같은 분(分) 안에 연속으로 보낸 메시지는
//     그룹의 마지막 메시지에만 시간 표시 (카카오톡 방식)
import { useState } from "react";
import ChatInfoPanel from "./ChatInfoPanel";

/* ────────────────────────────────
   타임스탬프 유틸 함수
   ──────────────────────────────── */

// Firestore Timestamp → "6월 12일 14:32" 형식 문자열
function formatDateTime(timestamp) {
  if (!timestamp?.toDate) return ""; // serverTimestamp 반영 전(null)이면 빈 문자열
  const d = timestamp.toDate();
  const month  = d.getMonth() + 1;
  const day    = d.getDate();
  const hour   = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${month}월 ${day}일 ${hour}:${minute}`;
}

// 두 메시지가 "같은 분(分)"에 보내졌는지 비교
function isSameMinute(tsA, tsB) {
  if (!tsA?.toDate || !tsB?.toDate) return false;
  const a = tsA.toDate();
  const b = tsB.toDate();
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth() &&
    a.getDate()     === b.getDate() &&
    a.getHours()    === b.getHours() &&
    a.getMinutes()  === b.getMinutes()
  );
}

export default function ChatTabContent(props) {
  const [selectedFriendUid, setSelectedFriendUid] = useState("");
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);

  if (!props.selectedRoomId) {
    return (
      <div id="chat-window-empty-wrapper" className="tab-content empty-state">
        <div id="chat-empty-message-box" className="fallback-message-box">
          <h3>활성화된 대화창이 없습니다.</h3>
          <p>대화방을 생성하거나 선택하십시오.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="chat-window-active-wrapper" className="tab-content relative-container">

      {/* ── 채팅 헤더 ── */}
      <div id="chat-header-section" className="chat-header">
        <h3 id="chat-current-room-name" className="room-title">{props.currentRoomName}</h3>
        <div className="header-actions">
          <form
            id="chat-invite-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedFriendUid) {
                props.handleInviteUser(selectedFriendUid);
                setSelectedFriendUid("");
              }
            }}
            style={{ display: 'flex' }}
          >
            <select
              id="chat-invite-select"
              className="text-input"
              value={selectedFriendUid}
              onChange={(e) => setSelectedFriendUid(e.target.value)}
              required
            >
              <option value="">초대할 친구 선택</option>
              {props.friends.map((f) => <option key={f.uid} value={f.uid}>{f.name}</option>)}
            </select>
            <button id="btn-invite-friend-submit" className="btn-action" type="submit">초대</button>
          </form>
          <button
            id="btn-chat-info-toggle"
            className={`btn-action ${isChatInfoOpen ? "active" : ""}`}
            onClick={() => setIsChatInfoOpen(!isChatInfoOpen)}
          >
            i
          </button>
        </div>
      </div>

      {isChatInfoOpen && <ChatInfoPanel {...props} />}

      {/* ── 메시지 목록 ── */}
      <div id="chat-messages-scroll-container" className="messages-container">
        <div id="message-list-stream" className="messages-stream">
          {props.messages.map((msg, idx) => {
            const isMine = msg.senderId === props.user?.uid;
            const prevMsg = props.messages[idx - 1];
            const nextMsg = props.messages[idx + 1];

            /* ── 타임스탬프 표시 판정 ──
               다음 메시지가 (1) 없거나 (2) 다른 사람이거나 (3) 다른 분(分)이면
               → 현재 메시지가 그룹의 마지막 → 시간 표시 */
            const showTime =
              !nextMsg ||
              nextMsg.senderId !== msg.senderId ||
              !isSameMinute(msg.createdAt, nextMsg.createdAt);

            /* ── 보낸 사람 이름 표시 판정 ──
               이전 메시지가 (1) 없거나 (2) 다른 사람이거나 (3) 다른 분(分)이면
               → 그룹의 첫 메시지 → 이름 표시 (연속 메시지엔 이름 생략) */
            const showName =
              !prevMsg ||
              prevMsg.senderId !== msg.senderId ||
              !isSameMinute(prevMsg.createdAt, msg.createdAt);

            return (
              <div
                key={msg.id}
                id={`message-item-${msg.id}`}
                className={`message-bubble-row ${isMine ? "message-mine" : "message-others"} ${showTime ? "" : "message-grouped"}`}
              >
                {/* 그룹 첫 메시지에만 이름 표시 */}
                {showName && (
                  <div className="message-sender-name">{msg.senderName || "알 수 없는 사용자"}</div>
                )}

                <span className="message-text-content">{msg.text}</span>

                {/* 그룹 마지막 메시지에만 타임스탬프 표시 */}
                {showTime && (
                  <span className="message-timestamp">{formatDateTime(msg.createdAt)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 메시지 전송 폼 ── */}
      <form id="message-send-form" className="send-form" onSubmit={props.handleSendMessage}>
        <input
          id="message-text-input"
          className="text-input"
          type="text"
          value={props.inputText}
          onChange={(e) => props.setInputText(e.target.value)}
          placeholder="메시지를 입력하세요..."
          required
        />
        <button id="btn-message-send-submit" className="btn-submit" type="submit">전송</button>
        <button
          id="btn-toggle-extension-sidebar"
          className="btn-action"
          type="button"
          onClick={props.toggleExtensionSidebar}
        >
          {props.isExtensionOpen ? "닫기" : "+"}
        </button>
      </form>
    </div>
  );
}
