import React, { useState, useEffect } from 'react';
import PreferencesModal from './PreferencesModal'; 
import ModeLayout from './ModeLayout';
import { getGreeting, getEncouragement } from '../../prompts/AELIEngine';
import '../../styles/modes-css/LandingDashboard.css';

function LandingDashboard({ settings, setSettings, setShowSettings }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [encouragement, setEncouragement] = useState('');
  const [hasSeenIntro, setHasSeenIntro] = useState(() => {
    return localStorage.getItem("AELI_INTRO_SHOWN") === "true";
  });
  
  useEffect(() => {
    if (!hasSeenIntro) {
      const welcomeMessage = "Hello there. You seem new. Would you mind opening the settings so I can calibrate things a bit? Don’t forget to save.";
      alert(welcomeMessage); // You can replace this with a nicer modal if you want
  
      setTimeout(() => {
        setShowSettings(true);
        const icon = document.getElementById("settings-icon");
        if (icon) {
          icon.style.border = "3px solid red";
          icon.style.transition = "border 0.5s ease";
        }
      }, 1000);
    }
  }, []);
  
  useEffect(() => {
    document.body.classList.remove('focus-theme', 'low_spoon-theme', 'partner_support-theme', 'crisis-theme');
    document.body.classList.add('dashboard-theme');
  }, []);

  useEffect(() => {
    setGreeting(getGreeting(settings));
    setEncouragement(getEncouragement());
  }, [settings]);

  return (
    <ModeLayout
      className="dashboard-theme"
      heading="Dashboard"
      subtitle="Your calm, organized launchpad."
      leftColumn={
        <>
          <div className="boxed-section">
            <h3>{greeting}</h3>
            <p>{encouragement}</p>
          </div>

          <div className="boxed-section">
            <h3>About AELI</h3>
            <p>Your Adaptive Executive-Life Interface for personalized daily support.</p>
          </div>

          {showPreferences && (
            <PreferencesModal
              isOpen={showPreferences}
              onClose={() => setShowPreferences(false)}
              settings={settings}
              fadeFromTop
            />
          )}
        </>
      }
      rightColumn={
        <>
          <div className="boxed-section">
            <h3>Actions</h3>
            <div className="action-buttons-grid">
              <button onClick={() => setShowSettings(true)}>Start Check-In</button>
              <button onClick={() => setSettings(prev => ({ ...prev, mode: 'low_spoon' }))}>Check Energy</button>
              <button onClick={() => setSettings(prev => ({ ...prev, mode: 'focus' }))}>Open Focus Mode</button>
              <button onClick={() => setSettings(prev => ({ ...prev, mode: 'partner_support' }))}>Open Partner Mode</button>
              <button onClick={() => setShowPreferences(true)}>What AELI Remembers</button>
            </div>
          </div>


        </>
      }
    />
  );
}

export default LandingDashboard;