// netlify/functions/check-timers.js
export async function handler() {
  try {
    // TODO: replace with your real timer lookup
    const pending = [
      { id: 'focus-25', endsAt: Date.now() + 5 * 60 * 1000 },
      { id: 'break-5', endsAt: Date.now() + 12 * 60 * 1000 }
    ];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pending }),
    };
  } catch (err) {
    console.error('check-timers error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unable to check timers' }),
    };
  }
}