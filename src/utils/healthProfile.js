// src/utils/healthProfile.js
const KEY = 'aeli.healthProfile.v1';

// In-memory cache to avoid repeated JSON parse
let cache = null;

const defaultProfile = {
  chronicConditions: [],    // e.g., ["fibromyalgia", "migraines"]
  medications: [],          // e.g., [{ name: "sertraline", dose: "50mg", schedule: "daily" }]
  sensitivities: [],        // e.g., ["light", "sound", "smell"]
  // PHQ-9 tracking
  phq9: {
    lastScore: null,        // number 0..27
    lastTakenAt: null,      // ISO string
    cadenceDays: 14,        // default every 2 weeks (adaptive later)
    history: []             // [{ score, takenAt }]
  },
  // Flags for adaptive check-ins
  flags: {
    highPainDays: 0,        // rolling heuristic we can maintain later
    lowSleepStreak: 0
  },
  updatedAt: null
};

export function getHealthProfile() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...defaultProfile, ...JSON.parse(raw) } : { ...defaultProfile };
  } catch {
    cache = { ...defaultProfile };
  }
  return cache;
}

export function setHealthProfile(patch = {}) {
  const base = getHealthProfile();
  const next = {
    ...base,
    ...patch,
    phq9: { ...base.phq9, ...(patch.phq9 || {}) },
    updatedAt: new Date().toISOString()
  };
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

// Merge helpers
export function upsertCondition(name) {
  const p = getHealthProfile();
  const list = new Set(p.chronicConditions.map(s => s.toLowerCase()));
  if (!list.has(name.toLowerCase())) {
    const next = setHealthProfile({ chronicConditions: [...p.chronicConditions, name] });
    return next;
  }
  return p;
}

export function clearHealthProfile() {
  cache = null;
  try { localStorage.removeItem(KEY); } catch {}
  return getHealthProfile();
}
