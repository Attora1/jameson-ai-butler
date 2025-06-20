import React from 'react';

const SettingsModal = ({ settings, setSettings, setShowSettings }) => {
  return (
    <div className="settings-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-settings" onClick={() => setShowSettings(false)}>✖</button>
        <h2>Jameson Settings</h2>

        {/* Mode (was style) */}
        <label>
          Style:
          <select 
            value={settings.style}
            onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))}
          >
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
          </select>
        </label>

        {/* Zip */}
        <label>
          Zip Code:
          <input 
            type="text" 
            value={settings.zip}
            onChange={(e) => setSettings(prev => ({ ...prev, zip: e.target.value }))}
          />
        </label>
      </div>
    </div>
  );
};

export default SettingsModal;
