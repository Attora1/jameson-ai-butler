import React, { useState, useEffect, useContext } from 'react';
import PreferencesModal from './PreferencesModal'; 
import ModeLayout from './ModeLayout';
import { SpoonContext } from '../../context/SpoonContext.jsx';
import '../../styles/modes-css/LandingDashboard.css';

function LandingDashboard({ settings, setSettings, setShowSettings }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const { spoonCount } = useContext(SpoonContext);
  const isNewUser = !settings?.nameCasual && !settings?.nameFormal;


  useEffect(() => {
    document.body.classList.remove('focus-theme', 'low_spoon-theme', 'partner_support-theme', 'crisis-theme');
    document.body.classList.add('dashboard-theme');
  }, []);

  const currentHour = new Date().getHours();
  let greetingLine = "Welcome back. Shall we begin?";

  if (!isNewUser) {
    if (currentHour >= 5 && currentHour < 12) {
      greetingLine = `Good morning, ${settings.nameFormal || 'User'}. Rather bright, isn't it?`;
    } else if (currentHour >= 12 && currentHour < 18) {
      greetingLine = `Good afternoon, ${settings.nameFormal || 'User'}. The sun's doing its best, I suppose.`;
    } else {
      greetingLine = `Good night, ${settings.nameFormal || 'User'}. Sweet dreams, or something vaguely resembling them.`;
    }
  } else {
    greetingLine = "Welcome to AELI. Let's get you set up. Anything I should know about you, User? I’m rather efficient, but a bit of context always helps.";
  }

  return (
    <ModeLayout
      className="dashboard-theme"
      heading="Dashboard"
      subtitle="A calm place to begin, check in, and adjust."
      leftColumn={
        <>
          <div className="boxed-section">
            <h3 style={{ fontSize: '1.2rem' }}>{greetingLine}</h3>
            <p>{isNewUser ? "A bit of a check-in, to start?" : "A bit of a check-in, perhaps?"}</p>
            <p className="daily-encouragement">“Small steps, taken steadily, often lead further than one might expect.”</p>
          </div>

          <div className="boxed-section">
            <h3>About AELI</h3>
            <p>Your Adaptive Executive-Life Interface, designed to support your daily flow with gentle, personalized guidance.</p>
          </div>

          {showPreferences && (
            <PreferencesModal
              isOpen={showPreferences}
              onClose={() => setShowPreferences(false)}
              settings={settings}
              fadeFromTop
              explanation={`AELI collects your preferred names, pronouns, spoon counts for energy tracking, and task patterns to personalize support. All data is stored locally for your privacy.`}
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
              <button onClick={() => setSettings(prev => ({ ...prev, mode: 'partner_support' }))}>Open Partner Support</button>
              <button onClick={() => setShowPreferences(true)}>What AELI Remembers</button>
            </div>
          </div>

          {spoonCount !== undefined && spoonCount !== null && spoonCount !== 0 && (
            <div className="spoon-badge"> 🥄 {spoonCount} </div>
          )}
        </>
      }
    />
  );
}

export default LandingDashboard;
