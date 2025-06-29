import React, { useState, useEffect, useRef } from 'react';
import '../../styles/modes-css/CoRegulationTimer.css';

export default function CoRegulationTimer({ onComplete }) {
  const [duration, setDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [calmAnimation, setCalmAnimation] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      audioRef.current = new Audio('/sounds/level-passed.mp3');
      audioRef.current.play().catch(() => {});
      setShowComplete(true);
      setTimeout(() => {
        setShowComplete(false);
        setIsRunning(false);
        onComplete?.();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    setTimeLeft(duration * 60);
    setIsRunning(true);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="coregulation-timer-wrapper">
      {!isRunning && !showComplete && (
        <div className="coregulation-timer-setup">
          <h3>Quiet Co-Regulation Timer</h3>
          <p>Select a duration to sit quietly together.</p>
          <div className="duration-buttons">
            <button onClick={() => setDuration(5)} className={duration === 5 ? 'active' : ''}>5 Minutes</button>
            <button onClick={() => setDuration(10)} className={duration === 10 ? 'active' : ''}>10 Minutes</button>
          </div>
          <label style={{ marginTop: '1rem' }}>
            <input type="checkbox" checked={calmAnimation} onChange={() => setCalmAnimation(!calmAnimation)} /> Enable Calm Animation
          </label>
          <button className="start-button" onClick={handleStart}>Start</button>
        </div>
      )}

      {isRunning && (
        <div className={`coregulation-timer-display ${calmAnimation ? 'calm-animation' : ''}`}>
          <p>{minutes}:{seconds.toString().padStart(2, '0')}</p>
          <p>Sit quietly and breathe.</p>
        </div>
      )}

      {showComplete && (
        <div className="coregulation-timer-complete">
          <p>Session complete. Take a breath.</p>
        </div>
      )}
    </div>
  );
}
