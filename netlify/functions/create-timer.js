// netlify/functions/create-timer.js

async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_* key in environment');
  }
  return createClient(url, key);
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return json(405, { error: 'Method Not Allowed', allow: 'POST' });
    }

    const supabase = await getSupabaseClient();

    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON body' });
    }

    const userId = (body.userId || '').trim();
    if (!userId) return json(400, { error: 'Missing userId' });

    // Accept either seconds or minutes
    const seconds =
      typeof body.seconds === 'number'
        ? Math.max(0, Math.floor(body.seconds))
        : typeof body.minutes === 'number'
        ? Math.max(0, Math.floor(body.minutes * 60))
        : 0;

    if (!seconds) return json(400, { error: 'Provide seconds or minutes > 0' });

    // Timer ID (caller can provide, else we generate one)
    const { randomUUID } = await import('node:crypto');
    const timerId = (body.timerId || '').trim() || `t_${randomUUID()}`;

    const end_time = new Date(Date.now() + seconds * 1000).toISOString();

    // Upsert timer (schema: timers(user_id text, timer_id text, end_time timestamptz))
    const { data, error } = await supabase
      .from('timers')
      .upsert([{ user_id: userId, timer_id: timerId, end_time }], {
        onConflict: 'user_id,timer_id',
      })
      .select('user_id,timer_id,end_time')
      .single();

    if (error) {
      console.error('[create-timer] upsert error:', error);
      return json(500, { error: 'Failed to create timer', details: error.message || error });
    }

    return json(200, { ok: true, timerId: data.timer_id, end_time: data.end_time, seconds });
  } catch (err) {
    console.error('[create-timer] fatal:', err);
    return json(500, { error: 'Server error', details: String(err?.message || err) });
  }
}