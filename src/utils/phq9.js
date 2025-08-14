// src/utils/phq9.js

// Standard PHQ-9 items (0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day)
export const PHQ9_ITEMS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way"
];

// Accepts array of 9 integers (0..3). Returns { score, severity }
export function scorePHQ9(responses) {
  if (!Array.isArray(responses) || responses.length !== 9) {
    throw new Error("PHQ-9 requires an array of 9 responses");
  }
  const clamped = responses.map(v => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(3, n)) : 0;
  });
  const score = clamped.reduce((a, b) => a + b, 0);

  let severity = "none";
  if (score >= 5 && score <= 9) severity = "mild";
  else if (score >= 10 && score <= 14) severity = "moderate";
  else if (score >= 15 && score <= 19) severity = "moderately severe";
  else if (score >= 20) severity = "severe";

  return { score, severity };
}

// Persist a PHQ-9 result into the profile (local only for now)
import { getHealthProfile, setHealthProfile } from './healthProfile';

export function savePHQ9Result(score, takenAt = new Date().toISOString()) {
  const p = getHealthProfile();
  const history = Array.isArray(p.phq9.history) ? [...p.phq9.history] : [];
  history.push({ score, takenAt });

  // Adaptive cadence starting point:
  // - score >= 15 → weekly (7d)
  // - 10..14 → 10 days
  // - <10 → 14 days
  let cadenceDays = 14;
  if (score >= 15) cadenceDays = 7;
  else if (score >= 10) cadenceDays = 10;

  return setHealthProfile({
    phq9: {
      ...p.phq9,
      lastScore: score,
      lastTakenAt: takenAt,
      cadenceDays,
      history
    }
  });
}
