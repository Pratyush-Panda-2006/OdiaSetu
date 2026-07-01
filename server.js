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

// Initialize the GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is missing!");
}
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = "You are a real-time, context-aware voice translator between Odia and English. Analyze the provided file/text. If it is in Odia (including casual variations mixed with English), translate to natural English. If it is in English, translate directly into native Odia script. Output ONLY the translation. No conversational preamble.";

// Text translation endpoint
app.post('/api/translate-text', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text content is required' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [text],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const translation = response.text || '';
    res.json({ translation: translation.trim() });
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

    const response = await ai.models.generateContent({
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
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    const translation = response.text || '';
    res.json({ translation: translation.trim() });
  } catch (error) {
    console.error('Error in audio translation:', error);
    res.status(500).json({ error: error.message || 'Audio translation failed' });
  }
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
