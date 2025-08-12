// netlify/functions/chat.js
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

const json = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    if (event.httpMethod === 'GET') return json(200, { ok: true, message: 'Chat endpoint ready' });
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'GET, POST' }, body: 'Method Not Allowed' };

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON body' }); }

    const userId = (body.userId || 'defaultUser').trim();
    const userMsg = (body.message || '').toString().trim();
    if (!userMsg) return json(400, { error: 'Missing message' });

    // 1) Load history
    const { data: existing, error: fetchErr } = await supabase
      .from('chat_history')
      .select('id, history')
      .eq('user_id', userId)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') return json(500, { error: 'History lookup failed' });

    const history = Array.isArray(existing?.history) ? existing.history : [];

    // 2) Append user message
    const userEntry = { sender: 'user', message: userMsg, ts: Date.now() };
    history.push(userEntry);

    // 3) Generate reply (stub for now)
    const replyText = `Understood: "${userMsg}". What next, miss?`;
    const botEntry = { sender: 'aeli', message: replyText, ts: Date.now() };
    history.push(botEntry);

    // 4) Save (upsert by user_id)
    if (existing?.id) {
      const { error: updErr } = await supabase
        .from('chat_history')
        .update({ history, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updErr) return json(500, { error: 'Failed to save chat' });
    } else {
      const { error: insErr } = await supabase
        .from('chat_history')
        .insert([{ user_id: userId, history }]);
      if (insErr) return json(500, { error: 'Failed to save chat' });
    }

    return json(200, { userId, reply: replyText, history });
  } catch (err) {
    console.error('chat fatal:', err);
    return json(500, { error: 'Server error' });
  }
}