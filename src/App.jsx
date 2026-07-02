import React, { useState, useEffect } from 'react';
import NavigationHeader from './components/NavigationHeader';
import RadiantInputPanel from './components/RadiantInputPanel';
import RadiantOutputPanel from './components/RadiantOutputPanel';
import HistoryCard from './components/HistoryCard';
import { ArrowUpRight, Repeat } from 'lucide-react';

const MOCK_HISTORY = [
  {
    id: 1,
    timeLabel: "Recently",
    sourceText: "ତୁମର ନାମ କ’ଣ?",
    translatedText: "What is your name?",
    sourceLang: "Odia",
    targetLang: "English"
  },
  {
    id: 2,
    timeLabel: "12 mins ago",
    sourceText: "ମୁଁ ଓଡ଼ିଶା ଯିବାକୁ ଚାହେଁ |",
    translatedText: "I want to go to Odisha.",
    sourceLang: "Odia",
    targetLang: "English"
  },
  {
    id: 3,
    timeLabel: "Today, 2:15 PM",
    sourceText: "ଆଜି ବହୁତ ଗରମ ହେଉଛି |",
    translatedText: "It's very hot today.",
    sourceLang: "Odia",
    targetLang: "English"
  }
];

export default function App() {
  const [inputText, setInputText] = useState("ନମସ୍କାର, ଆପଣ କିପରି ଅଛନ୍ତି?");
  const [outputText, setOutputText] = useState("Hello, how are you doing today?");
  const [inputLanguage, setInputLanguage] = useState("Odia");
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeKeyLabel, setActiveKeyLabel] = useState("Generation 1");

  // Fetch initial active API key label
  useEffect(() => {
    fetch('/api/active-key')
      .then(res => res.json())
      .then(data => {
        if (data.apiKeyLabel) {
          setActiveKeyLabel(data.apiKeyLabel);
        }
      })
      .catch(err => console.error("Error fetching active key:", err));
  }, []);

  // Initialize history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('odiasetu_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (err) {
        setHistory(MOCK_HISTORY);
      }
    } else {
      setHistory(MOCK_HISTORY);
      localStorage.setItem('odiasetu_history', JSON.stringify(MOCK_HISTORY));
    }
  }, []);

  const handleSwap = () => {
    setInputLanguage(outputLanguage);
    setOutputLanguage(inputLanguage);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleClear = () => {
    setInputText("");
    setOutputText("");
  };

  const handleTextSubmit = async () => {
    if (!inputText || inputText.trim() === '') return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/translate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setOutputText(data.translation);
        if (data.apiKeyLabel) {
          setActiveKeyLabel(data.apiKeyLabel);
        }
      } else {
        setOutputText(`Error: ${data.error || 'Failed to translate'}`);
      }
    } catch (err) {
      console.error(err);
      setOutputText('Network error: Could not reach translation server');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioSubmit = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/translate-audio', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setOutputText(data.translation);
        setInputText(data.transcription || '[Voice input processed]');
        if (data.detectedLanguage) {
          const detected = data.detectedLanguage === 'Odia' ? 'Odia' : 'English';
          setInputLanguage(detected);
          setOutputLanguage(detected === 'Odia' ? 'English' : 'Odia');
        }
        if (data.apiKeyLabel) {
          setActiveKeyLabel(data.apiKeyLabel);
        }
      } else {
        setOutputText(`Error: ${data.error || 'Failed to process voice'}`);
      }
    } catch (err) {
      console.error(err);
      setOutputText('Network error: Could not send audio data to server');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!inputText || !outputText) return;
    
    // Check if it already exists in history to prevent duplicates
    if (history.some(item => item.sourceText === inputText && item.translatedText === outputText)) {
      return;
    }

    const newItem = {
      id: Date.now(),
      timeLabel: "Just now",
      sourceText: inputText,
      translatedText: outputText,
      sourceLang: inputLanguage,
      targetLang: outputLanguage
    };

    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('odiasetu_history', JSON.stringify(updated));
  };

  const handleHistoryCardClick = (item) => {
    setInputText(item.sourceText);
    setOutputText(item.translatedText);
    setInputLanguage(item.sourceLang);
    setOutputLanguage(item.targetLang);
    
    // Smooth scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = (e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to clear translation history?")) {
      setHistory([]);
      localStorage.setItem('odiasetu_history', JSON.stringify([]));
    }
  };

  return (
    <div className="hero-background min-h-screen w-full flex flex-col items-center relative p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/10 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center space-y-8 md:space-y-12 my-auto py-8 md:py-12">
        {/* Header Component */}
        <NavigationHeader showBadge={true} homeHref="#" activeKeyLabel={activeKeyLabel} />
        
        {/* Subtitle typing effect */}
        <div className="h-8 flex justify-center">
          <p className="typing-container text-slate-200 text-lg md:text-xl font-light text-center">
            Bridging voices between worlds with atmospheric precision.
          </p>
        </div>

        {/* Dashboard Panels */}
        <main className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center mt-6">
          {/* Input Panel */}
          <RadiantInputPanel 
            value={inputText}
            onChange={setInputText}
            onClear={handleClear}
            onAudioSubmit={handleAudioSubmit}
            onTextSubmit={handleTextSubmit}
            language={inputLanguage}
            isProcessing={isProcessing}
          />

          {/* Language Swap Button */}
          <div className="flex justify-center">
            <button 
              onClick={handleSwap}
              className="w-16 h-16 rounded-full bg-slate-950 text-white flex items-center justify-center border border-slate-800 shadow-2xl hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all duration-500 z-20 group"
              id="swap-langs"
              title="Swap languages"
            >
              <Repeat className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700 text-indigo-300" />
            </button>
          </div>

          {/* Output Panel */}
          <RadiantOutputPanel 
            outputText={outputText}
            outputLanguage={outputLanguage}
            onSave={handleSave}
            isProcessing={isProcessing}
          />
        </main>
      </div>

      {/* Downward Indicator */}
      <div className="flex flex-col items-center gap-2 opacity-50 my-8">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-slate-400">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-indigo-500 to-transparent"></div>
      </div>

      {/* History Area */}
      <div className="w-full bg-slate-950/60 backdrop-blur-md py-10 md:py-20 px-4 md:px-6 relative z-20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6 md:pb-8">
            <h3 className="text-2xl md:text-4xl font-serif text-white">Past Conversations</h3>
            <div className="flex gap-4 md:gap-6 items-center">
              {history.length > 0 && (
                <a 
                  href="#" 
                  onClick={handleClearHistory} 
                  className="text-xs text-red-400 hover:underline hover:text-red-300"
                >
                  Clear History
                </a>
              )}
            </div>
          </div>
          
          {history.length === 0 ? (
            <p className="text-slate-500 text-center py-12 italic font-serif">
              No past conversations found. Translations you save will appear here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {history.map((card) => (
                <HistoryCard 
                  key={card.id}
                  timeLabel={card.timeLabel}
                  sourceText={card.sourceText}
                  translatedText={card.translatedText}
                  sourceLang={card.sourceLang}
                  targetLang={card.targetLang}
                  onClick={handleHistoryCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
