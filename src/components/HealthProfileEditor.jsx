import React, { useState } from 'react';
import { getHealthProfile, setHealthProfile, upsertCondition } from '../utils/healthProfile';
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
.hp-backdrop{
  position:fixed;inset:0;display:grid;place-items:center;
  background:rgba(0,0,0,.4);backdrop-filter:blur(3px);z-index:60}
.hp-card{
  width:min(560px,92vw);background:rgba(22,22,26,.92);
  border:1px solid rgba(255,255,255,.08);border-radius:16px;
  padding:18px 18px 14px;box-shadow:0 10px 40px rgba(0,0,0,.5);
  display:flex;flex-direction:column;gap:10px;max-height:90vh;overflow:auto}
.hp-card h3, .hp-card h4{margin:4px 0}
.hp-card label{display:flex;flex-direction:column;gap:6px;font-size:14px}
.hp-row{flex-direction:row;align-items:center;gap:10px}
.hp-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
.hp-btn{border:none;border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer}
.hp-btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.2)}
.hp-btn.primary{background:#6aa68f}
.hp-card select, .hp-card input[type="text"], .hp-card input[type="number"], .hp-card input{
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
  color:inherit;border-radius:10px;padding:8px 10px}
`;
