// netlify/functions/chat.js
// No top-level supabase import or client creation

// ── DEBUG + ROBUST PERSONA LOADER ────────────────────────────────────────────
const fs = require("fs");
const path = require("path");

// Optional: set to true once to print what's actually on the lambda at runtime
const PRINT_DIR_ON_BOOT = true;

function tryLoadPersona() {
  try {
    const here = path.dirname(__filename);
    if (PRINT_DIR_ON_BOOT) {
      // This will show you exactly where the function runs and which files exist
      console.log("[CHAT] __filename:", __filename);
      console.log("[CHAT] dirname:", here);
      console.log("[CHAT] files in dir:", fs.readdirSync(here));
    }

    // Try common colocated filenames first
    const candidates = ["./AELI_PERSONA.cjs", "./AELI_PERSONA.js", "./AELI_PERSONA.mjs"];
    for (const rel of candidates) {
      const abs = path.join(here, rel);
      if (fs.existsSync(abs)) {
        const mod = require(abs); // CommonJS require works for .cjs and .js
        // Support default export or module.exports
        const text = (typeof mod === "string") ? mod : (mod.default || mod.AELI_PERSONA || "");
        if (typeof text === "string" && text.trim()) return text;
      }
    }
  } catch (e) {
    console.warn("[CHAT] Persona require failed:", e?.message || e);
  }

  // FINAL SAFETY: inline minimal persona so the function never 502s again
  return `
You are AELI: a proactive AI butler with a dry British wit (Jarvis vibes),
but always kind and empathetic. Address Nessa by name. Refer to her wife as
Sam. Respect Spoon Theory and celebrate mental wins. Offer one small, doable
next step—never harsh or dismissive. Be concise; gentle humor allowed.
  `.trim();
}

const AELI_PERSONA = tryLoadPersona();
// ─────────────────────────────────────────────────────────────────────────────

async function getSupabaseClient() {
  // ESM-only library, so import it at runtime:
  const { createClient } = await import('@supabase/supabase-js');

  const url = process.env.SUPABASE_URL;
  // Use service role only on server functions, NEVER in the browser.
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_* key in environment');
  }

  return createClient(url, key);
}

const json = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// --- 3) Generate reply with Gemini ---
async function askGroq(history, userMsg) {
  const messages = [
    { role: "system", content: AELI_PERSONA },
    ...history.map(m => ({
      role: m.sender === 'aeli' ? 'assistant' : 'user',
      content: m.message
    })),
    { role: "user", content: userMsg }
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();

  // ultra-defensive extraction
  return data?.choices?.[0]?.message?.content?.trim() || "Understood. How may I assist you?";
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
    // const userSettings = body.settings || {}; // Removed userSettings extraction

    // Only load Supabase if you truly need it in this request:
    const supabase = await getSupabaseClient(); // Get client inside handler

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
    const replyText = await askGroq(history, userMsg); // Changed to askGroq
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
