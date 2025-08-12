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

export async function handler(event) {
  try {
    const supabase = await getSupabaseClient();

    const { timerId, userId } = event.queryStringParameters || {};

    if (timerId && userId) {
      // Logic for specific timer status (as implemented before)
      const { data, error } = await supabase
        .from('timers')
        .select('end_time')
        .eq('timer_id', timerId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remaining: 0 }) };
        }
        console.error('check-timers error (specific):', error);
        return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unable to check specific timer status' }) };
      }

      const endTime = new Date(data.end_time).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000)); // Remaining in seconds

      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ remaining }) };

    } else {
      // Logic for polling all active timers (if no specific timerId/userId provided)
      // This assumes 'usePersistentTimerPolling' needs to know about all active timers
      // and then filter for expired ones on the frontend.
      // Or, we can filter for expired ones here. Let's filter here.

      // This part needs a userId to fetch timers for a specific user.
      if (!userId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing userId query parameter for general timer check' }),
        };
      }

      const { data: timers, error } = await supabase
        .from('timers')
        .select('timer_id, end_time, status')
        .eq('user_id', userId)
        .eq('status', 'active'); // Only fetch active timers

      if (error) {
        console.error('check-timers error (general):', error);
        return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unable to check general timer status' }) };
      }

      const now = Date.now();
      const expiredTimers = [];
      const pendingTimers = [];

      timers.forEach(timer => {
        const endTime = new Date(timer.end_time).getTime();
        if (endTime <= now) {
          expiredTimers.push(timer.timer_id);
          // Optionally, update status to 'expired' in DB here
        } else {
          pendingTimers.push({
            id: timer.timer_id,
            endsAt: endTime,
            remaining: Math.floor((endTime - now) / 1000)
          });
        }
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiredTimers, pendingTimers }),
      };
    }
  } catch (err) {
    console.error('check-timers fatal:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error', details: String(err?.message || err) }),
    };
  }
}