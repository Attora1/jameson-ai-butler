// utils/getWeather.js
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY;

// Validate US zip code format (5 digits or 5+4 format)
function isValidZipCode(zip) {
  if (!zip || typeof zip !== 'string') return false;
  // Remove any whitespace
  const cleanZip = zip.trim();
  // Check for 5-digit format or 5+4 format
  return /^\d{5}(-\d{4})?$/.test(cleanZip);
}

export async function getWeather(zip = "48203", units = "imperial") {
  // Validate and clean the zip code
  if (!isValidZipCode(zip)) {
    console.warn("[Jameson] Invalid zip code format:", zip, "- using default");
    zip = "48203"; // fallback to default valid zip
  }

  // Clean the zip code (remove any extra characters, keep only first 5 digits)
  const cleanZip = zip.trim().split('-')[0];

  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${cleanZip},US&units=${units}&appid=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    const temperature = Math.round(data.main.temp);
    const hatesCold = temperature < 60;

    return { temperature, hatesCold };
  } catch (err) {
    console.error("[Jameson] Weather fetch failed:", err.message);
    // Return fallback data instead of failing completely
    return { temperature: 66, hatesCold: true };
  }
}

export default getWeather;