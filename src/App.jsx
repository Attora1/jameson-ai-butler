import { useState, useEffect } from 'react';
import './styles/App.css';

import MessageList from './components/Chat/MessageList.jsx';
import ChatInput from './components/Chat/ChatInput.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { generateResponse } from './logic/AIResponseHandler.js';
import { getWeather } from './utils/getWeather.js';
import { STORAGE_KEY, DEFAULT_SETTINGS } from './constants.js';
import Focus from './components/Modes/Focus.jsx';
import LowSpoon from './components/Modes/LowSpoon.jsx';
import PartnerSupport from './components/Modes/PartnerSupport.jsx';
import { SpoonContext } from './context/SpoonContext.jsx';

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
  const [spoonCount, setSpoonCount] = useState(12);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("AELI_SETTINGS");
    const parsed = saved ? JSON.parse(saved) : {};
    return { ...DEFAULT_SETTINGS, ...parsed };
  });

  const renderModeComponent = () => {
    const subtitle = settings.nameCasual
      ? `Take it slow, ${settings.nameCasual}. No rush here.`
      : `Take it slow. No rush here.`;

    switch (settings.mode) {
      case 'focus':
        return <Focus settings={settings} />;
      case 'low_spoon':
        return <LowSpoon settings={settings} subtitle={subtitle} />;
      case 'partner_support':
        return <PartnerSupport settings={settings} />;
      case 'crisis':
        return <Crisis settings={settings} />;
      default:
        console.warn(`Unknown mode: ${settings.mode}. Defaulting to Low Spoon Mode.`);
        return <LowSpoon settings={settings} subtitle={subtitle} />;
    }
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("AELI_SETTINGS", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    async function fetchInitialWeather() {
      const weather = await getWeather(settings.zip);
      if (weather) setTemperature(weather.temperature);
    }
    fetchInitialWeather();
  }, [settings.zip]);

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
      const { replyText, newContext, spoonCount: parsedSpoonCount } = await generateResponse(input, messages, {
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

      setMessages(prev => [...prev, { text: replyText, isUser: false }]);

      if (typeof parsedSpoonCount === 'number') {
        setSpoonCount(parsedSpoonCount);
      }

      if (newContext.mode && newContext.mode !== settings.mode) {
        setSettings(prev => ({ ...prev, mode: newContext.mode }));
      }
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
    <SpoonContext.Provider value={{ spoonCount, setSpoonCount }}>
      <div className={`App ${settings.mode}-theme`}>


        <div className="main-content">
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
        <div className={`chat-container ${settings.mode}-theme`}>
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
          <div>
            {renderModeComponent()}
          </div>

          {showSettings && (
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              settings={settings}
              setSettings={setSettings}
            />
          )}
        </div>
      </div>
    </SpoonContext.Provider>
  );
}

export default App;
