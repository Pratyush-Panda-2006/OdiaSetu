import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup Multer memory storage (handling files directly in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  }
});

// Load all configured keys and initialize client instances for key rotation
const apiKeys = [
  { key: process.env.GEMINI_API_KEY, label: "Generation 1" },
  { key: process.env.GEMINI_API_KEY_2, label: "Generation 2" },
  { key: process.env.GEMINI_API_KEY_3, label: "Generation 3" },
  { key: process.env.GEMINI_API_KEY_4, label: "Generation 4" }
].filter(item => Boolean(item.key));

if (apiKeys.length === 0) {
  console.warn("WARNING: No GEMINI_API_KEY environment variables are configured!");
}

const clients = apiKeys.map(item => ({
  client: new GoogleGenAI({ apiKey: item.key }),
  label: item.label
}));

// In-memory rate limiting implementation
const rateLimitWindow = 60 * 1000; // 1 minute
const rateLimitMax = 30; // 30 requests per minute
const ipRequestCounts = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now - data.startTime > rateLimitWindow) {
      ipRequestCounts.delete(ip);
    }
  }
}, rateLimitWindow);

function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  
  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, { count: 1, startTime: now });
    return next();
  }
  
  const data = ipRequestCounts.get(ip);
  if (now - data.startTime > rateLimitWindow) {
    data.count = 1;
    data.startTime = now;
    return next();
  }
  
  if (data.count >= rateLimitMax) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  
  data.count += 1;
  next();
}

// Global rate limiting on API endpoints
app.use('/api', rateLimiter);

// Smooth, balanced round-robin API key selection with failover
let currentKeyIndex = 0;

function getAI(attempt = 0) {
  if (clients.length === 0) {
    throw new Error("No Gemini API Keys configured on the server.");
  }
  const index = (currentKeyIndex + attempt) % clients.length;
  if (attempt === 0) {
    currentKeyIndex = (currentKeyIndex + 1) % clients.length;
  }
  return clients[index];
}

async function callWithKeyRotation(apiCall) {
  let lastError;
  const totalKeys = clients.length;
  if (totalKeys === 0) {
    throw new Error("No Gemini API Keys configured on the server.");
  }
  
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const { client, label } = getAI(attempt);
    try {
      return await apiCall(client, label);
    } catch (error) {
      console.warn(`Gemini API key "${label}" failed. Attempt: ${attempt + 1}/${totalKeys}. Error: ${error.message || error}`);
      lastError = error;
    }
  }
  throw lastError;
}

const SYSTEM_INSTRUCTION = "You are a real-time, context-aware voice translator between Odia and English. Analyze the provided file/text. If it is in Odia (including casual variations mixed with English), translate to natural English. If it is in English, translate directly into native Odia script. Output ONLY the translation. No conversational preamble.";

const AUDIO_SYSTEM_INSTRUCTION = `You are a real-time, context-aware voice translator and transcriber between Odia and English.
Analyze the provided audio file.
1. Detect whether the spoken language is "Odia" or "English".
2. Transcribe the audio exactly in its original spoken language (English in English script, Odia in Odia script).
3. Translate it to the target language (Odia to English, or English to Odia).
You must return a JSON object with the following schema:
{
  "detectedLanguage": "Odia" or "English",
  "transcription": "the exact transcription in the original language",
  "translation": "the translation in the target language"
}
Do not return any other text, conversational intro, markdown formatting, or markdown code blocks. Return raw JSON only.`;

// Text translation endpoint
app.post('/api/translate-text', async (req, res) => {
  const { text } = req.body;
  
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Text content must be a string' });
  }

  const cleanText = text.trim();
  if (cleanText === '') {
    return res.status(400).json({ error: 'Text content is required' });
  }

  if (cleanText.length > 30000) {
    return res.status(400).json({ error: 'Text content exceeds the maximum size limit of 30,000 characters' });
  }

  // Sanitize text by stripping any potential HTML tags
  const sanitizedText = cleanText
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '');

  try {
    const result = await callWithKeyRotation(async (client, label) => {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [sanitizedText],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });
      return { translation: (response.text || '').trim(), label };
    });

    res.json({ translation: result.translation, apiKeyLabel: result.label });
  } catch (error) {
    console.error('Error in text translation:', error);
    res.status(500).json({ error: error.message || 'Text translation failed' });
  }
});

// Audio translation endpoint (multimodal - raw audio to text translation)
app.post('/api/translate-audio', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  // Validate file type
  let mimeType = req.file.mimetype;
  if (!mimeType || !mimeType.startsWith('audio/')) {
    return res.status(400).json({ error: 'Invalid file type. Only audio files are accepted.' });
  }

  // Validate size (limit to 20MB)
  if (req.file.size > 20 * 1024 * 1024) {
    return res.status(400).json({ error: 'Audio file exceeds the maximum size limit of 20MB.' });
  }

  try {
    const audioBuffer = req.file.buffer;
    
    // Sanitize mimeType if it contains codec specifications (e.g. "audio/webm;codecs=opus")
    if (mimeType.includes(';')) {
      mimeType = mimeType.split(';')[0];
    }
    
    console.log(`Processing audio file of size ${audioBuffer.length} bytes, type ${mimeType}`);

    const result = await callWithKeyRotation(async (client, label) => {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBuffer.toString('base64')
            }
          }
        ],
        config: {
          systemInstruction: AUDIO_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        }
      });
      return { responseText: (response.text || '').trim(), label };
    });

    const responseText = result.responseText;
    console.log(`Raw Gemini audio response: ${responseText}`);
    
    try {
      const parsed = JSON.parse(responseText);
      res.json({
        detectedLanguage: parsed.detectedLanguage || 'English',
        transcription: parsed.transcription || '',
        translation: parsed.translation || '',
        apiKeyLabel: result.label
      });
    } catch (err) {
      console.error('Failed to parse Gemini response as JSON:', responseText, err);
      // Fallback if parsing fails: assume responseText is the translation, and set default transcription
      res.json({
        detectedLanguage: 'English',
        transcription: '[Voice input processed]',
        translation: responseText,
        apiKeyLabel: result.label
      });
    }
  } catch (error) {
    console.error('Error in audio translation:', error);
    res.status(500).json({ error: error.message || 'Audio translation failed' });
  }
});

// Endpoint to retrieve default active key label
app.get('/api/active-key', (req, res) => {
  if (clients.length === 0) {
    return res.json({ apiKeyLabel: 'No API Key' });
  }
  // Return the currently active key index label
  res.json({ apiKeyLabel: clients[currentKeyIndex].label });
});

// Serve frontend build static files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback for SPA routing in production
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server (skip listener if deployed as a Vercel Serverless Function)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
