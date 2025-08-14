import React, { useState, useEffect, useRef } from 'react';
import BreathingRing from './BreathingRing.jsx';
import ModeLayout from '../Modes/ModeLayout.jsx';
import DimOverlay from './DimOverlay.jsx';
import { getReturnFromZen, getModeSubtitle } from '../../utils/AELIRemarks.js';
import { useDebounce } from '../../utils/useDebounce.js';
import QuickCheckIn from '../CheckIn/QuickCheckIn.jsx';
import '../../styles/modes-css/LowSpoon.css';
import { useSpoons } from '../../context/SpoonContext.jsx';

export default function LowSpoon({ settings }) {
  const { spoons, isUnset } = useSpoons();
  const [isBreathing, setIsBreathing] = useState(false);
  const [dimVisible, setDimVisible] = useState(false);
  const [AELIMessage, setAELIMessage] = useState('');
  const [timer, setTimer] = useState('1:00');
  const [timedSession, setTimedSession] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const petalLayerRef = useRef(null);
  const [currentSuggestion, setCurrentSuggestion] = useState('Take a gentle moment to breathe and rest.');
  const [checkInOpen, setCheckInOpen] = useState(false);

  const debouncedSpoons = useDebounce(spoons, 1500);

  useEffect(() => {
    // The dynamic suggestion functionality has been removed.
    // The suggestion is now a static message.
  }, [debouncedSpoons]);

  const handleStart = () => {
    setShowIntro(true);
    setDimVisible(true);
    setTimedSession(false);
    setTimeout(() => {
      setShowIntro(false);
      setIsBreathing(true);
    }, 5000);
  };

  const handleStartWithTimer = () => {
    setShowIntro(true);
    setDimVisible(true);
    setTimedSession(true);
    setTimeout(() => {
      setShowIntro(false);
      setIsBreathing(true);
    }, 4000);
  };

  useEffect(() => {
    if (!isBreathing || !timedSession) {
      setTimer('1:00');
      return;
    }
    let seconds = 60;
    const countdown = setInterval(() => {
      seconds -= 1;
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      setTimer(`${min}:${sec < 10 ? '0' : ''}${sec}`);
      if (seconds <= 0) {
        clearInterval(countdown);
        handleStop();
      }
    }, 1000);
    return () => clearInterval(countdown);
  }, [isBreathing, timedSession]);

  const handleStop = () => {
    setDimVisible(false);
    setTimeout(() => {
      setIsBreathing(false);
      setTimeout(() => {
        setAELIMessage(getReturnFromZen());
      }, 1000);
    }, 2000);
  };

  useEffect(() => {
    if (!isBreathing) return;
    const dropLoop = setInterval(() => {
      const el = document.createElement('div');
      const duration = 15000 + Math.floor(Math.random() * 4000);
      const delayOffset = Math.floor(Math.random() * 1000);
      const rotateAmt = 360 + Math.floor(Math.random() * 720);
      const drift = (Math.random() * 2 - 1).toFixed(2);
      el.className = 'falling-spoon fall';
      el.style.setProperty('--drift-x', drift);
      el.style.setProperty('--rotateX', `${Math.floor(Math.random() * 360)}deg`);
      el.style.setProperty('--rotateY', `${Math.floor(Math.random() * 360)}deg`);
      el.style.setProperty('--end-rotate', `${rotateAmt}deg`);
      el.style.position = 'fixed';
      el.style.top = '0';
      el.style.left = `${Math.random() * 100}%`;
      el.style.width = '16px';
      el.style.height = '36px';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
      el.style.willChange = 'transform, opacity';
      el.style.animation = `fallDown ${duration}ms ease-in-out ${delayOffset}ms forwards`;
      el.style.zIndex = '2';
      const colors = [
        'rgba(255, 210, 150, 0.8)',
        'rgba(255, 180, 200, 0.6)',
        'rgba(190, 150, 255, 0.5)',
        'rgba(140, 200, 255, 0.4)',
        'rgba(255, 255, 255, 0.3)'
      ];
      const fill = colors[Math.floor(Math.random() * colors.length)];
      el.innerHTML = `<svg width="16" height="36" viewBox="0 0 24 48" xmlns="http://www.w3.org/2000/svg"><path d="M12 0 C3 8, 6 20, 12 48 C18 20, 21 8, 12 0 Z" fill="${fill}" /></svg>`;
      petalLayerRef.current?.appendChild(el);
      setTimeout(() => el.remove(), duration + delayOffset + 1000);
    }, 600 + Math.floor(Math.random() * 400));
    return () => clearInterval(dropLoop);
  }, [isBreathing]);

  return (
    <>
      <div className="low-spoon-bg" />
      <DimOverlay visible={dimVisible} />
      <div ref={petalLayerRef} className="petal-layer" />
      {showIntro && (
        <div className="breathing-intro-modal show">Let the world go quiet. Inhale in 3...</div>
      )}
      <ModeLayout
        className="low-spoon-theme"
        heading="Low Spoon Mode"
        subtitle={getModeSubtitle('lowSpoon', settings)}
        leftColumn={
          <div className="spoon-circle-wrapper">
            <BreathingRing running={isBreathing} />
            <div className="breathing-controls">
              {!isBreathing ? (
                <button className="start-breathing-button fade-in-button" onClick={handleStart}>Begin Breathing</button>
              ) : (
                <button className="stop-breathing-button" onClick={handleStop}>End Breathing</button>
              )}
              <div className="breathing-timer" onClick={handleStartWithTimer} title="Start 1-minute breathing session" style={{ cursor: 'pointer' }}>{timer}</div>
            </div>
          </div>
        }
        rightColumn={
          <>
            <section className="suggestions" aria-labelledby="suggestions-heading">
              <h3 id="suggestions-heading">Gentle Suggestions</h3>
              <p className="suggestion-text">{currentSuggestion}</p>
              <button className="refresh-suggestion-button" onClick={() => setCurrentSuggestion('Fetching new suggestion...')} title="Show another suggestion" aria-label="Refresh suggestion">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="refresh-icon" > <polyline points="23 4 23 10 17 10"></polyline> <polyline points="1 20 1 14 7 14"></polyline> <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0020.49 15"></path> </svg>
              </button>
            </section>
            {AELIMessage && (
              <div className="low-spoon-AELI-message fade-in-AELI"><p>{AELIMessage}</p></div>
            )}
          </>
        }
      />
      <div className="grounding-link">
        <a href="https://www.crisistextline.org/" target="_blank" rel="noopener noreferrer">Grounding help</a>
      </div>
      <QuickCheckIn open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </>
  );
}
