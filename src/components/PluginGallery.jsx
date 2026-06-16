// src/components/PluginGallery.jsx
// ─────────────────────────────────────────────
// 공개 플러그인 갤러리 + JSON 업로드
// - 갤러리: 모든 공개 플러그인 둘러보기 → "내 리스트에 추가"
// - 업로드: JSON 파일을 올려 갤러리에 일괄 등록
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  subscribeGallery, addToMyList, deleteFromGallery,
  publishPlugin, parsePluginJSON,
} from "../services/pluginService";

export default function PluginGallery({ user, userName, myPluginIds, onBack }) {
  // 화면 모드: 'gallery' 갤러리 | 'upload' 업로드
  const [mode, setMode] = useState("gallery");
  const [gallery, setGallery] = useState([]);
  const [addingId, setAddingId] = useState(null);

  // 업로드 상태
  const [uploadText, setUploadText] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadPreview, setUploadPreview] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef(null);

  // 갤러리 구독
  useEffect(() => {
    const unsub = subscribeGallery(setGallery);
    return () => unsub();
  }, []);

  // ── 내 리스트에 추가 ──
  const handleAdd = async (plugin) => {
    setAddingId(plugin.id);
    try {
      await addToMyList(user.uid, plugin);
    } catch (err) {
      alert("추가 실패: " + err.message);
    } finally {
      setAddingId(null);
    }
  };

  // ── 갤러리에서 영구 삭제 (제작자만) ──
  const handleDelete = async (plugin) => {
    if (plugin.creatorId !== user.uid) return;
    if (!window.confirm(`갤러리에서 "${plugin.name}"을(를) 영구 삭제하시겠습니까?`)) return;
    await deleteFromGallery(plugin.id);
  };

  /* ════════════════════════════════
     JSON 업로드 처리
     ════════════════════════════════ */

  // 파일 선택 → 텍스트 읽기
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadText(ev.target.result);
      validatePreview(ev.target.result);
    };
    reader.readAsText(file);
  };

  // 텍스트 검증 → 미리보기
  const validatePreview = (text) => {
    setUploadError("");
    setUploadPreview([]);
    if (!text.trim()) return;
    try {
      const list = parsePluginJSON(text);
      setUploadPreview(list);
    } catch (err) {
      setUploadError(err.message);
    }
  };

  // 갤러리에 일괄 등록
  const handlePublish = async () => {
    if (uploadPreview.length === 0) return;
    setPublishing(true);
    try {
      for (const plugin of uploadPreview) {
        await publishPlugin(plugin, user, userName);
      }
      alert(`${uploadPreview.length}개의 플러그인이 갤러리에 등록되었습니다!`);
      setUploadText(""); setUploadPreview([]);
      setMode("gallery");
    } catch (err) {
      setUploadError("등록 실패: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  /* ════════════════════════════════
     업로드 화면
     ════════════════════════════════ */
  if (mode === "upload") {
    return (
      <div className="gallery-wrap">
        <div className="feature-detail-header">
          <button className="btn-back-link" onClick={() => setMode("gallery")}>← 갤러리</button>
          <h4 className="feature-detail-title">JSON 업로드</h4>
        </div>

        <div className="feature-detail-body">
          <p className="plugin-hint">
            플러그인 정의 JSON 파일을 업로드하세요. 단일 객체 또는 배열 모두 가능합니다.
          </p>

          {/* 파일 선택 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            className="btn-action" style={{ marginLeft: 0, width: "100%" }}
            onClick={() => fileInputRef.current?.click()}
          >
            📁 JSON 파일 선택
          </button>

          {/* 직접 붙여넣기 */}
          <textarea
            className="text-input plugin-form-textarea"
            style={{ marginTop: 10 }}
            placeholder='또는 여기에 JSON 직접 붙여넣기...'
            value={uploadText}
            onChange={(e) => { setUploadText(e.target.value); validatePreview(e.target.value); }}
            rows={6}
          />

          {uploadError && <p className="error-message">{uploadError}</p>}

          {/* 미리보기 */}
          {uploadPreview.length > 0 && (
            <div className="upload-preview">
              <p className="plugin-hint" style={{ color: "var(--accent)" }}>
                ✓ {uploadPreview.length}개 플러그인 인식됨
              </p>
              {uploadPreview.map((p, i) => (
                <div key={i} className="upload-preview-item">
                  <strong>{p.name}</strong>
                  <span>{p.method} · {p.description || "설명 없음"}</span>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handlePublish}
            disabled={uploadPreview.length === 0 || publishing}
          >
            {publishing ? "등록 중..." : `갤러리에 등록 (${uploadPreview.length}개)`}
          </button>

          {/* JSON 형식 예시 */}
          <details className="upload-example">
            <summary>JSON 형식 예시 보기</summary>
            <pre>{`{
  "name": "환율 조회",
  "description": "USD 기준 환율",
  "method": "GET",
  "url": "https://api.exchangerate-api.com/v4/latest/USD",
  "headers": "",
  "params": [],
  "responsePath": "rates.KRW",
  "outputTemplate": "1달러 = {{result}}원"
}`}</pre>
          </details>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════
     갤러리 화면
     ════════════════════════════════ */
  return (
    <div className="gallery-wrap">
      <button className="btn-back-link" onClick={onBack}>← 내 기능</button>
      <div className="feature-detail-header">
        <h4 className="feature-detail-title">플러그인 갤러리</h4>
      </div>

      <div className="feature-detail-body">
        {/* 업로드로 이동 */}
        <button
          className="btn-action" style={{ marginLeft: 0, width: "100%", marginBottom: 12 }}
          onClick={() => setMode("upload")}
        >
          ⬆ JSON으로 플러그인 업로드
        </button>

        {gallery.length === 0 && (
          <p className="plugin-empty">공개된 플러그인이 없습니다.<br />첫 플러그인을 업로드해보세요!</p>
        )}

        <div className="plugin-list">
          {gallery.map((plugin) => {
            const alreadyAdded = myPluginIds.includes(plugin.id);
            const isMine = plugin.creatorId === user.uid;

            return (
              <div key={plugin.id} className="gallery-card">
                <div className="gallery-card-info">
                  <span className="plugin-card-name">{plugin.name}</span>
                  <span className="plugin-card-desc">{plugin.description || "설명 없음"}</span>
                  <span className="plugin-card-meta">{plugin.method} · 제작: {plugin.creatorName}</span>
                </div>
                <div className="gallery-card-actions">
                  {alreadyAdded ? (
                    <span className="gallery-added-badge">추가됨 ✓</span>
                  ) : (
                    <button
                      className="btn-submit btn-small" style={{ marginLeft: 0 }}
                      onClick={() => handleAdd(plugin)}
                      disabled={addingId === plugin.id}
                    >
                      {addingId === plugin.id ? "..." : "+ 추가"}
                    </button>
                  )}
                  {isMine && (
                    <button className="btn-danger btn-small" onClick={() => handleDelete(plugin)}>
                      삭제
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
