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
    const end_time = new Date(Date.now() + seconds * 1000).toISOString();

    // Try a quick existence/select check to surface table errors early
    const probe = await client.from('timers').select('timer_id').limit(1);
    if (probe.error) {
      return respond(500, {
        error: "TABLE_PROBE_FAILED",
        code: probe.error.code || null,
        details: probe.error.details || null,
        hint: probe.error.hint || null,
        message: probe.error.message || String(probe.error),
        env
      });
    }

    const { data, error } = await client
      .from('timers')
      .upsert([{ user_id: userId, timer_id: timerId, end_time }], { onConflict: 'user_id,timer_id' })
      .select('user_id, timer_id, end_time')
      .single();

    if (error) {
      // Common cases:
      //  - 42501 or RLS text: row-level security denied
      //  - 23503/23505: constraints
      return respond(500, {
        error: "UPSERT_FAILED",
        code: error.code || null,
        details: error.details || null,
        hint: error.hint || null,
        message: error.message || String(error),
        env,
        payload: { userId, timerId, end_time, seconds }
      });
    }

    return respond(200, {
      ok: true,
      env,
      result: { userId: data.user_id, timerId: data.timer_id, end_time: data.end_time, seconds }
    });
  } catch (err) {
    return respond(500, { error: "FATAL", message: String(err?.message || err) });
  }
}
