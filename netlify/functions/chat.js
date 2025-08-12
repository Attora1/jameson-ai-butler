// netlify/functions/chat.js
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

const json = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// --- 3) Generate reply with Gemini ---
async function askGemini(history, userMsg) {
  // keep it light: last 8 turns max
  const tail = history.slice(-8);
  const parts = [
    { text: "You are AELI, a supportive, dry‑witted assistant. Keep replies concise and helpful." },
    { text: "Conversation so far:" },
    ...tail.map(m => ({ text: `${m.sender === 'aeli' ? 'AELI' : 'User'}: ${m.message}` })),
    { text: `User: ${userMsg}` },
    { text: "AELI:" }
  ];

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts }] })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();

  // ultra-defensive extraction
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Understood. What next, miss?";
}

export async function handler(event) {
  try {
    if (event.httpMethod === 'GET') return json(200, { ok: true, message: 'Chat endpoint ready' });
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'GET, POST' }, body: 'Method Not Allowed' };

    const body = event.body ? JSON.parse(event.body) : {};

    // Accept multiple client shapes and trim
    const message = 
      (typeof body.message === 'string' && body.message.trim()) ||
      (typeof body.text === 'string' && body.text.trim()) ||
      (typeof body.input === 'string' && body.input.trim()) ||
      '';

    // If something (a boot effect) calls this with no message, just no-op.
    if (!message) {
      return {
        statusCode: 204, // No Content (prevents 400 spam + "technical difficulties")
        body: '',
      };
    }

    const userId = (body.userId || 'defaultUser').trim();
    const userMsg = message;

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
    const replyText = await askGemini(history, userMsg);
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
    // TEMP DEBUG: surface the real reason for 500s
    console.error("CHAT FUNC ERROR:", err);

    const details = {
      message: err?.message || String(err),
      name: err?.name,
      stack: (err?.stack || "").split("\n").slice(0, 5), // first lines are enough
    };

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", details }),
    };
  }
}