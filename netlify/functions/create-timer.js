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
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const { duration, userId, timerId } = JSON.parse(event.body);

    if (!duration || !userId || !timerId) {
      return json(400, { error: 'Missing required fields: duration, userId, timerId' });
    }

    const supabase = await getSupabaseClient();
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 1000);

    const { data, error } = await supabase
      .from('timers')
      .insert({
        user_id: userId,
        timer_id: timerId,
        end_time: endTime.toISOString(),
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[create-timer] Supabase error:', error);
      // Handle potential duplicate timer_id if it's a unique constraint
      if (error.code === '23505') { // unique_violation
          return json(409, { error: 'A timer with this ID already exists.' });
      }
      return json(500, { error: 'Failed to create timer in database.' });
    }

    return json(200, { message: 'Timer created successfully', timer: data });

  } catch (err) {
    console.error('[create-timer] fatal error:', err);
    if (err instanceof SyntaxError) {
        return json(400, { error: 'Invalid JSON body' });
    }
    return json(500, { error: 'An unexpected error occurred.' });
  }
}
