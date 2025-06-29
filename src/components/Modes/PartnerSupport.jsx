import React, { useState } from 'react';
import TetherCanvas from '../Modes/TetherCanvas.jsx';
import CoRegulationTimer from '../Modes/CoRegulationTimer.jsx';
import PartnerCheckInButton from './PartnerCheckInButton';
import '../../styles/modes-css/PartnerSupport.css';

export default function PartnerSupport({ settings }) {
  const [showTether, setShowTether] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  return (
    <div className="partner-support-grid-4">
      <div className="partner-card">
        <h1>Partner Support Mode</h1>   <PartnerCheckInButton />
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
          <li>• Sit quietly with them.</li>
          <li>• Ask if they want a hug.</li>
          <li>• Ask if they need anything.</li>
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


