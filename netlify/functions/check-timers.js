// netlify/functions/check-timers.js

async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_* key in environment');
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
    const userId = (qs.userId || '').trim();
    const timerId = (qs.timerId || '').trim();
    const JUST_EXPIRED_WINDOW_MS = 2000; // 2s grace window

    if (!userId && !timerId) return json(400, { error: 'MISSING_PARAMS' });

    // CASE 1: specific timer remaining
    if (userId && timerId) {
      const { data, error } = await supabase
        .from('timers')
        .select('end_time, status')
        .eq('user_id', userId)
        .eq('timer_id', timerId)
        .single();

      if (error) return json(500, { error: 'QUERY_FAILED', where: 'specific', message: error.message || String(error) });
      if (!data?.end_time) return json(200, { remaining: 0 });

      const endMs = new Date(data.end_time).getTime();
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      return json(200, { remaining, status: data.status || null });
    }

    // CASE 2: poll all active timers for a user
    if (!userId) return json(400, { error: 'MISSING_USER' });

    const { data, error } = await supabase
      .from('timers')
      .select('timer_id, end_time')
      .eq('user_id', userId)
      .eq('status', 'active'); // only active timers

    if (error) return json(500, { error: 'QUERY_FAILED', where: 'list', message: error.message || String(error) });

    const now = Date.now();
    const expiredNow = [];     // timers that just expired (within 2s)
    const staleExpired = [];   // timers expired long ago (silence + auto-expire)
    const pending = [];

    (data || []).forEach((t) => {
      const endMs = new Date(t.end_time).getTime();
      const remaining = Math.floor((endMs - now) / 1000);

      if (remaining <= 0) {
        const ageMs = now - endMs;
        if (ageMs <= JUST_EXPIRED_WINDOW_MS) {
          expiredNow.push(t.timer_id);
        } else {
          staleExpired.push(t.timer_id);
        }
      } else {
        pending.push({ timerId: t.timer_id, remaining });
      }
    });

    // Silently mark stale ones as expired so they won't trigger on reloads
    if (staleExpired.length > 0) {
      await supabase
        .from('timers')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .in('timer_id', staleExpired);
    }

    // Also mark just-expired as expired *after* we notify
    if (expiredNow.length > 0) {
      await supabase
        .from('timers')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .in('timer_id', expiredNow);
    }

    return json(200, { expiredTimers: expiredNow, pendingTimers: pending });
  } catch (err) {
    console.error('[check-timers] fatal:', err);
    return json(500, { error: 'Server error', details: String(err?.message || err) });
  }
}
