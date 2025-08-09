// netlify/functions/chat.js
export async function handler(event) {
  try {
    // Support both GET (easier to test in browser) and POST (likely what your UI uses)
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, message: 'Chat GET alive' }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const userId = body.userId || 'defaultUser';
      const message = body.message || '';

      // TODO: replace with your real chat logic / model call
      const reply = message
        ? `Echo: ${message}`
        : 'Hello, miss. What shall we tackle?';

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reply,
          meta: { model: 'stub', ts: Date.now() },
        }),
      };
    }

    return {
      statusCode: 405,
      headers: { Allow: 'GET, POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err) {
    console.error('chat function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Chat failed' }),
    };
  }
}