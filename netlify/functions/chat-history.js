// netlify/functions/chat-history.js
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

// create a server-side client (service key bypasses RLS; keep this ONLY in functions)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

// tiny helper
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return json(500, { error: 'Missing Supabase env vars' });
    }

    const method = event.httpMethod;
    const userId = (event.queryStringParameters?.userId || 'defaultUser').trim();

    if (method === 'GET') {
      // fetch one row by user_id
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, history')
        .eq('user_id', userId)
        .single();

      if (error) {
        // "no rows" → return empty history instead of 500
        if (error.code === 'PGRST116') return json(200, { userId, history: [] });
        console.error('GET chat-history error:', error);
        return json(500, { error: 'Fetch failed' });
      }

      return json(200, { userId, history: Array.isArray(data?.history) ? data.history : [] });
    }

    if (method === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { error: 'Invalid JSON body' });
      }

      const incomingUserId = (body.userId || userId).trim();
      const history = Array.isArray(body.history) ? body.history : [];

      // upsert without requiring a unique constraint:
      // check for existing row, update if present, else insert
      const { data: existing, error: fetchErr } = await supabase
        .from('chat_history')
        .select('id')
        .eq('user_id', incomingUserId)
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        console.error('POST fetch existing error:', fetchErr);
        return json(500, { error: 'Lookup failed' });
      }

      if (existing?.id) {
        const { error: updErr } = await supabase
          .from('chat_history')
          .update({ history, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (updErr) {
          console.error('POST update error:', updErr);
          return json(500, { error: 'Update failed' });
        }
      } else {
        const { error: insErr } = await supabase
          .from('chat_history')
          .insert([{ user_id: incomingUserId, history }]);

        if (insErr) {
          console.error('POST insert error:', insErr);
          return json(500, { error: 'Insert failed' });
        }
      }

      return json(200, { ok: true });
    }

    return {
      statusCode: 405,
      headers: { Allow: 'GET, POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err) {
    console.error('chat-history fatal:', err);
    return json(500, { error: 'Server error' });
  }
}