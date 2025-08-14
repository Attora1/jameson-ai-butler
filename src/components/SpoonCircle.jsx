import React from 'react';
import { SPOON_MAX } from '../constants/spoons'; // adjust relative path if needed
import { useSpoons } from '../context/SpoonContext.jsx';

export default function SpoonCircle({
  size = 180,
  stroke = 12,
  className = '',
}) {
  const { spoons, spoonMax, isUnset } = useSpoons();
  const max = typeof spoonMax === 'number' ? spoonMax : SPOON_MAX;

  if (isUnset) {
    // Gentle placeholder when we don’t yet know user energy
    return (
      <div
        className={`rounded-full flex items-center justify-center ${className}`}
        style={{
          width: size,
          height: size,
          border: '1px dashed rgba(255,255,255,0.35)',
          background:
            'radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 60%, transparent 100%)',
          backdropFilter: 'blur(2px)',
        }}
        aria-label="Energy check needed"
      >
        <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Energy check</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Let’s check in</div>
        </div>
      </div>
    );
  }

  // Fallbacks to 0 if spoons somehow null; still respects max from context/constants
  const current = Math.min(Math.max(Number(spoons ?? 0), 0), max);

  // Simple progress ring (keep your original visuals if you had them)
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (current / max) * circumference;
  const dasharray = `${progress} ${circumference - progress}`;

  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Spoons: ${current} of ${max}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        style={{
          transform: `rotate(-90deg)`,
          transformOrigin: '50% 50%',
          strokeDasharray: dasharray,
          transition: 'stroke-dasharray 300ms ease',
        }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        style={{ fontSize: 16, fontWeight: 600 }}
      >
        {current}/{max}
      </text>
    </svg>
  );
}