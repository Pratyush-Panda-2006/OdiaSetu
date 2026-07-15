import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader2, ArrowRight, Square } from 'lucide-react';

export default function RadiantInputPanel({
  value,
  onChange,
  onClear,
  onAudioSubmit,
  onTextSubmit,
  language,
  isProcessing
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [permissionError, setPermissionError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const getTextAreaFontSize = () => {
    if (!value) return "text-lg sm:text-xl md:text-2xl";
    if (value.length > 1000) return "text-sm sm:text-base";
    if (value.length > 300) return "text-base sm:text-lg";
    return "text-lg sm:text-xl md:text-2xl";
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Format timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setPermissionError(null);
      setRecordDuration(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav';
        }
      }

      const recorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 32000 // 32 kbps to support long voice recordings without massive file size
      });
      mediaRecorderRef.current = recorder;
      
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (recorder.shouldSubmit !== false) {
          const audioBlob = new Blob(chunks, { type: mimeType });
          onAudioSubmit(audioBlob);
        }
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      
      // Start recording timer
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      setPermissionError('Microphone access denied or not supported');
    }
  };

  const stopRecording = (shouldSubmit = true) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.shouldSubmit = shouldSubmit;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording(true);
    } else {
      startRecording();
    }
  };

  // Keyboard shortcut: Translate on command/control + Enter
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onTextSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <span className="text-sm sm:text-base font-extrabold tracking-wider text-indigo-200 uppercase font-display">
          Input: {language}
        </span>
        {permissionError && (
          <span className="text-[10px] text-red-400 font-medium">
            {permissionError}
          </span>
        )}
      </div>
      
      <div className="radiant-wrapper rounded-[32px] h-64 md:h-80 group">
        <div className="radiant-border rounded-[32px]"></div>
        <div className="white-panel h-full w-full rounded-[32px] p-5 md:p-8 flex flex-col">
          {isRecording ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-4">
              <div className="flex items-end justify-center gap-1.5 h-16">
                <div className="w-1.5 bg-red-500 rounded-full voice-bar h-12" style={{ animationDelay: '0.1s', animationDuration: '0.8s' }}></div>
                <div className="w-1.5 bg-red-500 rounded-full voice-bar h-16" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }}></div>
                <div className="w-1.5 bg-red-500 rounded-full voice-bar h-8" style={{ animationDelay: '0.5s', animationDuration: '0.9s' }}></div>
                <div className="w-1.5 bg-red-500 rounded-full voice-bar h-14" style={{ animationDelay: '0.2s', animationDuration: '0.7s' }}></div>
                <div className="w-1.5 bg-red-500 rounded-full voice-bar h-10" style={{ animationDelay: '0.4s', animationDuration: '0.5s' }}></div>
              </div>
              <p className="text-sm md:text-base font-serif italic text-slate-400 animate-pulse text-center">
                Listening... Speak now in {language}
              </p>
            </div>
          ) : (
            <textarea 
              placeholder={`Type or speak in ${language}...`}
              className={`bg-transparent w-full flex-1 resize-none outline-none ${getTextAreaFontSize()} font-light text-slate-950 placeholder:text-slate-300 leading-relaxed font-serif disabled:opacity-50 overflow-y-auto`}
              value={value}
              disabled={isProcessing}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
            ></textarea>
          )}
          
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <>
                  <button 
                    type="button"
                    onClick={() => stopRecording(true)}
                    disabled={isProcessing}
                    className="w-14 h-14 rounded-full bg-red-500 border border-red-500 text-white flex items-center justify-center transition-all duration-300 relative animate-pulse shadow-lg shadow-red-200/50 hover:bg-red-600"
                    title="Stop and Translate"
                  >
                    <Square className="w-5 h-5 fill-white text-white" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => stopRecording(false)}
                    disabled={isProcessing}
                    className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all duration-300"
                    title="Cancel Recording"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={handleMicClick}
                  disabled={isProcessing}
                  className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-300 disabled:opacity-50"
                  title="Tap to speak"
                >
                  <Mic className="text-xl" />
                </button>
              )}
              
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                {isRecording 
                  ? `Recording... (${formatTime(recordDuration)})` 
                  : isProcessing 
                    ? 'Processing...' 
                    : 'Tap to speak'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {value && !isRecording && !isProcessing && (
                <>
                  <button 
                    type="button"
                    onClick={onClear}
                    className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                    title="Clear text"
                  >
                    <X className="text-xl" />
                  </button>
                  <button
                    type="button"
                    onClick={onTextSubmit}
                    className="w-10 h-10 rounded-full bg-slate-900 hover:bg-indigo-500 text-white flex items-center justify-center transition-all duration-300"
                    title="Translate text"
                  >
                    <ArrowRight className="text-lg" />
                  </button>
                </>
              )}
              {isProcessing && (
                <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
