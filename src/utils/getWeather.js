// utils/getWeather.js
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

export async function getWeather(zip = "48203", units = "imperial") {
  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zip},US&units=${units}&appid=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    const temperature = Math.round(data.main.temp);
    const hatesCold = temperature < 60;

    return { temperature, hatesCold };
  } catch (err) {
    console.error("[Jameson] Weather fetch failed:", err.message);
    return { temperature: 66, hatesCold: true }; // fallback default
  }
}
export default getWeather;