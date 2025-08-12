// backend/weather.js
// Netlify Function: /api/weather?zip=48203&units=imperial
exports.handler = async (event) => {
  try {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) {
      return json(500, { error: "Missing OPENWEATHER_API_KEY" });
    }

    const { zip, units = "imperial", country = "US" } = 
      event.queryStringParameters || {};

    if (!zip || !/^\d{5}$/.test(zip)) {
      return json(400, { error: "Provide ?zip=5digit" });
    }

    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("zip", `${zip},${country}`);
    url.searchParams.set("appid", key);
    url.searchParams.set("units", units);

    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      return json(r.status, { error: "OpenWeather error", details: text });
    }

    const data = await r.json();
    // shape a friendly payload (keep raw for debugging)
    const out = {
      name: data.name,
      tz: data.timezone,
      dt: data.dt,
      temp: data.main?.temp,
      feels_like: data.main?.feels_like,
      humidity: data.main?.humidity,
      wind: data.wind?.speed,
      weather: {
        main: data.weather?.[0]?.main,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
      },
      raw: data,
    };

    return json(200, out);
  } catch (err) {
    return json(500, { error: "Server error", details: String(err?.message || err) });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}