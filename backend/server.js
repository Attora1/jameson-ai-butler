import express from 'express';
import cors from 'cors';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import db from './db.js';
import { buildPromptWithContext } from './buildPromptWithContext.js';
import { getWeather } from './getWeather.js';
import { analyzeAndSaveFacts } from './autoSaveFacts.js';
import { getAuthUrl, getTokens, listEvents } from './google.js';



// Load environment variables

// Initialize Express
const app = express();

// =====================
// SECURITY MIDDLEWARE
// =====================
app.use((req, res, next) => {
  // Remove Express header
  res.removeHeader('X-Powered-By');
  
  // Set security headers
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });
  next();
});

// =====================
// REQUEST LOGGING
// =====================
app.use(morgan(':method :url :status - :response-time ms - Chars::res[x-character-cost]'));

// =====================
// CORS CONFIGURATION
// =====================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  exposedHeaders: ['X-Character-Cost']
}));

// =====================
// RATE LIMITING
// =====================
const ttsLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000, // Use environment variable for window
  max: process.env.RATE_LIMIT_MAX, // Use environment variable for max requests
  message: {
    error: "Vocal system overcapacity. Tea break required.",
    code: "RATE_LIMITED"
  },
  validate: { trustProxy: false } // For secure deployments
});

// =====================
// TTS ENDPOINT
// =====================
app.post('/api/speak', ttsLimiter, express.json(), async (req, res) => {
  try {
    console.log('[TTS] Received request:', req.body.voiceID);
    console.log('[TTS] API Key:', process.env.ELEVENLABS_KEY?.slice(0,5)+'...');

    // Validate input
    const { text, voiceID } = req.body;
    if (!text?.trim() || !voiceID) {
      return res.status(400).json({
        error: "Required parameters missing: text or voiceID",
        code: "INVALID_REQUEST"
      });
    }

    // Verify API key format
    const apiKey = process.env.ELEVENLABS_KEY;
if (!apiKey || !/^((sk|xi)_[A-Za-z0-9]{30,})$/.test(apiKey)) {
      throw new Error('Invalid voice system credentials');
    }
    console.log('[AELI] Sending request to Groq...');

    // Generate speech
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`,
      {
        text: text.substring(0, 2500),
        model_id: voiceID === 'onwK4e9ZLuTAKqWW03F9' 
          ? "eleven_monolingual_v1" 
          : "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.58,
          similarity_boost: 0.75,
          style: 0,
          speed: 1.07,
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'stream',
        timeout: 20000 // 20 seconds
      }
    );

    console.log('[TTS] ElevenLabs response status:', response.status);


    // Forward headers for monitoring
    res.set({
      'Content-Type': 'audio/mpeg',
      'X-Character-Cost': response.headers['x-character-cost'] || '0',
      'Cache-Control': 'no-store, max-age=0'
    });

    // Stream audio to client
    response.data.pipe(res);

    // Handle upstream errors
    response.data.on('error', err => {
      console.error('Audio stream error:', err);
      if (!res.headersSent) res.status(500).end();
    });

  } catch (error) {
    // Enhanced error handling and logging
    let statusCode = 500;
    let errorMessage = "Voice system malfunction";

    if (error.response) {
      statusCode = error.response.status;
      // Log the full ElevenLabs error response for debugging
      console.error('ELEVENLABS ERROR RESPONSE:', error.response.data);
      errorMessage = error.response.data?.detail?.message || JSON.stringify(error.response.data) || errorMessage;
    } else if (error.code === 'ECONNABORTED') {
      statusCode = 504;
      errorMessage = "Voice system response timeout";
    }

    console.error(`TTS Error (${statusCode}):`, error.message);
    res.status(statusCode).json({
      error: errorMessage,
      code: "TTS_ERROR"
    });
  }
});

let serverPoweredDown = false;
app.post('/api/power/sleep', (req, res) => {
  serverPoweredDown = true;
  console.log("[SERVER] Entering sleep mode...");
  res.json({ message: "AELI server is now asleep." });
});

app.post('/api/power/wake', (req, res) => {
  serverPoweredDown = false;
  console.log("[SERVER] Waking up...");
  res.json({ message: "AELI server is awake again." });
});


// =====================
// HEALTH CHECK
// =====================
app.get('/api/health', (req, res) => {
  try {
    res.json({
      status: "Operational",
      services: {
        elevenLabs: !!process.env.ELEVENLABS_KEY,
        environment: process.env.NODE_ENV || 'development'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {  // Fix: Added missing '{' here
    console.error('Health check failed:', error);
    res.status(500).end();
  }
}); 

// =====================
// CHAT API
// =====================
app.get('/api/chat/history', (req, res) => {
  const userId = req.query.userId || "defaultUser";
  db.messages.find({ userId }).sort({ timestamp: 1 }).exec((err, messages) => {
    if (err) {
      console.error('Failed to fetch chat history:', err);
      return res.status(500).json({ error: 'Failed to fetch chat history.' });
    }
    res.json(messages);
  });
});

app.post('/api/chat', express.json(), async (req, res) => {
  
  try {
    const { userInput, messageHistory, context } = req.body;
    const apiKey = process.env.GROQ_API_KEY; // Assuming GROQ_API_KEY is now in .env
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

    if (!apiKey) {
      return res.status(500).json({ error: "Groq API key is not configured." });
    }

    // Build the prompt with context
    const fullPrompt = await buildPromptWithContext(messageHistory, context);

    const body = {
      model: "llama3-8b-8192", // Or whatever model you prefer
      messages: [
        { role: "system", content: fullPrompt },
        { role: "user", content: userInput }
      ]
    };

    const response = await axios.post(apiUrl, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      timeout: 20000 // 20 seconds
    });

    console.log('[GROQ RESPONSE]', response.data);


    const replyContent = response.data.choices?.[0]?.message?.content || "AELI couldn't generate a response right now.";

    console.log('[RAW AELI REPLY]', replyContent);


    let replyText;
    let action = null;

    try {
      const parsedReply = JSON.parse(replyContent);
      replyText = parsedReply.replyText || replyContent; // Use replyText from JSON, or fallback to full content
      action = parsedReply.action || null;
    } catch (e) {
      // If it's not valid JSON, treat it as plain text
      replyText = replyContent;
    }

    // Store messages in DB (assuming a userId for now, will need to implement user management later)
    const userId = context.userId || "defaultUser"; // Placeholder userId
    db.messages.insert({ userId, isUser: true, text: userInput, timestamp: new Date() });
    db.messages.insert({ userId, isUser: false, text: replyText, timestamp: new Date() });

    // Analyze and save facts
    analyzeAndSaveFacts(userInput, replyText);

    res.json({ replyText, action });

  } catch (error) {
    console.error('[AELI] API Error:', error.response?.data || error.message);
    res.status(500).json({ error: "Apologies, the silver polish appears to be tarnished." });
  }
});

// =====================
// GOOGLE CALENDAR API
// =====================
app.get('/api/auth/google', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const tokens = await getTokens(code);
    // Store tokens securely
    db.users.update({ userId: 'defaultUser' }, { $set: { googleTokens: tokens } }, { upsert: true });
    res.redirect('/');
  } catch (error) {
    console.error('Error getting Google tokens:', error);
    res.status(500).send('Error getting Google tokens');
  }
});

app.get('/api/calendar/events', async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.users.findOne({ userId: 'defaultUser' }, (err, doc) => {
        if (err) reject(err);
        resolve(doc);
      });
    });

    if (!user || !user.googleTokens) {
      return res.status(401).json({ error: 'User not authenticated with Google' });
    }

    const events = await listEvents(user.googleTokens);
    res.json(events);
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).send('Error getting calendar events');
  }
});


// =====================
// SIDE QUEST GENERATION API
// =====================
app.post('/api/generate-side-quests', express.json(), async (req, res) => {
  try {
    const { mainTask } = req.body;
    const apiKey = process.env.GROQ_API_KEY;
    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

    if (!apiKey) {
      return res.status(500).json({ error: "Groq API key is not configured." });
    }

    const systemPrompt = `You are AELI, an AI assistant. Your task is to break down a given main task into 3-5 smaller, actionable side quests. These side quests should be specific, achievable, and directly contribute to completing the main task. Respond with a JSON array of strings, where each string is a side quest. Do not include any other text or formatting.

Example:
User: "Write a report"
Assistant: ["Outline the report sections.", "Gather data for section 1.", "Draft the introduction.", "Review and edit conclusion.", "Format for submission."]

User: "Clean the kitchen"
Assistant: ["Clear the countertops.", "Wash the dishes.", "Wipe down surfaces.", "Sweep the floor.", "Take out the trash."]

Main Task: "${mainTask}"
`;

    const body = {
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: mainTask }
      ],
      temperature: 0.7, // Adjust as needed for creativity vs. directness
    };

    const response = await axios.post(apiUrl, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      timeout: 20000
    });

    const generatedContent = response.data.choices?.[0]?.message?.content;
    let sideQuests = [];

    try {
      sideQuests = JSON.parse(generatedContent);
      if (!Array.isArray(sideQuests)) {
        throw new Error("AI did not return a JSON array.");
      }
    } catch (e) {
      console.error("Failed to parse AI generated side quests:", e);
      // Fallback if AI doesn't return valid JSON
      sideQuests = ["Review the main task.", "Break it into smaller steps.", "Ask for clarification if needed."];
    }

    res.json({ sideQuests });

  } catch (error) {
    console.error('[AELI] Side Quest API Error:', error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate side quests." });
  }
});

// =====================
// WEATHER API
// =====================
app.get('/api/weather', async (req, res) => {
  try {
    const { zip } = req.query;
    if (!zip) {
      return res.status(400).json({ error: 'Zip code is required.' });
    }
    const weatherData = await getWeather(zip);
    res.json(weatherData);
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data.' });
  }
});

// =====================
// WELLNESS TRACKER API
// =====================

// Get current wellness data
app.get('/api/wellness', async (req, res) => {
  try {
    const userId = req.query.userId || "defaultUser";
    const wellness = await db.wellness.findOne({ userId });
    if (wellness) {
      res.json({
        spoonCount: wellness.spoonCount,
        mood: wellness.mood,
        userId: wellness.userId,
        _id: wellness._id
      });
    } else {
      res.json({ spoonCount: 12, mood: 'neutral', userId: userId });
    }
  } catch (error) {
    console.error('Failed to fetch wellness data:', error);
    res.status(500).json({ error: 'Failed to fetch wellness data.' });
  }
});

// Update wellness data
app.post('/api/wellness', express.json(), async (req, res) => {
  try {
    const { spoonCount, mood, userId } = req.body;
    const userIdentifier = userId || "defaultUser";

    const updateDoc = {};
    if (spoonCount !== undefined && typeof spoonCount === 'number') {
      updateDoc.spoonCount = spoonCount;
    }
    if (mood !== undefined && typeof mood === 'string') {
      updateDoc.mood = mood;
    }

    await db.wellness.update(
      { userId: userIdentifier },
      { $set: updateDoc },
      { upsert: true }
    );

    const updatedWellness = await db.wellness.findOne({ userId: userIdentifier });
    if (updatedWellness) {
      res.status(200).json({
        spoonCount: updatedWellness.spoonCount,
        mood: updatedWellness.mood,
        userId: updatedWellness.userId,
        _id: updatedWellness._id
      });
    } else {
      res.status(500).json({ error: 'Failed to retrieve updated wellness data.' });
    }
  } catch (error) {
    console.error('Failed to update wellness data:', error);
    res.status(500).json({ error: 'Failed to update wellness data.' });
  }
});

// =====================
// ADD FACT (FOR TESTING)
// =====================
app.post('/api/addfact', express.json(), async (req, res) => {
  try {
    const { fact } = req.body;
    if (!fact) {
      return res.status(400).json({ error: 'Fact is required.' });
    }
    db.facts.insert({ fact, timestamp: new Date() });
    res.status(201).json({ message: "Fact added." });
  } catch (error) {
    console.error('Failed to add fact:', error);
    res.status(500).json({ error: 'Failed to add fact.' });
  }
});

app.post('/api/clearfacts', express.json(), async (req, res) => {
  try {
    db.facts.remove({}, { multi: true });
    res.status(200).json({ message: "Facts cleared." });
  } catch (error) {
    console.error('Failed to clear facts:', error);
    res.status(500).json({ error: 'Failed to clear facts.' });
  }
});

// In-memory store for timers
const activeTimers = {};
let recentExpiredTimers = [];

// Function to re-create timers from DB on startup
async function loadAndRecreateTimers() {
  console.log('Attempting to load and re-create timers...');
  try {
    db.facts.find({ type: 'activeTimer' }, (err, storedTimers = []) => {
      if (err) {
        console.error('Error loading timers from DB:', err);
        return;
      }
    
      console.log(`Found ${storedTimers.length} stored timers.`);
    
      storedTimers.forEach(timer => {
        const remainingTime = (timer.startTime + timer.duration * 1000) - Date.now();
        if (remainingTime > 0) {
          console.log(`Re-creating timer ${timer.timerId} with ${remainingTime / 1000} seconds remaining.`);
          const timeout = setTimeout(() => {
            console.log(`Timer ${timer.timerId} finished after ${timer.duration} seconds.`);
    
            recentExpiredTimers.push(timer.timerId);
            setTimeout(() => {
              recentExpiredTimers = recentExpiredTimers.filter(id => id !== timer.timerId);
            }, 10000);
    
            db.facts.remove({ _id: timer._id }, {});
            delete activeTimers[timer.timerId];
          }, remainingTime);
    
          activeTimers[timer.timerId] = { ...timer, timeout };
        } else {
          console.log(`Removing expired timer ${timer.timerId} from DB.`);
          db.facts.remove({ _id: timer._id }, {});
        }
      });
    });
    
    console.log(`Loaded and re-created ${Object.keys(activeTimers).length} active timers.`);
  } catch (error) {
    console.error('Error loading and re-creating timers:', error);
  }
}

app.post('/api/set-timer', express.json(), async (req, res) => {
  if (serverPoweredDown) {
    return res.status(503).json({ message: "AELI is powered down." });
  }
  
  const { duration, timerId } = req.body;
  console.log(`Received request to set timer: ${timerId} for ${duration} seconds.`);

  if (!duration || !timerId) {
    console.log('Missing duration or timerId.');
    return res.status(400).json({ error: 'Duration and timerId are required.' });
  }

  // Clear existing timer if it exists
  if (activeTimers[timerId]) {
    console.log(`Clearing existing timer: ${timerId}`);
    clearTimeout(activeTimers[timerId].timeout);
    await db.facts.remove({ timerId, type: 'activeTimer' }, {});
  }

  const newTimer = {
    timerId,
    duration,
    startTime: Date.now(),
    type: 'activeTimer' // Add a type to distinguish from other facts
  };

  try {
    const insertedTimer = await new Promise((resolve, reject) => {
      db.facts.insert(newTimer, (err, newDoc) => {
        if (err) reject(err);
        else resolve(newDoc);
      });
    });
    console.log(`Timer ${timerId} inserted into DB with _id: ${insertedTimer._id}`);
    const timeout = setTimeout(() => {
      console.log(`Timer ${timerId} finished after ${duration} seconds.`);
    
      recentExpiredTimers.push(timerId);
      setTimeout(() => {
        recentExpiredTimers = recentExpiredTimers.filter(id => id !== timerId);
      }, 10000);
    
      db.facts.remove({ _id: insertedTimer._id }, {});
      delete activeTimers[timerId];
    }, duration * 1000);
    

    activeTimers[timerId] = { ...newTimer, timeout, _id: insertedTimer._id };
    console.log(`Timer ${timerId} set in activeTimers. Timeout object:`, timeout);
    res.status(200).json({ message: `Timer ${timerId} set for ${duration} seconds.` });
  } catch (error) {
    console.error('Error setting timer in DB:', error);
    res.status(500).json({ error: 'Failed to set timer.' });
  }
});

app.post('/api/clear-timer', express.json(), async (req, res) => {
  const { timerId } = req.body;

  if (!timerId) {
    return res.status(400).json({ error: 'TimerId is required.' });
  }

  if (activeTimers[timerId]) {
    clearTimeout(activeTimers[timerId].timeout);
    delete activeTimers[timerId];
    try {
      db.facts.remove({ timerId, type: 'activeTimer' }, {});
      res.status(200).json({ message: `Timer ${timerId} cleared.` });
    } catch (error) {
      console.error('Error clearing timer from DB:', error);
      res.status(500).json({ error: 'Failed to clear timer.' });
    }
  } else {
    res.status(404).json({ error: `Timer ${timerId} not found.` });
  }
});

app.get('/api/check-timers', (req, res) => {
  res.json({ expiredTimers: recentExpiredTimers });
});

app.get('/api/timer-status', (req, res) => {
  const { timerId } = req.query;
  if (activeTimers[timerId]) {
    const remaining = activeTimers[timerId].startTime + activeTimers[timerId].duration * 1000 - Date.now();
    res.json({ remaining });
  } else {
    res.json({ remaining: 0 });
  }
});



// =====================
// SERVER STARTUP
// =====================
if (!process.env.IS_NETLIFY) {
  loadAndRecreateTimers(); // Load and re-create timers on startup
}

export default app;
