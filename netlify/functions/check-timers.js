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

    if (!timerId || !userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing timerId or userId query parameter' }),
      };
    }

    const { data, error } = await supabase
      .from('timers')
      .select('end_time')
      .eq('timer_id', timerId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remaining: 0 }), // Timer not found or already finished
        };
      }
      console.error('check-timers error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unable to check timer status' }),
      };
    }

    const endTime = new Date(data.end_time).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000)); // Remaining in seconds

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remaining }),
    };
  } catch (err) {
    console.error('check-timers fatal:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error', details: String(err?.message || err) }),
    };
  }
}