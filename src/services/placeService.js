import axios from "axios";

export const searchPlaces = async (keyword) => {
  try {
    const response = await axios.get(
      "https://dapi.kakao.com/v2/local/search/keyword.json",
      {
        params: { 
            query: keyword,
            size: 10,
            sort: "accuracy"
        },
        headers: {
          Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_REST_KEY}`,
        },
      }
    );

    return response.data.documents;
  } catch (error) {
    console.log(error.response);
    console.log(error.response?.data);
    throw error;
  }
};