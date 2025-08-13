import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/modes-css/PartnerSupport.css';

const PULSE_INTERVAL = 90 * 60 * 1000; // 90 minutes in milliseconds
const LAST_PULSE_KEY = 'lastPartnerPulseTime';

export default function PartnerCheckInButton() {
  const [showModal, setShowModal] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const startPulse = useCallback(() => {
    setIsPulsing(true);
    localStorage.setItem(LAST_PULSE_KEY, Date.now());
    if (window.AELI && window.AELI.speak) {
      window.AELI.speak("It's been a while. Check in on your partner?");
    }
    if (window.playSoftPing) {
      window.playSoftPing();
    }
    // Stop pulsing after 10 seconds
    pulseTimeoutRef.current = setTimeout(() => {
      setIsPulsing(false);
    }, 10000); // Pulse for 10 seconds
  }, []);

  const scheduleNextPulse = useCallback(() => {
    const lastPulseTime = parseInt(localStorage.getItem(LAST_PULSE_KEY) || '0', 10);
    const timeElapsed = Date.now() - lastPulseTime;
    const timeToNextPulse = PULSE_INTERVAL - timeElapsed;

    if (timeToNextPulse <= 0) {
      startPulse();
      intervalRef.current = setInterval(startPulse, PULSE_INTERVAL);
    } else {
      intervalRef.current = setTimeout(() => {
        startPulse();
        intervalRef.current = setInterval(startPulse, PULSE_INTERVAL);
      }, timeToNextPulse);
    }
  }, [startPulse]);

  useEffect(() => {
    scheduleNextPulse();
    return () => {
      clearTimeout(pulseTimeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, [scheduleNextPulse]);

  const openModal = () => {
    setShowModal(true);
    setIsPulsing(false); // Stop pulsing if modal is opened
    clearTimeout(pulseTimeoutRef.current);
    clearInterval(intervalRef.current); // Stop the main interval
  };

  // eslint-disable-next-line no-unused-vars
  const closeModal = () => {
    setShowModal(false);
    scheduleNextPulse(); // Resume the timer based on existing state
  };

  const handleCheckIn = () => {
    setShowModal(false);
    localStorage.setItem(LAST_PULSE_KEY, Date.now()); // Reset timer to now
    clearInterval(intervalRef.current);
    scheduleNextPulse(); // Schedule next pulse 90 minutes from now
  };

  const handleLater = () => {
    setShowModal(false);
    localStorage.setItem(LAST_PULSE_KEY, Date.now() - (PULSE_INTERVAL - 10 * 60 * 1000)); // Set timer to 10 mins from now
    clearInterval(intervalRef.current);
    scheduleNextPulse(); // Schedule next pulse 10 minutes from now
  };

  return (
    <>
      <button
        onClick={openModal}
        className={`check-partner-button ${isPulsing ? 'pulse' : ''}`}
      >
        Check on Partner 💛
      </button>

      {showModal && (
        <div className="partner-checkin-overlay">
          <div className="partner-checkin-modal fade-slide">
            <h3>✨ Gentle ways to show up ✨</h3>
            <ul>
              <li>• Any forgotten tasks from your partner?</li>
              <li>• Offer water or a snack.</li>
              <li>• Mood check-in: what are you both feeling?</li>
            </ul>
            <div className="partner-checkin-buttons">
            <button onClick={handleCheckIn}>I'll check in</button>
            <button onClick={handleLater}>Later</button>
            <button
                onClick={() =>
                window.open('https://unhconnect.unh.edu/s/1518/images/gid4/editor_documents/moodmeter-2020.pdf?gid=4&pgid=61&sessionid=5850552a-a50f-492f-889c-ff269beaa9b8&cc=1', '_blank')
                }
            >
                Open Mood Meter
            </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
