import React from 'react';

export default function ModeLayout({ heading, subtitle, leftColumn, rightColumn, className }) {
  return (
    <div className={`mode-layout ${className || ''}`}>

    <div className="mode-layout-container">
      <h2 className="mode-layout-heading">{heading || 'No heading'}</h2>
      <p className="mode-layout-subtitle">{subtitle || 'No subtitle'}</p>

      <div className="mode-layout-columns">
        <div className="left-column">{leftColumn || 'No left content'}</div>
        <div className="right-column">{rightColumn || 'No right content'}</div>
      </div>
    </div>
    </div>
  );
}
