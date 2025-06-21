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

const SettingsModal = ({ settings, setSettings, setShowSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    setSettings(localSettings);
    setShowSettings(false);
  };

  return (
    <div className="settings-overlay" onClick={() => setShowSettings(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-settings"
          onClick={() => setShowSettings(false)}
          aria-label="Close settings modal"
        >
          ✖
        </button>
        <h2>Jameson Settings</h2>

        {/* --- Personal Info --- */}
        <label>
          Preferred Formal Name:
          <input
            type="text"
            value={localSettings.nameFormal}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, nameFormal: e.target.value }))
            }
            placeholder="e.g. Nessa"
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
            placeholder="e.g. Ness"
          />
        </label>

        <label>
          Zip Code:
          <input
            type="text"
            value={localSettings.zip || ''}
            onChange={(e) =>
              setLocalSettings(prev => ({ ...prev, zip: e.target.value }))
            }
            placeholder="e.g. 90210"
          />
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
              setLocalSettings(prev => ({ ...prev, mode: e.target.value }))
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
          <button className="save-settings" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
