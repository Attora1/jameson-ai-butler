import { useState, useEffect } from 'react';
import MessageList from './components/Chat/MessageList.jsx';
import ChatInput from './components/Chat/ChatInput.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { generateResponse } from './logic/AIResponseHandler.js';
import { getWeather } from './utils/getWeather.js';
import { STORAGE_KEY, DEFAULT_SETTINGS } from './constants.js';
import Focus from './components/Modes/Focus.jsx';
// Add more modes as needed

import './styles/App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isResponding, setIsResponding] = useState(false);
  const [skipNextResponse, setSkipNextResponse] = useState(false);

  const [moodMetrics, setMoodMetrics] = useState({
    shortMessageCount: 0,
    lastFrustrationCheck: Date.now(),
  });

  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [inactivityNudged, setInactivityNudged] = useState(false);
  const [temperature, setTemperature] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("JAMESON_SETTINGS");
    const parsed = saved ? JSON.parse(saved) : {};
    return { ...DEFAULT_SETTINGS, ...parsed };
  });

  const renderModeComponent = () => {
    switch (settings.mode) {
      case 'focus':
        return <Focus settings={settings} />;
      case 'low_spoon':
        return <LowSpoon settings={settings} />;
      case 'partner_support':
        return <PartnerSupport settings={settings} />;
      case 'crisis':
        return <Crisis settings={settings} />;
      default:
        return null;
    }
  };

  // Load messages once on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Persist settings when changed
  useEffect(() => {
    localStorage.setItem("JAMESON_SETTINGS", JSON.stringify(settings));
  }, [settings]);

  // Fetch weather on zip change
  useEffect(() => {
    async function fetchInitialWeather() {
      const weather = await getWeather(settings.zip);
      if (weather) setTemperature(weather.temperature);
    }
    fetchInitialWeather();
  }, [settings.zip]);

  // Persist messages on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

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
        mode: settings.mode,
        nameFormal: settings.nameFormal,
        nameCasual: settings.nameCasual,
        title: settings.title,
        mood: settings.mood,
        voiceGender: settings.voiceGender,
        voiceAccent: settings.voiceAccent,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        memoryLimit: settings.memoryLimit,
      });

      setMessages(prev => [...prev, { text: reply, isUser: false }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { text: "♦cough♦ Technical difficulties, madam.", isUser: false },
      ]);
    }
    setIsResponding(false);
    setMoodMetrics({
      shortMessageCount: 0,
      lastFrustrationCheck: Date.now(),
    });
  };

  return (
    <div className="App">
      {/* Header ABOVE chat only */}
        <div className="header-buttons">
          <button onClick={() => setShowSettings(true)} className="settings-button">
            ⚙️
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setMessages([]);
            }}
            className="clear-memory-button"
          >
            Clear Memory
          </button>
        </div>

      <div className="main-content">
        {/* Chat Section */}
        <div className="chat-container">
          <div className="messages">
            <MessageList messages={messages} />
          </div>
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            disabled={isResponding}
          />
        </div>

        {/* Mode panel renders the active mode */}
        <div className="mode-panel">{renderModeComponent()}</div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          setSettings={setSettings}
        />
      )}
    </div>
  );
}

export default App;
