import React, { useState, useRef } from 'react';
import { useCountdown } from '../../hooks/useTimer.js';
import '../../styles/modes-css/CoRegulationTimer.css';

export default function CoRegulationTimer({ onComplete }) {
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const handleTimerComplete = () => {
    audioRef.current = new Audio('/sounds/level-passed.mp3');
    audioRef.current.play().catch(error => {
      console.error('Error playing sound:', error);
    });
    setTimeout(() => {
      onComplete?.();
    }, 3000);
  };

  const { secondsLeft, isRunning, startCountdown, stopCountdown } = useCountdown({
    onComplete: handleTimerComplete,
  });

  const handleSelectDuration = (minutes) => {
    setDuration(minutes * 60);
    startCountdown(minutes);
  };

  const handleEndSession = () => {
    stopCountdown();
    onComplete?.();
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = duration ? (duration - secondsLeft) / duration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="coregulation-timer-wrapper fade-in">
      {!isRunning && duration === 0 ? (
        <div className="coregulation-timer-setup">
          <h3>Quiet Co-Regulation Timer</h3>
          <p>How long would you like to sit together?</p>
          <div className="duration-buttons">
            <button onClick={() => handleSelectDuration(5)}>5 Minutes</button>
            <button onClick={() => handleSelectDuration(10)}>10 Minutes</button>
          </div>
        </div>
      ) : (
        <div className="coregulation-ring-wrapper">
          <svg className="coregulation-ring" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D9A79E" />
                <stop offset="100%" stopColor="#cbb4d4" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#ccc"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <p className="coregulation-subtext">Sit quietly and breathe together.</p>
          <button className="end-session-button" onClick={handleEndSession}>End Session</button>
        </div>
      )}
    </div>
  );
}
