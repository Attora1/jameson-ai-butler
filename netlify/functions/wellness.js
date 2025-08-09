// netlify/functions/wellness.js

export async function handler(event, context) {
  const userId = event.queryStringParameters.userId || 'defaultUser';

  // TODO: Replace this with your actual logic
  const mockData = {
    userId,
    mood: 'tired',
    spoons: 5,
    lastMeal: '8:30 AM',
    lastMed: 'Yes',
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' }, // ✅ add this
    body: JSON.stringify(mockData),
  };
}