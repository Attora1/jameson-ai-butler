// netlify/functions/check-timers.js

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
    const supabase = await getSupabaseClient();
    const qs = event.queryStringParameters || {};
    const timerId = (qs.timerId || '').trim();
    const userId = (qs.userId || '').trim();

    // CASE 1: check specific timer remaining
    if (timerId && userId) {
      const { data, error } = await supabase
        .from('timers')
        .select('end_time')
        .eq('timer_id', timerId)
        .eq('user_id', userId)
        .single();

      if (error) {
        // PostgREST “no rows” is commonly PGRST116; treat as 0 remaining
        if (error.code === 'PGRST116') return json(200, { remaining: 0 });
        console.error('[check-timers] specific error:', error);
        return json(500, { error: 'Unable to check specific timer' });
      }

      if (!data || !data.end_time) return json(200, { remaining: 0 });

      const endMs = new Date(data.end_time).getTime();
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      return json(200, { remaining });
    }

    // CASE 2: poll all timers for a user
    if (!userId) return json(400, { error: 'Missing userId' });

    const { data, error } = await supabase
      .from('timers')
      .select('timer_id, end_time')
      .eq('user_id', userId);

    if (error) {
      console.error('[check-timers] list error:', error);
      return json(500, { error: 'Unable to list timers' });
    }

    const now = Date.now();
    const expiredTimers = [];
    const pendingTimers = [];

    (data || []).forEach((t) => {
      const endMs = new Date(t.end_time).getTime();
      const remaining = Math.max(0, Math.floor((endMs - now) / 1000));
      if (remaining === 0) expiredTimers.push(t.timer_id);
      else pendingTimers.push({ timerId: t.timer_id, remaining });
    });

    return json(200, { expiredTimers, pendingTimers });
  } catch (err) {
    console.error('[check-timers] fatal:', err);
    return json(500, { error: 'Server error', details: String(err?.message || err) });
  }
}