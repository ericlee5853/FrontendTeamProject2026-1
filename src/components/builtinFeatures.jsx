// src/components/builtinFeatures.jsx
// ─────────────────────────────────────────────
// 기본 제공 기능(장소·AI, 날씨)을 플러그인과 동일하게
// "리스트 항목"으로 다루기 위한 레지스트리
//
// 각 기능은 { id, name, description, icon, Detail } 구조
// Detail은 상세 화면에 렌더링될 컴포넌트 (onShare prop 받음)
// ─────────────────────────────────────────────
import { useState } from "react";
import { searchPlaces } from "../services/placeService";
import { getWeather } from "../services/weatherService";
import { recommendPlaces } from "../services/geminiService";

const CITY_MAP = {
  서울: "Seoul", 부산: "Busan", 인천: "Incheon", 대구: "Daegu", 대전: "Daejeon",
  광주: "Gwangju", 울산: "Ulsan", 세종: "Sejong", 제주: "Jeju City",
};

/* ════════════════════════════════
   장소 · AI 검색 상세 화면
   ════════════════════════════════ */
function PlaceDetail({ onShare }) {
  const [places, setPlaces] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsLoading(true); setRecommendation(""); setError(null);
    try {
      const result = await searchPlaces(keyword);
      setPlaces(result || []);
    } catch { setError("장소 검색 오류"); }
    finally { setIsLoading(false); }
  };

  const handleRecommend = async () => {
    if (!keyword.trim() || places.length === 0) return;
    setIsLoading(true); setError(null);
    try {
      const result = await recommendPlaces(keyword, places);
      setRecommendation(result);
    } catch { setError("AI 추천 오류"); }
    finally { setIsLoading(false); }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlaces((prev) =>
      prev.some((i) => i.id === place.id)
        ? prev.filter((i) => i.id !== place.id)
        : [...prev, place]
    );
  };

  const handleShareSelected = () => {
    if (selectedPlaces.length === 0) return;
    const txt = selectedPlaces.map((p) => `- ${p.place_name} (${p.address_name})`).join("\n");
    onShare(`[장소 공유]\n${txt}`);
    setSelectedPlaces([]);
  };

  const handleShareRecommend = () => {
    if (!recommendation) return;
    onShare(`[AI 장소 추천]\n${recommendation}`);
  };

  return (
    <div className="feature-detail-body">
      {error && <p className="error-message">{error}</p>}
      {isLoading && <p className="loading-message">데이터 처리 중...</p>}

      <div className="ext-input-row">
        <input
          className="text-input" type="text" value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="장소를 입력하세요"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn-submit" onClick={handleSearch} disabled={isLoading}>검색</button>
      </div>

      <div className="ext-btn-row">
        <button className="btn-action" onClick={handleRecommend} disabled={isLoading || places.length === 0}>
          AI 추천 분석
        </button>
        <button className="btn-primary" onClick={handleShareSelected} disabled={selectedPlaces.length === 0}>
          선택 장소 공유
        </button>
      </div>

      {recommendation && (
        <div className="recommendation-result">
          <pre>{recommendation}</pre>
          <button className="btn-primary" onClick={handleShareRecommend}>추천 결과 공유</button>
        </div>
      )}

      <div className="place-list">
        {places.map((place) => {
          const isChecked = selectedPlaces.some((i) => i.id === place.id);
          return (
            <div key={place.id} className="place-item">
              <h6>{place.place_name}</h6>
              <p>{place.address_name}</p>
              <label>
                <input type="checkbox" checked={isChecked} onChange={() => handleSelectPlace(place)} />
                선택
              </label>
            </div>
          );
        })}
        {places.length === 0 && !isLoading && <p className="place-list-empty">검색 결과가 없습니다.</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   날씨 조회 상세 화면
   ════════════════════════════════ */
function WeatherDetail({ onShare }) {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!city.trim()) return;
    setIsLoading(true); setError(null);
    try {
      const cityName = CITY_MAP[city.trim()] || city;
      const result = await getWeather(cityName);
      setWeather(result);
    } catch { setError("날씨 조회 오류"); }
    finally { setIsLoading(false); }
  };

  const handleShare = () => {
    if (!weather) return;
    onShare(`[날씨 공유] ${city}: ${weather.main.temp}°C / ${weather.weather[0].description}`);
  };

  return (
    <div className="feature-detail-body">
      {error && <p className="error-message">{error}</p>}
      {isLoading && <p className="loading-message">데이터 처리 중...</p>}

      <div className="ext-input-row">
        <input
          className="text-input" type="text" value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="서울 등 지역 입력"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn-submit" onClick={handleSearch} disabled={isLoading}>조회</button>
      </div>

      {weather && (
        <div className="weather-result">
          <h5>{weather.name} 날씨</h5>
          <p className="weather-temp">{weather.main.temp}°C</p>
          <button className="btn-primary" onClick={handleShare}>채팅방에 공유하기</button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════
   기본 기능 레지스트리 (export)
   ════════════════════════════════ */
export const BUILTIN_FEATURES = [
  {
    id: "builtin-place",
    name: "장소 · AI 검색",
    description: "장소 검색 후 AI가 추천 분석",
    icon: "📍",
    Detail: PlaceDetail,
  },
  {
    id: "builtin-weather",
    name: "날씨 조회",
    description: "지역별 실시간 날씨",
    icon: "🌤️",
    Detail: WeatherDetail,
  },
];
