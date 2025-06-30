import React, { useEffect, useState } from 'react';
import '../../styles/modes-css/PreferencesModal.css';

function PreferencesModal({ isOpen, onClose, settings }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 300); // match CSS fade duration
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  return (
    <div className={`preferences-modal-overlay ${isOpen ? 'fade-in' : 'fade-out'}`} onClick={onClose}>
      <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
        <h2>What AELI Remembers</h2>
        <ul>
          <li><strong>Name:</strong> {settings?.nameCasual || 'Not set'}</li>
          <li><strong>Pronouns:</strong> {settings?.pronouns || 'Not set'}</li>
          <li><strong>Preferences:</strong> Used to tailor reminders, encouragement, and interactions.</li>
          <li><strong>Energy Tracking:</strong> Spoon counts you set to track your daily energy gently.</li>
          <li><strong>Privacy:</strong> All data is stored locally on your device and never sent elsewhere.</li>
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default PreferencesModal;
