// netlify/functions/create-timer.js
// Diagnostic-safe version: always returns JSON with details.

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js');

  const url = process.env.SUPABASE_URL || "";
  const service = process.env.SUPABASE_SERVICE_ROLE || "";
  const anon = process.env.SUPABASE_ANON_KEY || "";
  const key = service || anon;

  return {
    client: (url && key) ? createClient(url, key) : null,
    env: {
      hasUrl: Boolean(url),
      hasServiceRole: Boolean(service),
      hasAnon: Boolean(anon),
      using: service ? "SERVICE_ROLE" : (anon ? "ANON" : "NONE"),
    }
  };
}

const respond = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return respond(405, { error: "METHOD_NOT_ALLOWED", allow: "POST" });
    }

    const { client, env } = await getSupabase();
    if (!client) {
      return respond(503, {
        error: "UNCONFIGURED_SUPABASE",
        message: "Missing SUPABASE_URL or key (SERVICE_ROLE or ANON) in environment.",
        env
      });
    }

    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return respond(400, { error: "INVALID_JSON", message: "Request body is not valid JSON." });
    }

    const userId = (body.userId || "").trim();
    const seconds = Number.isFinite(body.seconds)
      ? Math.max(0, Math.floor(body.seconds))
      : Number.isFinite(body.minutes)
      ? Math.max(0, Math.floor(body.minutes * 60))
      : 0;

    if (!userId) return respond(400, { error: "MISSING_USER", message: "userId is required." });
    if (!seconds) return respond(400, { error: "MISSING_DURATION", message: "Provide seconds or minutes > 0." });

    // Make a timer id if not provided
    const { randomUUID } = await import('node:crypto');
    const timerId = (body.timerId || "").trim() || `t_${randomUUID()}`;
    // compute both times
const start_time = new Date().toISOString();
const end_time = new Date(Date.now() + seconds * 1000).toISOString();

// payload matches your table: (user_id, timer_id, start_time, end_time, status)
const payload = {
  user_id: userId,
  timer_id: timerId,
  start_time,
  end_time,
  status: 'active', // keep if your table has this column (your error shows it does)
};

const { data, error } = await client
  .from('timers')
  .upsert([payload], { onConflict: 'user_id,timer_id' })
  .select('user_id, timer_id, start_time, end_time, status')
  .single();

if (error) {
  return respond(500, {
    error: "UPSERT_FAILED",
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
    message: error.message || String(error),
    payload,
  });
}

return respond(200, {
  ok: true,
  result: data,
  seconds
});
  } catch (err) {
    return respond(500, { error: "FATAL", message: String(err?.message || err) });
  }
}
