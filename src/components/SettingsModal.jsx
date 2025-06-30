import React, { useState, useEffect } from 'react';
import {
  HONORIFICS,
  MOODS,
  FONT_SIZES,
  FONT_FAMILIES,
  VOICE_GENDERS,
  VOICE_ACCENTS,
  MEMORY_LIMITS,
  PRONOUN_SETS
} from '../constants.js';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Validate US zip code format
const isValidZipCode = (zip) => {
  if (!zip || typeof zip !== 'string') return false;
  const cleanZip = zip.trim();
  return /^\d{5}(-\d{4})?$/.test(cleanZip);
};

const SettingsModal = ({ settings, setSettings, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleZipChange = (e) => {
    const newZip = e.target.value;
    setLocalSettings(prev => ({ ...prev, zip: newZip }));
    
    // Validate zip code and show error if invalid
    if (newZip && !isValidZipCode(newZip)) {
      setZipError('Please enter a valid 5-digit US zip code');
    } else {
      setZipError('');
    }
  };

  const handleSave = () => {
    // Ensure we have a valid zip code before saving
    if (!localSettings.zip || !isValidZipCode(localSettings.zip)) {
      setLocalSettings(prev => ({ ...prev, zip: '48203' })); // Use default
    }
    setSettings(localSettings);
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <button
          className="close-settings"
          onClick={onClose}
          aria-label="Close settings modal"
          type="button"
        >
          ✖
        </button>
        <h2 id="settings-title">AELI Settings</h2>

        {/* --- Personal Info --- */}
        <label>
          Preferred Formal Name:
          <input
            type="text"
            value={localSettings.nameFormal}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, nameFormal: e.target.value }))
            }
            placeholder="e.g. Sam"
          />
        </label>

        <label>
          Preferred Casual Name:
          <input
            type="text"
            value={localSettings.nameCasual}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, nameCasual: e.target.value }))
            }
            placeholder="e.g. Alex"
          />
        </label>

        <label>
          Zip Code:
          <input
            type="text"
            value={localSettings.zip || ''}
            onChange={handleZipChange}
            placeholder="e.g. 90210"
            maxLength="10"
          />
          {zipError && <span style={{ color: 'red', fontSize: '0.8em' }}>{zipError}</span>}
        </label>

        <label>
          Honorific (Title):
          <select
            value={localSettings.title}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, title: e.target.value }))
            }
          >
            {HONORIFICS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Your Pronouns:
          <select
            value={localSettings.userPronouns?.subject || ''}
            onChange={(e) => {
              const selected = PRONOUN_SETS[e.target.value];
              if (selected) setLocalSettings(prev => ({ ...prev, userPronouns: selected }));
            }}
          >
            {Object.keys(PRONOUN_SETS).map(key => (
              <option key={key} value={key}>
                {capitalize(key)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Partner's Pronouns:
          <select
            value={localSettings.partnerPronouns?.subject || ''}
            onChange={(e) => {
              const selected = PRONOUN_SETS[e.target.value];
              if (selected) setLocalSettings(prev => ({ ...prev, partnerPronouns: selected }));
            }}
          >
            {Object.keys(PRONOUN_SETS).map(key => (
              <option key={key} value={key}>
                {capitalize(key)}
              </option>
            ))}
          </select>
        </label>

        {/* --- Behavior & Tone --- */}
        <label>
          Tone:
          <select
            value={localSettings.tone || localSettings.mode}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, tone: e.target.value }))
            }
          >
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
          </select>
        </label>

        <label>
          Mood:
          <select
            value={localSettings.mood}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, mood: e.target.value }))
            }
          >
            {MOODS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Mode:
          <select
            value={localSettings.mode}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, mode: e.target.value }))
            }
          >
            <option value="dashboard">Dashboard</option>
            <option value="low_spoon">Low Spoon</option>
            <option value="focus">Focus</option>
            <option value="partner_support">Partner Support</option>
          </select>
        </label>

        {/* --- Accessibility & Memory --- */}
        <label>
          Voice:
          <select
            value={localSettings.voiceGender}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, voiceGender: e.target.value }))
            }
          >
            {VOICE_GENDERS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Accent:
          <select
            value={localSettings.voiceAccent}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, voiceAccent: e.target.value }))
            }
          >
            {VOICE_ACCENTS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Memory Limit:
          <select
            value={localSettings.memoryLimit}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, memoryLimit: parseInt(e.target.value) }))
            }
          >
            {MEMORY_LIMITS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Font:
          <select
            value={localSettings.fontFamily}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, fontFamily: e.target.value }))
            }
          >
            {FONT_FAMILIES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Font Size:
          <select
            value={localSettings.fontSize}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, fontSize: e.target.value }))
            }
          >
            {FONT_SIZES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* Save Button */}
        <div className="settings-footer">
          <button className="save-settings" onClick={handleSave} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;