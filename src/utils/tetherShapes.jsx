// tetherShapes.jsx
import React from 'react';

export function HeartShape() {
  return (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="#D9A79E" opacity="0.8">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
        2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
        C13.09 3.81 14.76 3 16.5 3
        19.58 3 22 5.42 22 8.5
        c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function SpiralShape() {
  return (
    <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="#D9A79E" strokeWidth="3" opacity="0.8">
      <path
        d="
          M50,50
          m-35,0
          a35,35 0 1,0 70,0
          a35,35 0 1,0 -70,0
          m10,0
          a25,25 0 1,0 50,0
          a25,25 0 1,0 -50,0
          m10,0
          a15,15 0 1,0 30,0
          a15,15 0 1,0 -30,0
          m10,0
          a5,5 0 1,0 10,0
          a5,5 0 1,0 -10,0
        "
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function FlowerShape() {
  return (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="#D9A79E" opacity="0.8">
      <path d="M12 2c1.38 0 2.5 1.12 2.5 2.5S13.38 7 12 7s-2.5-1.12-2.5-2.5S10.62 2 12 2zm0 15c1.38 0 2.5 1.12 2.5 2.5S13.38 22 12 22s-2.5-1.12-2.5-2.5S10.62 17 12 17zm10-5c0 1.38-1.12 2.5-2.5 2.5S17 13.38 17 12s1.12-2.5 2.5-2.5S22 10.62 22 12zM7 12c0 1.38-1.12 2.5-2.5 2.5S2 13.38 2 12s1.12-2.5 2.5-2.5S7 10.62 7 12zm3.5-6.5l7 7m0-7l-7 7" />
    </svg>
  );
}
