// src/utils/estimateSpoons.js
import { clampSpoons, SPOON_MAX } from '../constants/spoons';

// Very simple first-pass heuristic — we’ll refine in the next step.
// inputs = { hoursSleep, bedtime, mealsEaten, tookMeds, pain0to10, mood1to5 }
export function estimateSpoons(inputs, max = SPOON_MAX) {
  let score = Math.round(max * 0.6); // start at ~60% as neutral baseline

  const hs = Number(inputs.hoursSleep ?? 0);
  if (hs >= 8) score += 3;
  else if (hs >= 6) score += 1;
  else if (hs >= 4) score -= 2;
  else score -= 4;

  // bedtime penalty if after 01:00
  if (typeof inputs.bedtime === 'string') {
    const m = inputs.bedtime.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      const hh = Number(m[1]);
      const penalty = (hh >= 1 && hh <= 4) ? 1 : (hh > 4 && hh < 12) ? 0 : 0;
      score -= penalty;
    }
  }

  // meals: 0..3
  const meals = Number(inputs.mealsEaten ?? 0);
  score += Math.max(0, Math.min(3, meals)); // +0..+3

  // meds adherence
  if (inputs.tookMeds === false) score -= 2;

  // pain 0..10 → subtract up to ~4
  const pain = Number(inputs.pain0to10 ?? 0);
  score -= Math.round((Math.max(0, Math.min(10, pain)) / 10) * 4);

  // mood 1..5: nudge +/-1
  const mood = Number(inputs.mood1to5 ?? 3);
  if (mood >= 4) score += 1;
  else if (mood <= 2) score -= 1;

  return clampSpoons(score);
}