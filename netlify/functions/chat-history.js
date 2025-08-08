// netlify/functions/chat-history.js

export async function handler(event, context) {
  const userId = event.queryStringParameters.userId || 'defaultUser';

  const mockHistory = [
    { sender: 'user', message: 'Hey' },
    { sender: 'aeli', message: 'Good afternoon, miss. ☕' }
  ];

  return {
    statusCode: 200,
    body: JSON.stringify({ userId, history: mockHistory }),
  };
}