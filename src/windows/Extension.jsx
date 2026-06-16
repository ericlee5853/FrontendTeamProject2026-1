// src/components/Extension.jsx
// ─────────────────────────────────────────────
// 익스텐션 — 리스트 → 상세 네비게이션 구조
//
// [화면 상태(view)]
//   'list'    : 기능 리스트 (기본기능 + 내 플러그인)
//   'detail'  : 선택한 기능 실행 화면
//   'gallery' : 플러그인 갤러리 / 업로드
//
// 우하단 플로팅 버튼 → 갤러리(추가/업로드) 진입
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import { subscribeMyPlugins, removeFromMyList } from "../services/pluginService";
import { BUILTIN_FEATURES } from "../components/builtinFeatures";
import PluginRunner from "../components/PluginRunner";
import PluginGallery from "../components/PluginGallery";
import "../css/Extension.css";

// user, userName props는 MainPage에서 전달
export default function Extension({ onShare, user, userName }) {
  // 현재 화면
  const [view, setView] = useState("list");
  // 선택된 기능 (상세 화면용)
  const [selected, setSelected] = useState(null);
  // 내 플러그인 목록
  const [myPlugins, setMyPlugins] = useState([]);

  // 내 플러그인 실시간 구독
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyPlugins(user.uid, setMyPlugins);
    return () => unsub();
  }, [user]);

  // ── 기능 선택 → 상세 화면 ──
  const openDetail = (item) => {
    setSelected(item);
    setView("detail");
  };

  // ── 리스트로 복귀 ──
  const backToList = () => {
    setSelected(null);
    setView("list");
  };

  // ── 내 리스트에서 플러그인 제거 ──
  const handleRemove = async (e, pluginId) => {
    e.stopPropagation(); // 카드 클릭(상세 진입) 방지
    if (!window.confirm("내 리스트에서 제거하시겠습니까?")) return;
    await removeFromMyList(user.uid, pluginId);
  };

  /* ════════════════════════════════
     갤러리 화면
     ════════════════════════════════ */
  if (view === "gallery") {
    return (
      <div id="extension-container">
        <PluginGallery
          user={user}
          userName={userName}
          myPluginIds={myPlugins.map((p) => p.id)}
          onBack={backToList}
        />
      </div>
    );
  }

  /* ════════════════════════════════
     상세 실행 화면
     ════════════════════════════════ */
  if (view === "detail" && selected) {
    const isBuiltin = selected.id.startsWith("builtin-");
    const BuiltinDetail = isBuiltin ? selected.Detail : null;

    return (
      <div id="extension-container">
        <button className="btn-back-link" onClick={backToList}>← 목록</button>
        <div className="feature-detail-header">
          <h4 className="feature-detail-title">
            {isBuiltin && <span className="feature-icon">{selected.icon}</span>}
            {selected.name}
          </h4>
        </div>

        {/* 기본기능이면 내장 컴포넌트, 플러그인이면 PluginRunner */}
        {isBuiltin
          ? <BuiltinDetail onShare={onShare} />
          : <PluginRunner plugin={selected} onShare={onShare} />
        }
      </div>
    );
  }

  /* ════════════════════════════════
     리스트 화면 (기본)
     ════════════════════════════════ */
  return (
    <div id="extension-container" className="ext-list-container">
      <h4 id="extension-title">익스텐션 기능</h4>

      <div className="feature-list">
        {/* ── 기본 제공 기능 ── */}
        <p className="feature-list-label">기본 기능</p>
        {BUILTIN_FEATURES.map((f) => (
          <div key={f.id} className="feature-item" onClick={() => openDetail(f)}>
            <span className="feature-item-icon">{f.icon}</span>
            <div className="feature-item-info">
              <span className="feature-item-name">{f.name}</span>
              <span className="feature-item-desc">{f.description}</span>
            </div>
            <span className="feature-item-arrow">›</span>
          </div>
        ))}

        {/* ── 내 플러그인 ── */}
        <p className="feature-list-label">추가 기능 ({myPlugins.length})</p>
        {myPlugins.length === 0 && (
          <p className="feature-empty">
            추가된 플러그인이 없습니다.<br />
          </p>
        )}
        {myPlugins.map((p) => (
          <div key={p.id} className="feature-item" onClick={() => openDetail(p)}>
            <span className="feature-item-icon feature-item-icon--plugin">🔌</span>
            <div className="feature-item-info">
              <span className="feature-item-name">{p.name}</span>
              <span className="feature-item-desc">{p.description || `제작: ${p.creatorName}`}</span>
            </div>
            {/* 제거 버튼 */}
            <button
              className="feature-item-remove"
              onClick={(e) => handleRemove(e, p.id)}
              aria-label="리스트에서 제거"
              title="제거"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ── 우하단 플로팅 추가 버튼 ── */}
      <button
        className="ext-fab"
        onClick={() => setView("gallery")}
        aria-label="플러그인 추가"
        title="플러그인 추가 / 갤러리"
      >
        플러그인
      </button>
    </div>
  );
}
