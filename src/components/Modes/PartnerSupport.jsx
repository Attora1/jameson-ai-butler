import React, { useState } from 'react';
import TetherCanvas from '../Modes/TetherCanvas.jsx';
import CoRegulationTimer from '../Modes/CoRegulationTimer.jsx';
import PartnerCheckInButton from './PartnerCheckInButton';
import '../../styles/modes-css/PartnerSupport.css';

// eslint-disable-next-line no-unused-vars
export default function PartnerSupport({ settings }) {
  const [showTether, setShowTether] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [suggestions] = useState([
    "Sit quietly with them.",
    "Ask if they want a hug.",
    "Ask if they need anything."
  ]);

  return (
    <div className="partner-support-grid-4">
      <div className="partner-card">
        <h1>Partner Support Mode</h1> <PartnerCheckInButton />
        <p className="subtitle">Your safe, shared space to co-regulate.</p>
      </div>

      <div className="partner-card">
        <h2>Quiet Co-Regulation Timer</h2>
        {showTimer ? (
          <CoRegulationTimer onComplete={() => setShowTimer(false)} />
        ) : (
          <button className="start-button" onClick={() => setShowTimer(true)}>
            Start Quiet Co-Regulation Timer
          </button>
        )}
      </div>

      <div className="partner-card">
        <h2>Gentle Ways to Show Up</h2>
        <ul>
          {suggestions.map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="partner-card">
        <h2>You don't have to carry it alone.</h2>
        <button className="tether-button" onClick={() => setShowTether(true)}>
          Begin Tether Activity
        </button>
      </div>

      {showTether && (
        <div className="tether-overlay">
          <TetherCanvas onComplete={() => setShowTether(false)} />
        </div>
      )}
    </div>
  );
}
