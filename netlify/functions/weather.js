// netlify/functions/weather.js
export async function handler(event) {
  try {
    const { zip } = event.queryStringParameters || {};
    if (!zip) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing zip parameter' }),
      };
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing OPENWEATHER_API_KEY in environment' }),
      };
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(
      zip
    )}&units=imperial&appid=${apiKey}`;

    const resp = await fetch(url);
    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data?.message || 'OpenWeather error' }),
      };
    }

    const temperature = data?.main?.temp ?? null;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature }),
    };
  } catch (err) {
    console.error('[weather] fatal:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
}