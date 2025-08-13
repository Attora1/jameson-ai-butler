// netlify/functions/cancel-timer.js
// Cancels one timer (userId + timerId) or all active timers for a user.

async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_* key in environment');
  return createClient(url, key);
}

const json = (code, body) => ({
  statusCode: code,
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
      return json(400, { error: 'INVALID_JSON', message: 'Request body must be JSON.' });
    }

    const userId = (body.userId || '').trim();
    const timerId = (body.timerId || '').trim();
    if (!userId) return json(400, { error: 'MISSING_USER' });

    if (timerId) {
      const { data, error } = await supabase
        .from('timers')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('timer_id', timerId)
        .select('timer_id');

      if (error) return json(500, { error: 'UPDATE_FAILED', message: error.message || String(error) });
      return json(200, { ok: true, cancelled: data?.map(d => d.timer_id) || [], count: data?.length || 0 });
    }

    // Cancel all ACTIVE timers for the user
    const { data, error } = await supabase
      .from('timers')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select('timer_id');

    if (error) return json(500, { error: 'UPDATE_FAILED', message: error.message || String(error) });
    return json(200, { ok: true, cancelled: data?.map(d => d.timer_id) || [], count: data?.length || 0 });
  } catch (err) {
    console.error('[cancel-timer] fatal:', err);
    return json(500, { error: 'SERVER_ERROR', message: String(err?.message || err) });
  }
}
