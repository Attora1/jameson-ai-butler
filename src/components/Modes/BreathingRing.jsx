import React, { useContext } from 'react';
import '../../styles/modes-css/LowSpoon.css'; // keep your existing css
import petalImage from '../../assets/petal-flower.png'; // keep if used by your effect
import { SPOON_MAX } from '../../constants/spoons';
import { useSpoons } from '../../context/SpoonContext.jsx';

// Props: { running } as in your original
export default function BreathingRing({ running }) {
  const { spoons, spoonMax, isUnset } = useSpoons();
  const max = typeof spoonMax === 'number' ? spoonMax : SPOON_MAX;

  if (isUnset) {
    // No breathing flow yet—invite the user to check in first.
    return (
      <div className="breathing-ring shell" aria-label="Energy check needed">
        <div className="breathing-ring-inner placeholder">
          <div className="placeholder-copy">
            <div className="eyebrow">Energy check</div>
            <div className="headline">Let’s check in</div>
            <div className="subtle">
              We’ll start the breathing after we know your spoons.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If spoons are set: maintain your existing animation behavior.
  // We only ensure the “running” state is false when unset (already handled above).
  const current = Math.min(Math.max(Number(spoons ?? 0), 0), max);
  const active = Boolean(running);

  return (
    <div
      className={`breathing-ring ${active ? 'is-running' : 'is-paused'}`}
      role="img"
      aria-label={`Breathing ring — spoons ${current} of ${max}`}
    >
      {/* KEEP your existing ring / petals / timing UI here. Below is a minimal stub. */}
      <div className="breathing-ring-inner">
        <div className="breathing-core" />
        {/* Example static petal (you likely have many & animated via CSS/JS) */}
        <img
          src={petalImage}
          alt=""
          className={`petal ${active ? 'petal-anim' : ''}`}
          draggable="false"
        />
      </div>
    </div>
  );
}