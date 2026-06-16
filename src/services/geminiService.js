import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

export const recommendPlaces = async (keyword, places) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

const placeNames = places
  .map((place) =>`${place.place_name} (${place.category_name})`)
  .join("\n");

  const prompt = `
    사용자 검색어: ${keyword}

    검색 결과 목록:
    ${placeNames}

    중요 규칙:
    - 반드시 위 검색 결과 목록에 있는 장소만 선택
    - 목록에 없는 장소를 출력하면 안 됨
    - 새로운 장소를 생성하면 안 됨
    - 정확히 5개만 선택
    - 번호와 장소명만 출력

    출력 예시:
    1. 별양집
    2. 중앙해장
    3. 농민백암순대
    4. 팔당족발
    5. 정월
    `;

  const result = await model.generateContent(prompt);

  return result.response.text();
};