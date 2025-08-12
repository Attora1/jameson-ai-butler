// backend/set-timer.js
exports.handler = async (event) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

    const body = JSON.parse(event.body);
    const { timerId, duration } = body; // duration in seconds
    const userId = (body.userId || 'defaultUser').trim(); // Assuming userId is passed

    if (!timerId || typeof duration !== 'number' || duration <= 0) {
      return json(400, { error: 'Invalid timerId or duration' });
    }

    const startTime = Date.now();
    const endTime = startTime + (duration * 1000); // Convert duration to milliseconds

    const { error } = await supabase
      .from('timers') // Assuming a 'timers' table in Supabase
      .upsert({
        timer_id: timerId,
        user_id: userId,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        status: 'active'
      }, { onConflict: 'timer_id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return json(500, { error: 'Failed to set timer in DB' });
    }

    return json(200, { timerId, duration, endTime });

  } catch (err) {
    console.error('set-timer fatal:', err);
    return json(500, { error: 'Server error', details: String(err?.message || err) });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}