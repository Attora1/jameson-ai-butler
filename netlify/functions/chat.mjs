// netlify/functions/chat.mjs
// ESM entry that wraps your existing CommonJS implementation in chat.cjs

import * as legacy from './chat.cjs';

// Awareness preamble (no need to touch your old file)
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
    bits.length ? `Context: ${bits.join(' ')}` : ``, 
    `Style: ${style.join(' ')}`,
  ].filter(Boolean).join('\n');
}

export async function handler(event, context) {
  try {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; } 

    if (typeof body.message === 'string' && body.awareness && Object.keys(body.awareness).length) {
      const pre = buildAwarenessPreamble(body.awareness || {}, body.settings || {});
      body.message = `${pre}\n\n${body.message}`;
      event = { ...event, body: JSON.stringify(body) };
    }
  } catch {
    // ignore; fall through with original event if anything goes wrong here
  }

  // Call your original CommonJS function (exported as module.exports = { handler })
  return legacy.handler(event, context);
}
