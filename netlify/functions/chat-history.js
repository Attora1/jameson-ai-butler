// netlify/functions/chat-history.js
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_CHAT = process.env.AIRTABLE_TABLE_CHAT || 'ChatHistory';

const AT_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_CHAT)}`;

async function airtableFetch(path = '', opts = {}) {
  const res = await fetch(`${AT_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return res.json();
}

export async function handler(event) {
  try {
    const method = event.httpMethod;
    const userId = (event.queryStringParameters?.userId || 'defaultUser').trim();

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing Airtable env vars' }),
      };
    }

    if (method === 'GET') {
      // Find the row by userId
      const data = await airtableFetch(`?filterByFormula=${encodeURIComponent(`{userId}='${userId}'`)}&maxRecords=1`);
      const record = data.records?.[0];
      const history = record?.fields?.history ? JSON.parse(record.fields.history) : [];
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, history }),
      };
    }

    if (method === 'POST') {
      // Expect { userId, history } in body
      const body = JSON.parse(event.body || '{}');
      const incomingUserId = (body.userId || userId).trim();
      const history = Array.isArray(body.history) ? body.history : [];

      // Upsert: check if exists, update; else create
      const existing = await airtableFetch(`?filterByFormula=${encodeURIComponent(`{userId}='${incomingUserId}'`)}&maxRecords=1`);
      if (existing.records?.length) {
        const recId = existing.records[0].id;
        await airtableFetch(`/${recId}`, {
          method: 'PATCH',
          body: JSON.stringify({ fields: { userId: incomingUserId, history: JSON.stringify(history) } }),
        });
      } else {
        await airtableFetch('', {
          method: 'POST',
          body: JSON.stringify({ records: [{ fields: { userId: incomingUserId, history: JSON.stringify(history) } }] }),
        });
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    }

    return {
      statusCode: 405,
      headers: { Allow: 'GET, POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err) {
    console.error('chat-history error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unable to fetch/save chat history' }),
    };
  }
}