import { useState, useEffect } from 'react';
import './styles/App.css';

import { useFacts } from './hooks/useFacts.js';
import { useSettings } from './hooks/useSettings.js';
import { useChat } from './hooks/useChat.jsx';
import { usePersistentTimerPolling } from './hooks/useTimer.js';

import MessageList from './components/Chat/MessageList.jsx';
import ChatInput from './components/Chat/ChatInput.jsx';
import WakeUpInput from './components/Chat/WakeUpInput.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import HealthProfileEditor from './components/HealthProfileEditor.jsx';
import { STORAGE_KEY } from './constants.js';
import { SpoonProvider, useSpoons } from './context/SpoonContext.jsx';
import { getMoodReflection } from './utils/introAndMood.js';
import { composeMemoryEntries } from './utils/memoriesBridge.js';
import { ModeProvider, useMode } from "./context/ModeContext.jsx";
import ModeRouter from "./components/ModeRouter.jsx";

function AppContent() {
  const { mode } = useMode();
  const [showFacts, setShowFacts] = useState(false);
  const { facts, addFact, clearFacts } = useFacts();
  const { settings, setSettings } = useSettings();
  const { spoons, spoonMax } = useSpoons();
  const [poweredDown, setPoweredDown] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const { messages, setMessages, input, setInput, isResponding, handleSubmit } = useChat(settings, setSettings, facts, addFact, spoons, poweredDown, setPoweredDown);

  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [inactivityMessageSent, setInactivityMessageSent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hpOpen, setHpOpen] = useState(false);
  usePersistentTimerPolling(setMessages, poweredDown, settings);

  useEffect(() => {
    document.body.setAttribute('data-mode', mode);
  }, [mode]);

  useEffect(() => {
    if (poweredDown) {
      const timer = setTimeout(() => setShowOverlay(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
    }

    const INACTIVITY_THRESHOLD = 5 * 60 * 1000;
    let inactivityTimer;

    const resetActivity = () => {
      setLastActivityTime(Date.now());
      setInactivityMessageSent(false);
    };

    const checkInactivity = () => {
      if (Date.now() - lastActivityTime > INACTIVITY_THRESHOLD && !inactivityMessageSent) {
        const inactivityMessages = [
          "It appears you’ve either stepped away or achieved the rare miracle of sleep. Signal me when you return, and we’ll pick up where we left off.",
          "You’ve gone quiet—either you’ve stepped away or slipped too deep into the feed. Let me know when you’re back, and we’ll carry on.",
          "You’ve gone quiet—either you’ve stepped away or been pulled into something shiny. Ping me when you’re back, and we’ll continue.",
        ];
        const randomMessage = inactivityMessages[Math.floor(Math.random() * inactivityMessages.length)];
        setMessages(prev => [...prev, { isUser: false, text: `[AELI] ${randomMessage}` }]);
        setInactivityMessageSent(true);
      }
    };

    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('click', resetActivity);
    inactivityTimer = setInterval(checkInactivity, 5000);

    return () => {
      clearInterval(inactivityTimer);
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('click', resetActivity);
    };
  }, [poweredDown, lastActivityTime, inactivityMessageSent, setMessages]);

  useEffect(() => {
    async function fetchInitialWeather() {
      if (settings.enableWeather && settings.zip) {
        try {
          const response = await fetch(`/api/weather?zip=${settings.zip}`);
          const weather = await response.json();
          if (response.ok) {
            // setTemperature(weather.temperature);
          } else {
            console.error("Error fetching weather:", weather.error);
          }
        } catch (error) {
          console.error("Failed to fetch weather data:", error);
        }
      }
    }
    fetchInitialWeather();
  }, [settings.zip, settings.enableWeather]);

  useEffect(() => {
    const hasSeen = localStorage.getItem("AELI_INTRO_SHOWN") === "true";

    if (
      !hasSeen &&
      settings.nameFormal &&
      settings.tone &&
      settings.mood &&
      messages.length > 0
    ) {
      const moodLine = getMoodReflection(settings.mood);
      const line = `[AELI] Ah, ${settings.nameFormal}. Pleasure to make your acquaintance. I see you prefer a ${settings.tone} conversation. ${moodLine}`;
      setMessages((prev) => [...prev, { isUser: false, text: line }]);
      localStorage.setItem("AELI_INTRO_SHOWN", "true");
    }
  }, [settings, messages.length, setMessages]);

  return (
    <>
      <div className={`App ${mode}-theme`}>
        <div className="main-content">
          <div className="header-buttons">
            <button onClick={() => setShowSettings(true)} className="settings-button btn">
              ⚙️
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setMessages([]);
              }}
              className="clear-memory-button btn"
            >
              Clear Memory
            </button>
            <button
              onClick={() => setShowFacts(f => !f)}
              className="show-facts-button  btn"
            >
              {showFacts ? "Hide Memories" : "Show Memories"}
            </button>
            <button
              onClick={clearFacts}
              className="clear-facts-button btn"
            >
              Clear Memories
            </button>
            <button
              onClick={() =>
                setSettings(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }))
              }
              className="voice-toggle-button btn"
            >
              {settings.voiceEnabled ? "🔈 Voice On" : "🔇 Voice Off"}
            </button>
          </div>

          <div className={`chat-container ${mode}-theme`}>
            {showFacts && (
              <div className="memory-facts" style={{ background: '#feffe8', border: '1px solid #eee', margin: '8px', padding: '8px' }}>
                <b>My Memories:</b>
                <button onClick={() => setHpOpen(true)} className="btn small">Edit Health Profile</button>

                {/* Wellness snapshot at the top */}
                {composeMemoryEntries({ spoons, spoonMax }).map((entry, idx) => (
                  <section key={`wellness-${idx}`} className="memory-block">
                    <h4>{entry.title}</h4>
                    <pre className="memory-pre" style={{ whiteSpace: 'pre-wrap' }}>
                      {entry.content}
                    </pre>
                  </section>
                ))}

                {/* Your existing facts render */}
                {facts.map((f, i) => (
                  <section key={i} className="memory-block">
                    <p>{typeof f === 'string' ? f : String(f)}</p>
                  </section>
                ))}
                <HealthProfileEditor open={hpOpen} onClose={() => setHpOpen(false)} />
              </div>
            )}
            <div className="messages">
              <MessageList messages={messages} settings={settings} poweredDown={poweredDown} />
            </div>
            {poweredDown ? (
              <WakeUpInput
                input={input}
                setInput={setInput}
                onWakeUp={handleSubmit}
              />
            ) : (
              <ChatInput
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                disabled={isResponding}
              />
            )}
          </div>

          <ModeRouter />

          {showSettings && (
            <SettingsModal
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              settings={settings}
              setSettings={setSettings}
              setMessages={setMessages}
            />
          )}
        </div>
      </div>
      {showOverlay && (
        <div className="aeli-poweroff-overlay fade-in">
          <p>AELI is powered down. Say “wake up” to restore functions.</p>
        </div>
      )}
    </>
  );
}


function App() {
  return (
    <SpoonProvider>
      <ModeProvider>
        <AppContent />
      </ModeProvider>
    </SpoonProvider>
  );
}

export default App;
