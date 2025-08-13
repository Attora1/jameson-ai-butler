// netlify/functions/chat.js  (ESM wrapper around your existing CJS handler)

import cjs from './chat.cjs';

// Awareness preamble (keeps what we added, but does it here so you don't edit the old file)
function buildAwarenessPreamble(awareness = {}, settings = {}) {
  const bits = [];
  if (awareness.clock) bits.push(`Local time: ${awareness.clock}.`);
  if (awareness.isLateNight) bits.push(`It's late night for the user.`);
  if (awareness.sessionLong) bits.push(`The current session has been going for a while.`);
  if (awareness.sinceLastUser) bits.push(`Last user message: ${awareness.sinceLastUser} ago.`);
  if (awareness.sinceLastAeli) bits.push(`Last assistant message: ${awareness.sinceLastAeli} ago.`);
  if (awareness.saysNotSleepy) bits.push(`User implied they are not sleepy yet.`);
  if (awareness.asksWindDown)  bits.push(`User asked about winding down / sleep help.`);
  if (awareness.asksFocus)     bits.push(`User asked about focus / deep work.`);

  const style = [];
  style.push(`Avoid overusing the user's name.`);
  style.push(`Be succinct unless the user asks for detail.`);
  if (awareness.isLateNight && awareness.saysNotSleepy) {
    style.push(`Prefer a calming, practical tone; suggest tiny next steps only if asked or obviously helpful.`);
  }

  return [
    `You are AELI, a compassionate, capable assistant.`,
    bits.length ? `Context: ${bits.join(' ')}` : `
`,
    `Style: ${style.join(' ')}`,
  ].filter(Boolean).join('\n');
}

export async function handler(event, context) {
  try {
    // Inject awareness preamble into the message (no changes to your CJS file)
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

    if (typeof body.message === 'string' && body.awareness && Object.keys(body.awareness).length) {
      const pre = buildAwarenessPreamble(body.awareness || {}, body.settings || {});
      body.message = `${pre}\n\n${body.message}`;
      event = { ...event, body: JSON.stringify(body) };
    }
  } catch {
    // ignore and fall through with the original event
  }

  // Call your original CommonJS function
  return cjs.handler(event, context);
}