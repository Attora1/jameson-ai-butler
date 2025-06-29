import React, { useState, useEffect } from 'react';
import '../../styles/modes-css/PartnerSupport.css';

export default function PartnerCheckInButton() {
  const [showModal, setShowModal] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [timerId, setTimerId] = useState(null);

  useEffect(() => {
    startAutoPing();
    return () => clearTimeout(timerId);
  }, []);

  const startAutoPing = () => {
    const id = setTimeout(() => {
      setPulse(true);
      if (window.AELI && window.AELI.speak) {
        window.AELI.speak("It's been a while. Check in on your partner?");
      }
      if (window.playSoftPing) {
        window.playSoftPing();
      }
    }, 90 * 60 * 1000); // 90 min
    setTimerId(id);
  };

  const openModal = () => {
    setShowModal(true);
    setPulse(false);
    clearTimeout(timerId);
    startAutoPing();
  };

  const closeModal = () => setShowModal(false);

  return (
    <>
      <button
        onClick={openModal}
        className={`check-partner-button ${pulse ? 'pulse' : ''}`}
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
            <button onClick={closeModal}>I'll check in</button>
            <button onClick={closeModal}>Later</button>
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
