// netlify/functions/wellness.js
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

const json = (code, body, extraHeaders = {}) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json', ...extraHeaders },
  body: JSON.stringify(body),
});

export async function handler(event) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return json(500, { error: 'Missing Supabase env vars' });
    }

    const method = event.httpMethod;
    const userId = (event.queryStringParameters?.userId || 'defaultUser').trim();

    if (method === 'GET') {
      // fetch current wellness row for user
      const { data, error } = await supabase
        .from('wellness')
        .select('id, mood, spoons, last_meal, last_med, updated_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows found → return an empty/default payload
        if (error.code === 'PGRST116') {
          return json(200, {
            userId,
            mood: null,
            spoons: null,
            lastMeal: null,
            lastMed: null,
            updatedAt: null,
          });
        }
        console.error('GET wellness error:', error);
        return json(500, { error: 'Fetch failed' });
      }

      return json(200, {
        userId,
        mood: data?.mood ?? null,
        spoons: data?.spoons ?? null,
        lastMeal: data?.last_meal ?? null,
        lastMed: data?.last_med ?? null,
        updatedAt: data?.updated_at ?? null,
      });
    }

    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { error: 'Invalid JSON body' });
      }

      const incomingUserId = (body.userId || userId).trim();
      const payload = {
        // normalise keys coming from the UI
        mood: body.mood ?? null,
        spoons: Number.isFinite(body.spoons) ? body.spoons : (body.spoons == null ? null : Number(body.spoons) || null),
        last_meal: body.lastMeal ?? null,
        last_med: body.lastMed ?? null,
        updated_at: new Date().toISOString(),
      };

      // upsert by presence
      const { data: existing, error: lookupErr } = await supabase
        .from('wellness')
        .select('id')
        .eq('user_id', incomingUserId)
        .single();

      if (lookupErr && lookupErr.code !== 'PGRST116') {
        console.error('Lookup wellness error:', lookupErr);
        return json(500, { error: 'Lookup failed' });
      }

      if (existing?.id) {
        const { error: updErr } = await supabase
          .from('wellness')
          .update(payload)
          .eq('id', existing.id);

        if (updErr) {
          console.error('Update wellness error:', updErr);
          return json(500, { error: 'Update failed' });
        }
      } else {
        const { error: insErr } = await supabase
          .from('wellness')
          .insert([{ user_id: incomingUserId, ...payload }]);

        if (insErr) {
          console.error('Insert wellness error:', insErr);
          return json(500, { error: 'Insert failed' });
        }
      }

      return json(200, { ok: true });
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'GET, POST, PATCH, PUT' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err) {
    console.error('wellness fatal:', err);
    return json(500, { error: 'Server error' });
  }
}