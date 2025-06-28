// 🔴 IMPORTS  
import { useState, useEffect } from 'react';  
import { GoogleGenerativeAI } from '@google/generative-ai';  
import axios from 'axios';  
import { AELIErrorBoundary } from './ErrorBoundary';  
// 🛠️ Disabled ElevenLabs temporarily
// import { useAELIVoice } from './hooks/useAELIVoice';  
import { buildAELIPrompt } from './prompts/AELIPersona';  
import './App.css';  

// 🔴 ENVIRONMENT VARIABLES
const AIRTABLE_PAT = import.meta.env.VITE_AIRTABLE_PAT;  
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;  
const WEATHER_KEY = import.meta.env.VITE_WEATHER_KEY;  
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;  

// 🔴 GEMINI INITIALIZATION
const genAI = new GoogleGenerativeAI(GEMINI_KEY);  

function App() {  
  // 🔴 STATE MANAGEMENT  
  const [messages, setMessages] = useState([]);  
  const [input, setInput] = useState('');  
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [userPrefers, setUserPrefers] = useState({ hates_cold: false });
  // 🛠️ Disabled voice temporarily
  // const { speak, isSpeaking, VOICE_OPTIONS } = useAELIVoice();  
  const [currentTasks, setCurrentTasks] = useState([]);

  // 🔴 ENV VALIDATION
  console.log('[AELI] Airtable Valid:', 
    AIRTABLE_BASE_ID?.startsWith('app') && AIRTABLE_PAT?.startsWith('pat'));

  // 🔴 PROACTIVE SYSTEMS (Airtable Fixes 🛠️)
  useEffect(() => {

    const testAuth = async () => {
      try {
        const response = await axios.get(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/preferences`,
          { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } }
        );
        console.log('🍵 Auth Successful! Response:', response.data);
      } catch (error) {
        console.error('🔥 Auth Failed:', error.response?.status, error.message);
      }
    };
    testAuth();

    const fetchData = async () => {
      try {
        // 🛠️ Fixed Airtable request
        const [prefs, tasks] = await Promise.all([
          axios.get(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Preferences`, {
            headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
          }),
          axios.get(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Tasks`, {
            headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
            params: {
              filterByFormula: encodeURIComponent(
                `AND({Status} != 'done', {Location} = 'Wardrobe')`
              ),
              fields: ["name", "due", "urgency", "Location", "Status"],
              sort: [{field: "due", direction: "asc"}]
            }
          })
        ]);

        console.log('Tasks Data:', tasks.data?.records[0]?.fields);
        console.log('[AIRTABLE RAW RESPONSE]', tasks.data);


        // 🛠️ Sanitized data
        setUserPrefers(prefs.data.records[0]?.fields || {});
        setCurrentTasks(tasks.data.records.map(t => ({
          fields: {
            name: t.fields.name || "Mystery Task",
            due: t.fields.due || new Date().toISOString(),
            urgency: Number(t.fields.urgency) || 1,
            Status: (t.fields.Status || "not started").trim()
          }
        })));

      } catch (error) {
        console.error("Tea Spillage:", error.response?.data || error.message);
      }
    };

    fetchData();
    
    // 🛠️ Simplified Weather Checks
    const weatherTimer = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Detroit&units=imperial&appid=${WEATHER_KEY}`
        );
        if (data.main.temp < 60 && userPrefers.hates_cold) {
          alert(`Madam, ${Math.round(data.main.temp)}°F detected. Thermal layers advised.`);
        }
      } catch (error) {
        console.error("Weather Report Missing:", error.message);
      }
    }, 300000);

    return () => clearInterval(weatherTimer);
  }, [audioAllowed, userPrefers.hates_cold]);

  // 🔴 CHAT HANDLING (Gemini Only 🛠️)
  const handleSubmit = async (e) => {  
    e.preventDefault();  
    if (!input.trim()) return;  

    setMessages(prev => [...prev, { text: input, isUser: true }]);  
    setInput('');  

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });  
      const result = await model.generateContent(buildAELIPrompt(input));  
      const reply = await result.response.text();
      setMessages(prev => [...prev, { text: reply, isUser: false }]);  
      // 🛠️ Temporary alert instead of voice
      alert(`AELI: ${reply}`);
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Apologies, my circuits require polishing. More tea?",  
        isUser: false 
      }]);
    }
  };  

  // 🔴 UI RENDERING (Simplified)
  return (  
    <AELIErrorBoundary>  
      <div className="App" onClick={() => setAudioAllowed(true)}>
        <div className="messages">  
          {messages.map((msg, i) => (  
            <div key={i} className={msg.isUser ? 'user-message' : 'bot-message'}>
              {msg.text.split('\n').map((line, idx) => <p key={idx}>{line}</p>)}
            </div>  
          ))}  
        </div>  

        <form onSubmit={handleSubmit} className="chat-input">  
          <input  
            value={input}  
            onChange={(e) => setInput(e.target.value)}  
            placeholder="Consult AELI..."  
          />  
          <button type="submit">Engage</button>  
        </form>  
      </div>  
    </AELIErrorBoundary>  
  );  
}  

export default App;