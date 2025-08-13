// netlify/functions/system-status.js
// One-stop health probe for AELI. Never throws; always returns JSON.

const json = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

async function getSupabase() {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL || "";
    const service = process.env.SUPABASE_SERVICE_ROLE || "";
    const anon = process.env.SUPABASE_ANON_KEY || "";
    const key = service || anon;

    return {
      client: url && key ? createClient(url, key) : null,
      env: {
        hasUrl: Boolean(url),
        hasServiceRole: Boolean(service),
        hasAnon: Boolean(anon),
        using: service ? "SERVICE_ROLE" : (anon ? "ANON" : "NONE"),
      },
    };
  } catch (err) {
    return { client: null, env: { hasUrl: false, hasServiceRole: false, hasAnon: false, using: "NONE" } };
  }
}

async function countRows(client, table, filters = (q) => q) {
  try {
    const q = filters(client.from(table).select("*", { count: "exact", head: true }));
    const { error, count } = await q;
    if (error) return { ok: false, error: cleanError(error) };
    return { ok: true, count: count ?? 0 };
  } catch (err) {
    return { ok: false, error: { message: String(err?.message || err) } };
  }
}

function cleanError(error) {
  return {
    code: error?.code || null,
    message: error?.message || String(error),
    details: error?.details || null,
    hint: error?.hint || null,
  };
}

export async function handler() {
  const startedAt = Date.now();
  const suggestions = [];

  // ---- Env checks
  const env = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE: Boolean(process.env.SUPABASE_SERVICE_ROLE),
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    OPENWEATHER_API_KEY: Boolean(process.env.OPENWEATHER_API_KEY),
  };

  if (!env.OPENWEATHER_API_KEY) {
    suggestions.push("Set OPENWEATHER_API_KEY (weather endpoint will 500 without it).");
  }

  // ---- Supabase reachability
  const { client, env: sbEnv } = await getSupabase();
  const supabase = { reachable: Boolean(client), using: sbEnv.using };
  if (!client) {
    suggestions.push("Configure SUPABASE_URL and either SUPABASE_SERVICE_ROLE (preferred) or SUPABASE_ANON_KEY.");
  }

  // ---- DB probes (only if reachable)
  const db = {};

  if (client) {
    // timers: existence, column sanity, counts by status
    // (Selecting columns forces PostgREST to validate column names; missing cols will error with 42703.)
    let timersColumns;
    try {
      const { error } = await client
        .from("timers")
        .select("user_id,timer_id,start_time,end_time,status", { count: "exact" })
        .limit(1);
      timersColumns = error ? { ok: false, error: cleanError(error) } : { ok: true };
    } catch (err) {
      timersColumns = { ok: false, error: { message: String(err?.message || err) } };
    }

    const timersActive   = await countRows(client, "timers", (q) => q.eq("status", "active"));
    const timersExpired  = await countRows(client, "timers", (q) => q.eq("status", "expired"));
    const timersCanceled = await countRows(client, "timers", (q) => q.eq("status", "cancelled"));

    db.timers = {
      columnsOk: timersColumns?.ok || false,
      columnsError: timersColumns?.error || null,
      counts: {
        active:   timersActive.ok   ? timersActive.count   : null,
        expired:  timersExpired.ok  ? timersExpired.count  : null,
        cancelled: timersCanceled.ok ? timersCanceled.count : null,
      },
      errors: {
        active:   timersActive.ok   ? null : timersActive.error,
        expired:  timersExpired.ok  ? null : timersExpired.error,
        cancelled: timersCanceled.ok ? null : timersCanceled.error,
      },
    };

    if (timersColumns?.error?.code === "42P01") {
      suggestions.push('Create table "timers" (user_id text, timer_id text, start_time timestamptz, end_time timestamptz, status text, primary key (user_id, timer_id)).');
    }
    if (timersColumns?.error?.code === "42703") {
      suggestions.push("One or more expected columns missing on timers (need start_time, end_time, status).");
    }

    // wellness: existence + rough count
    let wellnessColumns;
    try {
      const { error } = await client
        .from("wellness")
        .select("user_id, spoons, mood, last_med, last_meal, updated_at", { count: "exact" })
        .limit(1);
      wellnessColumns = error ? { ok: false, error: cleanError(error) } : { ok: true };
    } catch (err) {
      wellnessColumns = { ok: false, error: { message: String(err?.message || err) } };
    }

    const wellnessCount = await countRows(client, "wellness");

    db.wellness = {
      columnsOk: wellnessColumns?.ok || false,
      columnsError: wellnessColumns?.error || null,
      count: wellnessCount.ok ? wellnessCount.count : null,
      error: wellnessCount.ok ? null : wellnessCount.error,
    };

    if (wellnessColumns?.error?.code === "42P01") {
      suggestions.push('Create table "wellness" (user_id text primary key, spoons int, mood text, last_med timestamptz, last_meal timestamptz, updated_at timestamptz default now()).');
    }

    // RLS reminder (we can’t read pg_policy via PostgREST by default, so just nudge)
    if (sbEnv.using === "ANON") {
      suggestions.push("Consider enabling RLS and using SERVICE_ROLE in server functions to bypass it.");
    } else {
      suggestions.push("If any tables are exposed to the client, enable RLS with appropriate policies.");
    }
  }

  // ---- Function endpoints summary (static list to help you verify routing)
  const endpoints = [
    "/.netlify/functions/chat",
    "/.netlify/functions/check-timers",
    "/.netlify/functions/create-timer",
    "/.netlify/functions/cancel-timer",
    "/.netlify/functions/time-left",
    "/.netlify/functions/weather",
    "/.netlify/functions/wellness",
    "/.netlify/functions/system-status",
  ];

  const payload = {
    ok: Boolean(client),
    env,
    supabase,
    db,
    endpoints,
    runtime: {
      node: process.version,
      tz: process.env.TZ || "UTC",
      now: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt,
    },
    suggestions,
  };

  return json(200, payload);
}