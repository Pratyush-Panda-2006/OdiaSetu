# OdiaSetu - Modern Atmospheric Translator

OdiaSetu is a full-stack, real-time voice and text translation web application supporting bidirectional English-to-Odia and Odia-to-English translation. It leverages the multimodal capabilities of the Gemini 2.5 Flash model via the `@google/genai` SDK to translate raw audio files directly into text without requiring an intermediary speech-to-text step.

---

## 📋 Modular Architecture Breakdown

The project structure is organized as a single, lightweight Node-based monorepo configuration:

```
OdiaSetu/
├── .env                    # Local environment variables configuration
├── package.json            # Scripts & monorepo dependencies
├── server.js               # Express server (Express, Multer, Google GenAI SDK integration)
├── vite.config.js          # Vite config (Tailwind v4 integration & API server proxy)
├── index.html              # Frontend HTML shell (Google Fonts links)
└── src/
    ├── main.jsx            # Frontend entry point
    ├── index.css           # Global custom Tailwind classes & ambient animations
    ├── App.jsx             # React master layout, states, & fetch controllers
    └── components/
        ├── NavigationHeader.jsx  # Atmospheric title & version indicators
        ├── RadiantInputPanel.jsx # MediaRecorder audio streams & fallback text boxes
        ├── RadiantOutputPanel.jsx# TTS, Copy controls, & History saving actions
        └── HistoryCard.jsx       # Custom layout for past saved translation items
```

---

## 🔌 API Contract Maps

The backend server exposes the following JSON endpoints on port `5000`:

### 1. Text Translation
* **Route**: `/api/translate-text`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "text": "Hello, how are you?"
  }
  ```
* **Response Body (Success)**:
  ```json
  {
    "translation": "ନମସ୍କାର, ଆପଣ କିପରି ଅଛନ୍ତି?"
  }
  ```

### 2. Voice Translation (Multimodal)
* **Route**: `/api/translate-audio`
* **Method**: `POST`
* **Content-Type**: `multipart/form-data`
* **Request Payload**:
  * `audio`: Binary Audio file (Blob, e.g., webm, wav, ogg)
* **Response Body (Success)**:
  ```json
  {
    "translation": "Hello, how are you?"
  }
  ```

---

## 🛠️ Setup & Running Locally

Follow these instructions to configure and run OdiaSetu on your system.

### Prerequisites
- Node.js (version 18 or above recommended)
- A Gemini API Key from Google AI Studio

### 1. Environment Configuration
Create or edit the `.env` file in the root directory:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=5000
```

### 2. Running in Development Mode
To start both the Express backend and the Vite dev server concurrently, run:
```bash
npm run dev
```
* The backend server will run on `http://localhost:5000`.
* The Vite frontend will run on `http://localhost:5173`. Vite will automatically proxy `/api` requests to the backend server.

### 3. Production Build & Execution
To build the static React assets and run the Express app in production:
```bash
# Build Vite React client
npm run build

# Start the node server serving the built assets
npm run start
```
* The unified application will be available at `http://localhost:5000`.
