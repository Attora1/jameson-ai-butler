import React, { useState, useEffect } from 'react';
import PreferencesModal from './PreferencesModal'; 
import ModeLayout from './ModeLayout';
import generateResponse from '../../logic/generateResponse.js';
import { getGreeting, getEncouragement } from '../../prompts/AELIEngine';
import '../../styles/modes-css/LandingDashboard.css';

function LandingDashboard({ settings, setSettings, setShowSettings }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [encouragement, setEncouragement] = useState('');

  useEffect(() => {
    async function testGemini() {
      const { replyText } = await generateResponse("Give me a gentle spoon suggestion", "low_spoon", settings);
      console.log(replyText);
    }
    testGemini();
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
            <button onClick={() => setShowSettings(true)}>Start Check-In</button>              <button onClick={() => setSettings(prev => ({ ...prev, mode: 'low_spoon' }))}>Check Energy</button>
              <button onClick={() => setSettings(prev => ({ ...prev, mode: 'focus' }))}>Open Focus Mode</button>
              <button onClick={() => setSettings(prev => ({ ...prev, mode: 'partner_support' }))}>Open Partner Mode</button>
              <button onClick={() => setShowPreferences(true)}>What AELI Remembers</button>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
  <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
    <img
      src="https://bolt.new/badge/bolt-badge.svg"
      alt="Made with Bolt"
      style={{ width: '120px', opacity: 0.85 }}
    />
  </a>
</div>

        </>

        
      }
    />
  );
}

export default LandingDashboard;
