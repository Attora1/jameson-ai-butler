import React from 'react';

export default function SpoonLeaf({ width = 30, height = 60, color = 'rgba(255,210,150,0.7)' }) {
  const circleRadius = width / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Circle base */}
      <circle
        cx={circleRadius}
        cy={circleRadius}
        r={circleRadius}
        fill={color}
      />
      {/* Triangle tip */}
      <path
        d={`
          M ${circleRadius - circleRadius * .6}, ${circleRadius}
          L ${circleRadius + circleRadius * .6}, ${circleRadius}
          L ${circleRadius}, ${height}
          Z
        `}
        fill={color}
      />
    </svg>
  );
}
