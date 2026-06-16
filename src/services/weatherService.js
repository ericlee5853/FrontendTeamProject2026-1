import axios from "axios";

export const getWeather = async (city) => {
  const response = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather",
    {
      params: {
        q: city,
        appid: import.meta.env.VITE_WEATHER_KEY,
        units: "metric",
        lang: "kr",
      },
    }
  );

  return response.data;
};