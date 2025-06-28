import React from 'react';
import '../../styles/modes-css/LowSpoon.css';

export default function DimOverlay({ visible }) {
  return (
    <div className={`dim-overlay ${visible ? 'show' : 'hide'}`} />
  );
}
