import React, { useState } from 'react';
import { Copy, Check, Volume2, Bookmark, BookmarkCheck } from 'lucide-react';

export default function RadiantOutputPanel({
  outputText,
  outputLanguage,
  onSave,
  isProcessing
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSpeak = () => {
    if (!outputText || !('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(outputText);
    
    // Odia (Oriya) is 'or-IN'
    utterance.lang = outputLanguage === 'Odia' ? 'or-IN' : 'en-US';
    
    // Try to find a specific voice for Indian English / Odia if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(voice => 
      voice.lang.toLowerCase() === utterance.lang.toLowerCase()
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (!outputText) return;
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <span className="text-sm sm:text-base font-extrabold tracking-wider text-indigo-200 uppercase font-sans">
          Output: {outputLanguage}
        </span>
      </div>
      
      <div className="radiant-wrapper rounded-[32px] h-64 md:h-80 group">
        <div className="radiant-border rounded-[32px]"></div>
        <div className="white-panel h-full w-full rounded-[32px] p-5 md:p-8 flex flex-col">
          <div className="flex-1 text-lg sm:text-xl md:text-2xl font-light text-slate-950 leading-relaxed font-serif overflow-y-auto pr-1">
            {isProcessing ? (
              <span className="text-slate-300 italic animate-pulse">Translating...</span>
            ) : outputText ? (
              outputText
            ) : (
              <span className="text-slate-300 italic">Translation will appear here...</span>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-end gap-2 sm:gap-3 border-t border-slate-100 pt-4">
            <button 
              type="button"
              onClick={handleCopy}
              disabled={!outputText}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
              title="Copy translation"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
            
            <button 
              type="button"
              onClick={handleSpeak}
              disabled={!outputText}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500"
              title="Speak translation"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            
            <button 
              type="button"
              onClick={handleSave}
              disabled={!outputText}
              className="px-4 sm:px-6 h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:shadow-none flex items-center gap-2"
              title="Save to history"
            >
              {saved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
