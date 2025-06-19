import { useState, useEffect } from 'react';
import MessageList from './components/MessageList.jsx';
import ChatInput from './components/ChatInput.jsx';
import { generateResponse } from './logic/AIResponseHandler.js';
import { getWeather } from './utils/getWeather.js'; 
import './App.css';
import {
  INACTIVITY_TIMEOUT_MS,
  INACTIVITY_CHECK_INTERVAL_MS,
  TEA_COOLDOWN_MS,
  MOOD_TRIGGER_SHORT_MESSAGE_COUNT,
  MOOD_TRIGGER_DELAY_MS,
  SHORT_MESSAGE_LENGTH_THRESHOLD,
  STORAGE_KEY,
  PLACATION_PHRASES
} from './constants.js';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isResponding, setIsResponding] = useState(false);
  const [hasPlacated, setHasPlacated] = useState(false);
  const [teaCooldown, setTeaCooldown] = useState(false);
  const [skipNextResponse, setSkipNextResponse] = useState(false);
  const [moodMetrics, setMoodMetrics] = useState({
    shortMessageCount: 0,
    lastFrustrationCheck: Date.now(),
  });
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [inactivityNudged, setInactivityNudged] = useState(false);
  const [welcomedBack, setWelcomedBack] = useState(false);
  const [temperature, setTemperature] = useState(null);

  // *** NEW SETTINGS STATE ***
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("JAMESON_SETTINGS");
    return saved ? JSON.parse(saved) : { mode: "formal", zip: "48203" };
  });

  // Persist settings whenever they change
  useEffect(() => {
    localStorage.setItem("JAMESON_SETTINGS", JSON.stringify(settings));
  }, [settings]);

  // ...existing useEffect for weather, inactivity, etc...

  useEffect(() => {
    async function fetchInitialWeather() {
      const weather = await getWeather(settings.zip);
      if (weather) setTemperature(weather.temperature);
    }
  
    fetchInitialWeather();
  }, [settings.zip]);

  // ...existing other effects and handlers...

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isResponding) return;

    setMessages(prev => [...prev, { text: input, isUser: true }]);
    setInput('');

    if (skipNextResponse) {
      setSkipNextResponse(false);
      return;
    }

    setIsResponding(true);
    try {
      const weather = await getWeather(settings.zip);
      const reply = await generateResponse(input, messages, { 
        temperature: weather.temperature, 
        hatesCold: weather.hatesCold,
        mode: settings.mode,
        zip: settings.zip
      });
      setMessages(prev => [...prev, { text: reply, isUser: false }]);
      setMoodMetrics({
        shortMessageCount: 0,
        lastFrustrationCheck: Date.now()
      });

    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "♦cough♦ Technical difficulties, madam.", 
        isUser: false 
      }]);
      setMoodMetrics({
        shortMessageCount: 0,
        lastFrustrationCheck: Date.now()
      });
    }
    setIsResponding(false);
    setHasPlacated(false);
  
    setMoodMetrics({
      shortMessageCount: 0,
      lastFrustrationCheck: Date.now()
    });
  };

  return (
    <div className="App">
      <div className="header-buttons">
        <button
          onClick={() => setShowSettings(true)}
          className="settings-button"
        >
          ⚙️
        </button>

        <button 
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setMessages([]);
          }}
          className='clear-memory-button'
        >
          Clear Memory
        </button>
      </div>

      <MessageList messages={messages} />
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        disabled={isResponding}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-settings" onClick={() => setShowSettings(false)}>✖</button>
            <h2>Jameson Settings</h2>
            {/* Example input to update mode */}
            <label>
              Mode:
              <select 
                value={settings.mode} 
                onChange={(e) => setSettings(prev => ({ ...prev, mode: e.target.value }))}
              >
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </label>
            {/* Example input to update zip */}
            <label>
              Zip Code:
              <input 
                type="text" 
                value={settings.zip} 
                onChange={(e) => setSettings(prev => ({ ...prev, zip: e.target.value }))}
              />
            </label>
            {/* Add more settings inputs here */}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
