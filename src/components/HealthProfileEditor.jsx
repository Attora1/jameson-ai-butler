import React, { useState } from 'react';
import { getHealthProfile, setHealthProfile } from '../utils/healthProfile';
import { PHQ9_ITEMS, scorePHQ9, savePHQ9Result } from '../utils/phq9';

export default function HealthProfileEditor({ open, onClose }) {
  const initial = getHealthProfile();
  const [conditions, setConditions] = useState(initial.chronicConditions.join(', '));
  const [meds, setMeds] = useState(initial.medications.map(m => typeof m === 'string' ? m : m.name).join(', '));
  const [sensitivities, setSensitivities] = useState(initial.sensitivities.join(', '));

  const [phq9Answers, setPhq9Answers] = useState(Array(9).fill(0));
  const [phq9Taken, setPhq9Taken] = useState(false);

  if (!open) return null;

  const handlePHQChange = (i, val) => {
    const copy = [...phq9Answers];
    copy[i] = Number(val);
    setPhq9Answers(copy);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setHealthProfile({
      chronicConditions: conditions.split(',').map(s => s.trim()).filter(Boolean),
      medications: meds.split(',').map(s => s.trim()).filter(Boolean),
      sensitivities: sensitivities.split(',').map(s => s.trim()).filter(Boolean),
    });

    if (phq9Taken) {
      const { score } = scorePHQ9(phq9Answers);
      savePHQ9Result(score);
    }

    onClose?.();
  };

  return (
    <div className="hp-backdrop" role="dialog" aria-modal="true" aria-label="Health Profile">
      <form className="hp-card" onSubmit={onSubmit}>
        <h3>Health Profile</h3>

        <label>
          Chronic conditions (comma-separated)
          <input value={conditions} onChange={e => setConditions(e.target.value)} />
        </label>

        <label>
          Medications (comma-separated names)
          <input value={meds} onChange={e => setMeds(e.target.value)} />
        </label>

        <label>
          Sensitivities (comma-separated)
          <input value={sensitivities} onChange={e => setSensitivities(e.target.value)} />
        </label>

        <h4>PHQ-9 (optional)</h4>
        <p>Over the last 2 weeks, how often have you been bothered by the following problems?</p>
        {PHQ9_ITEMS.map((q, i) => (
          <label key={i}>
            {q}
            <select value={phq9Answers[i]} onChange={e => handlePHQChange(i, e.target.value)}>
              <option value={0}>Not at all (0)</option>
              <option value={1}>Several days (1)</option>
              <option value={2}>More than half the days (2)</option>
              <option value={3}>Nearly every day (3)</option>
            </select>
          </label>
        ))}
        <label className="hp-row">
          <input type="checkbox" checked={phq9Taken} onChange={e => setPhq9Taken(e.target.checked)} />
          Save this PHQ-9 result
        </label>

        <div className="hp-actions">
          <button type="button" className="hp-btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="hp-btn primary">Save</button>
        </div>
      </form>

      <style>{css}</style>
    </div>
  );
}

const css = `
/* Global note:
   - Modal scales with --ui-font-scale (default 1).
   - You can set this on :root or body, e.g.:
   :root { --ui-font-scale: 1.0 }  // normal
   :root { --ui-font-scale: 1.2 }  // larger
*/

.hp-backdrop{
  position:fixed;inset:0;display:grid;place-items:start; /* keep left/your current layout */
  padding:20px;
  background:rgba(0,0,0,.4);
  backdrop-filter:blur(3px);
  z-index:60;
  overflow-y:auto;
}

/* Scale the whole card relative to the user's font settings */
.hp-card{
  /* Wider but clamped for smaller screens */
  width: clamp(720px, 85vw, 1120px);  max-height: 95vh;  /* Dynamic font size based on UI scale setting */  font-size: calc(1rem * var(--ui-font-scale, 1) * 0.92);  line-height: 1.4;  background: rgba(22, 22, 26, .95);  border: 1px solid rgba(255, 255, 255, .08);  border-radius: 16px;  padding: 24px 28px 18px;  box-shadow: 0 10px 40px rgba(0, 0, 0, .5);  display: flex;  flex-direction: column;  gap: 14px;  overflow-y: auto;  overflow-x: hidden; /* prevent the horizontal scrollbar unless needed */}
}

/* Titles scale down a touch too */
.hp-card h3{ margin:4px 0; font-size: 1.15em; }
.hp-card h4{ margin:4px 0; font-size: 1.05em; }

/* Labels and inputs use em so they inherit the scale above */
.hp-card label{
  display:flex;flex-direction:column;gap:6px;
  font-size: 0.98em;
}

.hp-card select,
.hp-card input[type="text"],
.hp-card input[type="number"],
.hp-card input{
  font-size: calc(0.94rem * var(--ui-font-scale, 1));  min-height: 34px;  background: rgba(255, 255, 255, .06);  border: 1px solid rgba(255, 255, 255, .12);  border-radius: 10px;  color: inherit;  padding: 8px 10px;
}

.hp-row{flex-direction:row;align-items:center;gap:10px}

/* Buttons compact but readable, also scale-aware */
.hp-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
.hp-btn{
  border:none;border-radius:9999px;
  padding:8px 14px;
  font-weight:600;
  cursor:pointer;
  font-size: 0.95em;
}
.hp-btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.2)}
.hp-btn.primary{background:#6aa68f}

.qc-error{background:rgba(255,70,70,.12);border:1px solid rgba(255,70,70,.35);
  padding:8px 10px;border-radius:10px;font-size:0.95em}

.hp-btn[disabled]{opacity:.65;cursor:not-allowed}
`;
