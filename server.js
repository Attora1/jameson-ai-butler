import express from 'express';
import cors from 'cors';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
    if (!apiKey || !/^sk-[A-Za-z0-9]{40}$/.test(apiKey)) {
      throw new Error('Invalid voice system credentials');
    }

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
    // Error handling
    let statusCode = 500;
    let errorMessage = "Voice system malfunction";
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.detail?.message || errorMessage;
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
// SERVER STARTUP
// =====================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AELI Voice Server v1.3.0`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`ElevenLabs Key: ${process.env.ELEVENLABS_KEY ? 'Valid' : 'MISSING'}`);
  console.log(`Listening on port ${PORT}`);
});