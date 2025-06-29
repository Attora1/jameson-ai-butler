import React, { useState, useEffect, useRef } from 'react';
import '../../styles/modes-css/CoRegulationTimer.css';

export default function CoRegulationTimer({ onComplete }) {
  const [duration, setDuration] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (duration) {
      setTimeLeft(duration);
      setIsRunning(true);
    }
  }, [duration]);

  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isRunning && timeLeft === 0 && duration) {
      audioRef.current = new Audio('/sounds/level-passed.mp3');
      audioRef.current.play().catch(() => {});
      setTimeout(() => {
        setIsRunning(false);
        onComplete?.();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isRunning, timeLeft, duration]);

  const handleSelectDuration = (seconds) => {
    setDuration(seconds);
  };

  const handleEndSession = () => {
    setIsRunning(false);
    onComplete?.();
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = duration ? (duration - timeLeft) / duration : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="coregulation-timer-wrapper fade-in">
      {!isRunning ? (
        <div className="coregulation-timer-setup">
          <h3>Quiet Co-Regulation Timer</h3>
          <p>How long would you like to sit together?</p>
          <div className="duration-buttons">
            <button onClick={() => handleSelectDuration(300)}>5 Minutes</button>
            <button onClick={() => handleSelectDuration(600)}>10 Minutes</button>
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
