import React, { useContext, useEffect, useState } from 'react';
import { SpoonContext } from '../context/SpoonContext.jsx';

const MAX_SPOONS = 12;

const COLORS = [
  '#D35400', // burnt orange
  '#E74C3C', // coral red
  '#E91E63', // light magenta
  '#9B59B6', // lavender
  '#5D6D7E', // cool indigo
  '#5DADE2', // soft blue
];

function interpolateColor(index) {
  const baseIndex = Math.floor((index / MAX_SPOONS) * COLORS.length);
  return COLORS[baseIndex % COLORS.length];
}

export default function SpoonTrackerCircular() {
  const { spoonCount, setSpoonCount } = useContext(SpoonContext);
  const [lastCount, setLastCount] = useState(spoonCount);

  useEffect(() => {
    if (spoonCount !== lastCount) {
      let response;
      if (spoonCount === 12) {
        response = "Noting your reserves, Miss. Twelve spoons today—ambitious, but I admire the spirit.";
      } else if (spoonCount === 0) {
        response = "All spoons accounted for, Miss. Let’s take it very slow today.";
      } else {
        response = `Got it, Miss. You have ${spoonCount} spoon${spoonCount > 1 ? 's' : ''} to use today.`;
      }
      console.log('[AELI]', response);
      setLastCount(spoonCount);
    }
  }, [spoonCount, lastCount]);

  const radius = 80;
  const center = 100;
  const angleStep = (2 * Math.PI) / MAX_SPOONS;
  const petalLength = 30;

  const createPetalPath = (angle) => {
    const x1 = center + Math.cos(angle) * radius;
    const y1 = center + Math.sin(angle) * radius;
    const x2 = center + Math.cos(angle) * (radius + petalLength);
    const y2 = center + Math.sin(angle) * (radius + petalLength);
    return `
      M ${x1} ${y1}
      L ${x2} ${y2}
      Q ${center} ${center} ${x1} ${y1}
      Z
    `;
  };

  return (
    <svg
      width="190"
      height="190"
      role="list"
      aria-label="Spoon tracker"
      className="circular-spoon-tracker"
    >
      {[...Array(MAX_SPOONS)].map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const filled = i < spoonCount;
        const fillColor = filled ? interpolateColor(i) : '#eee';
        const petalPath = createPetalPath(angle);

        return (
          <path
            key={i}
            d={petalPath}
            fill={fillColor}
            stroke="#666"
            strokeWidth="1"
            tabIndex={0}
            role="button"
            aria-pressed={filled}
            aria-label={`Set spoon count to ${i + 1}`}
            style={{ outline: 'none', transition: 'fill 0.2s ease' }}
            onClick={() => setSpoonCount(i + 1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSpoonCount(i + 1);
              }
            }}
            onFocus={(e) => e.target.setAttribute('stroke-width', '2')}
            onBlur={(e) => e.target.setAttribute('stroke-width', '1')}
          />
        );
      })}
      <circle
        cx={center}
        cy={center}
        r={20}
        fill="#fff"
        stroke="#666"
        strokeWidth="1"
        role="button"
        tabIndex={0}
        aria-label="Check in with AELI"
        onClick={() => {
          console.log("[AELI] Check-in requested.");
          if (typeof window?.AELICheckIn === 'function') {
            window.AELICheckIn();
          }
        }}
        style={{ cursor: 'pointer' }}
      />
      <text
        x={center}
        y={center + 5}
        textAnchor="middle"
        fill="#666"
        fontSize="14"
        pointerEvents="none"
        style={{ userSelect: 'none', fontFamily: 'Arial, sans-serif' }}
      >
        ☕
      </text>
    </svg>
  );
}