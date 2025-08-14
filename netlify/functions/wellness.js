// netlify/functions/wellness.js
// ESM handler. Read/write a user's wellness state.
// Fields: spoons (0–10), mood (string), last_meal (timestamptz), last_med (timestamptz)

const json = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const { SPOON_MAX, clampSpoons } = require('../../shared/constants/spoons.js');

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or key");
  return createClient(url, key);
}

export async function handler(event) {
  try {
    const supabase = await getSupabase();
    const method = event.httpMethod.toUpperCase();

    if (method === "GET") {
      const userId = (event.queryStringParameters?.userId || "").trim() || "defaultUser";
      const { data, error } = await supabase
        .from("wellness")
        .select("user_id, spoons, mood, last_meal, last_med, updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return json(500, { error: "READ_FAILED", message: error.message });
      return json(200, { ok: true, userId, state: data || null });
    }

    if (method === "POST") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch {
        return json(400, { error: "INVALID_JSON" });
      }

      const userId = (body.userId || "").trim() || "defaultUser";
      const patch = {};
      if (Number.isFinite(body.spoons)) {
        patch.spoons = clampSpoons(body.spoons);
      }
      if (typeof body.mood === "string") {
        patch.mood = body.mood.slice(0, 64);
      }
      if (body.last_meal === true) {
        patch.last_meal = new Date().toISOString();
      } else if (typeof body.last_meal === "string") {
        patch.last_meal = new Date(body.last_meal).toISOString();
      }
      if (body.last_med === true) {
        patch.last_med = new Date().toISOString();
      } else if (typeof body.last_med === "string") {
        patch.last_med = new Date(body.last_med).toISOString();
      }
      patch.updated_at = new Date().toISOString();

      const row = { user_id: userId, ...patch };

      // Upsert; requires a PK or unique on user_id
      const { data, error } = await supabase
        .from("wellness")
        .upsert([row], { onConflict: "user_id" })
        .select("user_id, spoons, mood, last_meal, last_med, updated_at")
        .single();

      if (error) {
        return json(500, {
          error: "WRITE_FAILED",
          code: error.code || null,
          message: error.message || String(error),
          hint: error.hint || null,
          details: error.details || null
        });
      }
      return json(200, { ok: true, userId, state: data });
    }

    return json(405, { error: "METHOD_NOT_ALLOWED", allow: "GET,POST" });
  } catch (err) {
    return json(500, { error: "SERVER_ERROR", message: String(err?.message || err) });
  }
}

/*
SQL once per project (run in Supabase SQL editor):

create table if not exists public.wellness (
  user_id text primary key,
  spoons int,
  mood text,
  last_meal timestamptz,
  last_med timestamptz,
  updated_at timestamptz default now()
);

-- optional RLS (keep disabled if all writes go through service functions)
-- alter table public.wellness enable row level security;
-- create policy "read own wellness"  on public.wellness for select using (auth.uid()::text = user_id);
-- create policy "update own wellness" on public.wellness for insert with check (auth.uid()::text = user_id);
-- create policy "update own wellness" on public.wellness for update using (auth.uid()::text = user_id);
*/