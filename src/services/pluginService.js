// src/services/pluginService.js
// ─────────────────────────────────────────────────────
// 플러그인 시스템 서비스 (출력 템플릿 계산 기능 포함)
//
// [데이터 구조]
//   plugins/{id}                ... 전체 공개 갤러리
//   users/{uid}/myPlugins/{id}  ... 내 리스트에 추가한 플러그인
// ─────────────────────────────────────────────────────
import { db } from "../firebase";
import {
  collection, doc, addDoc, setDoc, deleteDoc, getDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";

/* ════════════════════════════════════════
   1. 공개 갤러리 (plugins 컬렉션)
   ════════════════════════════════════════ */

export const publishPlugin = async (plugin, user, userName) => {
  return await addDoc(collection(db, "plugins"), {
    ...plugin,
    creatorId: user.uid,
    creatorName: userName || "익명",
    createdAt: serverTimestamp(),
  });
};

export const subscribeGallery = (callback) => {
  const q = query(collection(db, "plugins"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const deleteFromGallery = async (pluginId) => {
  await deleteDoc(doc(db, "plugins", pluginId));
};

/* ════════════════════════════════════════
   2. 내 플러그인 (users/{uid}/myPlugins)
   ════════════════════════════════════════ */

export const addToMyList = async (uid, plugin) => {
  const ref = doc(db, "users", uid, "myPlugins", plugin.id);
  await setDoc(ref, {
    name: plugin.name,
    description: plugin.description || "",
    method: plugin.method || "GET",
    url: plugin.url,
    headers: plugin.headers || "",
    body: plugin.body || "",
    params: plugin.params || [],
    responsePath: plugin.responsePath || "",
    outputTemplate: plugin.outputTemplate || "",
    sourceId: plugin.id,
    creatorName: plugin.creatorName || "익명",
    addedAt: serverTimestamp(),
  });
};

export const removeFromMyList = async (uid, pluginId) => {
  await deleteDoc(doc(db, "users", uid, "myPlugins", pluginId));
};

export const subscribeMyPlugins = (uid, callback) => {
  const q = query(collection(db, "users", uid, "myPlugins"), orderBy("addedAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const isInMyList = async (uid, pluginId) => {
  const snap = await getDoc(doc(db, "users", uid, "myPlugins", pluginId));
  return snap.exists();
};

/* ════════════════════════════════════════
   3. JSON 업로드 파싱 & 검증
   ════════════════════════════════════════ */

export const parsePluginJSON = (text) => {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON 형식이 올바르지 않습니다.");
  }
  const list = Array.isArray(data) ? data : [data];
  for (const p of list) {
    const err = validatePlugin(p);
    if (err) throw new Error(`"${p.name || "이름없음"}": ${err}`);
  }
  return list;
};

export const validatePlugin = (plugin) => {
  if (!plugin.name?.trim())  return "플러그인 이름이 필요합니다.";
  if (!plugin.url?.trim())   return "API URL이 필요합니다.";
  if (!plugin.url.startsWith("http://") && !plugin.url.startsWith("https://"))
    return "URL은 http:// 또는 https:// 로 시작해야 합니다.";

  if (plugin.headers && plugin.headers.trim()) {
    try { JSON.parse(plugin.headers); }
    catch { return "headers는 유효한 JSON이어야 합니다."; }
  }

  const urlVars = [...plugin.url.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map(m => m[1].trim());
  const paramKeys = (plugin.params || []).map(p => p.key);
  for (const v of urlVars) {
    if (!paramKeys.includes(v)) return `URL 변수 {{${v}}}에 대한 params 정의가 없습니다.`;
  }
  return null;
};

/* ════════════════════════════════════════
   4. 템플릿 치환 & 실행 엔진
   ════════════════════════════════════════ */

// {{변수}} 치환 (URL용 — 인코딩)
const fillUrl = (template, values) =>
  (template || "").replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, k) => {
    const v = values[k.trim()];
    return v !== undefined ? encodeURIComponent(v) : "";
  });

// ── 안전한 사칙연산 평가기 (eval 미사용) ──
// 숫자 / + - * / / 괄호만 허용하는 Shunting-yard 계산기
const safeEvaluate = (expr) => {
  const tokens = expr.match(/(\d+\.?\d*|[+\-*/()])/g);
  if (!tokens) return NaN;

  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const output = [];
  const ops = [];

  for (const t of tokens) {
    if (/^\d/.test(t)) {
      output.push(parseFloat(t));
    } else if (t === "(") {
      ops.push(t);
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") output.push(ops.pop());
      ops.pop();
    } else {
      while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) output.push(ops.pop());
      ops.push(t);
    }
  }
  while (ops.length) output.push(ops.pop());

  const stack = [];
  for (const t of output) {
    if (typeof t === "number") {
      stack.push(t);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return NaN;
      if (t === "+") stack.push(a + b);
      else if (t === "-") stack.push(a - b);
      else if (t === "*") stack.push(a * b);
      else if (t === "/") stack.push(a / b);
    }
  }
  return stack.length === 1 ? stack[0] : NaN;
};

// {{변수}} 또는 {{수식}} 치환 (출력/본문용)
// - 변수명 하나면 값 치환:        {{금액}}        → "100"
// - 수식이면 계산 결과로 치환:    {{result * 금액}} → "132,000"
const fillText = (template, values) =>
  (template || "").replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, raw) => {
    const expr = raw.trim();

    // 1) 정확히 변수명 하나면 값 그대로 (문자열도 허용)
    if (Object.prototype.hasOwnProperty.call(values, expr)) {
      return String(values[expr]);
    }

    // 2) 수식 → 변수를 숫자로 치환 후 계산
    const replaced = expr.replace(/[가-힣a-zA-Z_][가-힣a-zA-Z0-9_]*/g, (name) => {
    const num = parseFloat(values[name]);
    return isNaN(num) ? "NaN" : String(num);
  });

    const result = safeEvaluate(replaced);
    if (isNaN(result)) return "";

    // 정수면 그대로, 소수면 최대 2자리 + 천단위 콤마
    const rounded = Math.round(result * 100) / 100;
    return rounded.toLocaleString("ko-KR");
  });

// 점 표기 경로로 응답에서 값 추출
export const extractByPath = (data, path) => {
  if (!path || !path.trim()) return data;
  return path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key.trim()];
  }, data);
};

// 플러그인 실행 → { raw, value, display }
export const runPlugin = async (plugin, inputValues) => {
  const url = fillUrl(plugin.url, inputValues);

  let headers = {};
  if (plugin.headers && plugin.headers.trim()) {
    const parsed = JSON.parse(plugin.headers);
    for (const [k, v] of Object.entries(parsed)) {
      headers[k] = fillText(String(v), inputValues);
    }
  }

  const options = { method: plugin.method || "GET", headers };
  if (plugin.method === "POST" && plugin.body?.trim()) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    options.body = fillText(plugin.body, inputValues);
  }

  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`API 오류 (${response.status})`);
  const raw = await response.json();

  const value = extractByPath(raw, plugin.responsePath);
  if (value === undefined) throw new Error(`응답에서 "${plugin.responsePath}" 경로를 찾을 수 없습니다.`);

  // ── 출력 템플릿 적용 ──
  // result에 "원본 value"(숫자면 숫자)를 넘겨 계산이 가능하도록 함
  const display = plugin.outputTemplate
    ? fillText(plugin.outputTemplate, { ...inputValues, result: value })
    : (typeof value === "object" ? JSON.stringify(value, null, 2) : String(value));

  return { raw, value, display };
};