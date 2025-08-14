// src/components/CheckIn/QuickCheckIn.jsx
import React, { useState } from 'react';
import { estimateSpoons } from '../../utils/estimateSpoons';
import { useSpoons } from '../../context/SpoonContext.jsx';

export default function QuickCheckIn({ open, onClose }) {
  const { setSpoons, spoonMax } = useSpoons();
  const [form, setForm] = useState({
    hoursSleep: '',
    bedtime: '',
    mealsEaten: 0,
    tookMeds: true,
    pain0to10: 0,
    mood1to5: 3,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const onChange = (k) => (e) => {
    const v = e?.target?.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const payload = {
      hoursSleep: Number(form.hoursSleep),
      bedtime: form.bedtime,
      mealsEaten: Number(form.mealsEaten),
      tookMeds: Boolean(form.tookMeds),
      pain0to10: Number(form.pain0to10),
      mood1to5: Number(form.mood1to5),
    };

    const est = estimateSpoons(payload, spoonMax);

    // Optimistic UI
    setSpoons(est);

    try {
      // Persist to your Netlify function (same-origin, no CORS issues)
      const res = await fetch('/.netlify/functions/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spoons: est,
          mood: payload.mood1to5,           // optional: store mood if your function accepts it
          // you can add other fields later (e.g., lastMeal, lastMed) if your API supports them
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      onClose?.();
    } catch (err) {
      // Keep optimistic spoons but show a soft error
      setErrorMsg('Saved locally, but the server update failed. You can retry later.');
      console.error('Wellness save failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="qc-backdrop" role="dialog" aria-modal="true" aria-label="Quick check-in">
      <form className="qc-card" onSubmit={onSubmit}>
        <h3>Quick check‑in</h3>
        {errorMsg && <div className="qc-error">{errorMsg}</div>}

        <label>
          Hours of sleep (last night)
          <input type="number" min="0" max="14" step="0.5"
                 value={form.hoursSleep} onChange={onChange('hoursSleep')} />
        </label>

        <label>
          Bedtime (HH:MM 24h)
          <input type="text" placeholder="01:30"
                 value={form.bedtime} onChange={onChange('bedtime')} />
        </label>

        <label>
          Meals eaten so far
          <select value={form.mealsEaten} onChange={onChange('mealsEaten')}>
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3+</option>
          </select>
        </label>

        <label className="qc-row">
          <input type="checkbox" checked={!!form.tookMeds} onChange={onChange('tookMeds')} />
          Took meds/supplements today
        </label>

        <label>
          Current pain (0–10)
          <input type="range" min="0" max="10"
                 value={form.pain0to10} onChange={onChange('pain0to10')} />
          <div className="qc-range-value">{form.pain0to10}</div>
        </label>

        <label>
          Mood (1–5)
          <input type="range" min="1" max="5"
                 value={form.mood1to5} onChange={onChange('mood1to5')} />
          <div className="qc-range-value">{form.mood1to5}</div>
        </label>

        <div className="qc-actions">
          <button type="button" className="qc-btn ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="qc-btn primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Set spoons'}
          </button>
        </div>
      </form>
      <style>{`
.qc-backdrop{
  position:fixed;inset:0;display:grid;place-items:center;
  background:rgba(0,0,0,.4);backdrop-filter:blur(3px);z-index:60}
.qc-card{
  width:min(520px,92vw);background:rgba(22,22,26,.9);
  border:1px solid rgba(255,255,255,.08);border-radius:16px;
  padding:18px 18px 14px;box-shadow:0 10px 40px rgba(0,0,0,.5);
  display:flex;flex-direction:column;gap:10px}
.qc-card h3{margin:0 0 6px 0;font-size:18px}
.qc-card label{display:flex;flex-direction:column;gap:6px;font-size:14px}
.qc-card input[type="text"], .qc-card input[type="number"], .qc-card select{
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
  color:inherit;border-radius:10px;padding:8px 10px}
.qc-row{flex-direction:row;align-items:center;gap:10px}
.qc-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:4px}
.qc-btn{border:none;border-radius:9999px;padding:8px 14px;font-weight:600;cursor:pointer}
.qc-btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.2)}
.qc-btn.primary{background:#6aa68f}
.qc-range-value{font-size:12px;opacity:.75;margin-top:2px}
.qc-error{background:rgba(255,70,70,.12);border:1px solid rgba(255,70,70,.35);
  padding:8px 10px;border-radius:10px;font-size:13px}
.qc-btn[disabled]{opacity:.65;cursor:not-allowed}
`}</style>
    </div>
  );
}
