// src/constants/spoons.js
// Canonical max — tentatively 12 until we finalize (10 vs 12).
export const SPOON_MAX = 12;

// Default is "unset" to avoid assuming user energy.
export const DEFAULT_SPOONS = undefined;

// Reusable clamp for any place that writes spoons.
export function clampSpoons(n) {
  if (n === undefined || n === null || isNaN(n)) return 0;
  const x = Math.round(Number(n));
  return Math.max(0, Math.min(SPOON_MAX, x));
}