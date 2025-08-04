// utils/getWeather.js

// Polyfill fetch for Node (if not already available)
import fetch from 'node-fetch';

// Validate US zip code format (5 digits or 5+4 format)
function isValidZipCode(zip) {
  if (!zip) return false;
  const cleanZip = String(zip).trim();
  return /^\d{5}(-\d{4})?$/.test(cleanZip);
}

export async function getWeather(zip = "48203", units = "imperial") {
  // Validate and normalize zip
  if (!isValidZipCode(zip)) {
    console.warn("[AELI] Invalid zip code format:", zip, "- using default");
    zip = "48203";
  }
  const cleanZip = String(zip).trim().split('-')[0];

  // Load API key at runtime
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  if (!API_KEY) {
    console.error("[AELI] Missing OpenWeather API key");
    return { temperature: 66, hatesCold: true }; // fallback data
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${cleanZip},US&units=${units}&appid=${API_KEY}`;
  console.log(`[AELI] Fetching weather from: ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    // Validate data structure
    if (!data.main || typeof data.main.temp !== "number") {
      throw new Error("Invalid weather data received");
    }

    const temperature = Math.round(data.main.temp);
    const hatesCold = temperature < 60;

    return { temperature, hatesCold };
  } catch (err) {
    console.error("[AELI] Weather fetch failed:", err.message);
    // Fallback data
    return { temperature: 66, hatesCold: true };
  }
}

export default getWeather;
