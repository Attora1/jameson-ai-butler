// src/utils/memoriesBridge.js
import { getHealthProfile } from './healthProfile';
import { SPOON_MAX } from '../constants/spoons';
import { getHealthProfile as _get } from './healthProfile';

// Optional: if your memories list also shows current spoons, you can pass it in
export function composeMemoryEntries({ spoons, spoonMax = SPOON_MAX } = {}) {
  const p = getHealthProfile();

  const lines = [];

  // Current spoons (if provided)
  if (typeof spoons === 'number') {
    lines.push(`Current spoons: ${spoons}/${spoonMax}`);
  } else {
    lines.push(`Current spoons: —/${spoonMax} (set via Check‑In)`);
  }

  // Chronic conditions
  const cc = Array.isArray(p.chronicConditions) ? p.chronicConditions : [];
  lines.push(
    `Chronic conditions: ${cc.length ? cc.join(', ') : 'none recorded'}`
  );

  // Medications (compact)
  const meds = Array.isArray(p.medications) ? p.medications : [];
  if (meds.length) {
    const m = meds
      .map((x) => {
        if (typeof x === 'string') return x;
        const n = x?.name ?? 'medication';
        const d = x?.dose ? ` ${x.dose}` : '';
        const s = x?.schedule ? ` (${x.schedule})` : '';
        return `${n}${d}${s}`;
      })
      .join(', ');
    lines.push(`Medications: ${m}`);
  } else {
    lines.push('Medications: none recorded');
  }

  // Sensitivities
  const sens = Array.isArray(p.sensitivities) ? p.sensitivities : [];
  lines.push(
    `Sensitivities: ${sens.length ? sens.join(', ') : 'none recorded'}`
  );

  // PHQ‑9 summary
  const lastScore = p?.phq9?.lastScore ?? null;
  const lastAt = p?.phq9?.lastTakenAt ?? null;
  const cadenceDays = p?.phq9?.cadenceDays ?? 14;
  const lastDate = lastAt ? new Date(lastAt).toLocaleDateString() : '—';
  lines.push(
    `PHQ‑9: ${lastScore ?? '—'} (last taken: ${lastDate}; cadence ~${cadenceDays}d)`
  );

  // You can add more derived notes here later (sleep streaks, high‑pain days, etc.)
  return [
    { title: 'AELI • Wellness Snapshot', content: lines.join('\n') },
  ];
}
