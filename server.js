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
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Select a random client from the initialized list to balance requests
function getAI() {
  if (clients.length === 0) {
    throw new Error("No Gemini API Keys configured on the server.");
  }
  const index = Math.floor(Math.random() * clients.length);
  return clients[index];
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
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text content is required' });
  }

  try {
    const { client, label } = getAI();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [text],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const translation = response.text || '';
    res.json({ translation: translation.trim(), apiKeyLabel: label });
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

  try {
    const audioBuffer = req.file.buffer;
    let mimeType = req.file.mimetype;
    
    // Sanitize mimeType if it contains codec specifications (e.g. "audio/webm;codecs=opus")
    if (mimeType.includes(';')) {
      mimeType = mimeType.split(';')[0];
    }
    
    console.log(`Processing audio file of size ${audioBuffer.length} bytes, type ${mimeType}`);

    const { client, label } = getAI();
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

    const responseText = (response.text || '').trim();
    console.log(`Raw Gemini audio response: ${responseText}`);
    
    try {
      const parsed = JSON.parse(responseText);
      res.json({
        detectedLanguage: parsed.detectedLanguage || 'English',
        transcription: parsed.transcription || '',
        translation: parsed.translation || '',
        apiKeyLabel: label
      });
    } catch (err) {
      console.error('Failed to parse Gemini response as JSON:', responseText, err);
      // Fallback if parsing fails: assume responseText is the translation, and set default transcription
      res.json({
        detectedLanguage: 'English',
        transcription: '[Voice input processed]',
        translation: responseText,
        apiKeyLabel: label
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
  // Return the first key label as the default
  res.json({ apiKeyLabel: clients[0].label });
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
