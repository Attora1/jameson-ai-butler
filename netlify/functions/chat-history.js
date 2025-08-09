// netlify/functions/chat-history.js
export async function handler(event) {
  try {
    const userId = event.queryStringParameters?.userId || 'defaultUser';

    // TODO: replace with your real storage fetch
    const history = [
      { sender: 'user', message: 'Hey' },
      { sender: 'aeli', message: 'Afternoon, miss. Shall we?' }
    ];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, history }),
    };
  } catch (err) {
    console.error('chat-history error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unable to fetch chat history' }),
    };
  }
}