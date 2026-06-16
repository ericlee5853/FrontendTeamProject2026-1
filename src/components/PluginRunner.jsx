// src/components/PluginRunner.jsx
// ─────────────────────────────────────────────
// 사용자 플러그인 상세 실행 화면
// 입력 → API 호출 → 결과 → 채팅 공유
// ─────────────────────────────────────────────
import { useState } from "react";
import { runPlugin } from "../services/pluginService";

export default function PluginRunner({ plugin, onShare }) {
  const [inputValues, setInputValues] = useState({});
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (key, value) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleRun = async () => {
    // 필수 입력 확인
    for (const p of plugin.params || []) {
      if (!inputValues[p.key]?.trim()) {
        setError(`"${p.label || p.key}" 값을 입력하세요.`);
        return;
      }
    }
    setRunning(true); setError(""); setResult(null);
    try {
      const res = await runPlugin(plugin, inputValues);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleShareResult = () => {
    if (!result) return;
    onShare(`[${plugin.name}]\n${result.display}`);
  };

  return (
    <div className="feature-detail-body">
      {/* 입력 파라미터 */}
      {(plugin.params || []).map((p) => (
        <div key={p.key} className="plugin-input-group">
          <label className="plugin-input-label">{p.label || p.key}</label>
          <input
            className="text-input" type="text"
            placeholder={p.placeholder || `${p.label || p.key} 입력`}
            value={inputValues[p.key] || ""}
            onChange={(e) => handleInputChange(p.key, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
          />
        </div>
      ))}

      {(!plugin.params || plugin.params.length === 0) && (
        <p className="plugin-hint">입력 없이 바로 실행되는 플러그인입니다.</p>
      )}

      <button
        className="btn-submit" style={{ marginLeft: 0, width: "100%", marginTop: 4 }}
        onClick={handleRun} disabled={running}
      >
        {running ? "실행 중..." : "▶ 실행"}
      </button>

      {error && <p className="error-message" style={{ marginTop: 10 }}>{error}</p>}

      {result && (
        <div className="plugin-result">
          <pre className="plugin-result-text">{result.display}</pre>
          <button className="btn-primary" onClick={handleShareResult}>채팅방에 공유하기</button>
        </div>
      )}
    </div>
  );
}
