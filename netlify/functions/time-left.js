// netlify/functions/time-left.js
// Returns remaining/elapsed time for either a specific timer (userId+timerId)
// or, if no timerId is provided, the nearest ACTIVE timer for the user.

async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_* key in environment');
  return createClient(url, key);
}

const respond = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function secsHuman(s) {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export async function handler(event) {
  try {
    const supabase = await getSupabaseClient();
    const qs = event.queryStringParameters || {};
    const userId = (qs.userId || '').trim();
    const timerId = (qs.timerId || '').trim();

    if (!userId) return respond(400, { error: 'MISSING_USER', message: 'Provide userId' });

    const nowMs = Date.now();

    // If a specific timer is requested
    if (timerId) {
      const { data, error } = await supabase
        .from('timers')
        .select('timer_id, start_time, end_time, status')
        .eq('user_id', userId)
        .eq('timer_id', timerId)
        .single();

      if (error) return respond(404, { error: 'NOT_FOUND', message: 'Timer not found' });

      const start = data.start_time ? new Date(data.start_time).getTime() : null;
      const end = data.end_time ? new Date(data.end_time).getTime() : null;

      const remaining = end ? Math.max(0, Math.floor((end - nowMs) / 1000)) : 0;
      const elapsed   = start ? Math.max(0, Math.floor((nowMs - start) / 1000)) : null;

      return respond(200, {
        timerId: data.timer_id,
        status: data.status || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        remainingSeconds: remaining,
        elapsedSeconds: elapsed,
        humanRemaining: secsHuman(remaining),
        humanElapsed: elapsed == null ? null : secsHuman(elapsed),
      });
    }

    // Otherwise, pick the soonest ACTIVE timer for this user
    const { data, error } = await supabase
      .from('timers')
      .select('timer_id, start_time, end_time, status')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) return respond(500, { error: 'QUERY_FAILED', message: error.message || String(error) });
    if (!data || data.length === 0) return respond(404, { error: 'NO_ACTIVE_TIMERS' });

    // choose the one ending soonest
    const sorted = data
      .filter(t => t.end_time)
      .sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
    const pick = sorted[0];

    const start = pick.start_time ? new Date(pick.start_time).getTime() : null;
    const end   = new Date(pick.end_time).getTime();

    const remaining = Math.max(0, Math.floor((end - nowMs) / 1000));
    const elapsed   = start ? Math.max(0, Math.floor((nowMs - start) / 1000)) : null;

    return respond(200, {
      timerId: pick.timer_id,
      status: pick.status || null,
      start_time: pick.start_time || null,
      end_time: pick.end_time,
      remainingSeconds: remaining,
      elapsedSeconds: elapsed,
      humanRemaining: secsHuman(remaining),
      humanElapsed: elapsed == null ? null : secsHuman(elapsed),
    });
  } catch (err) {
    console.error('[time-left] fatal:', err);
    return respond(500, { error: 'SERVER_ERROR', message: String(err?.message || err) });
  }
}
