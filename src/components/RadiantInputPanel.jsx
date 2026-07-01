import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader2, ArrowRight } from 'lucide-react';

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

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: mimeType });
        onAudioSubmit(audioBlob);
        
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
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
      stopRecording();
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
        <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-300/60 uppercase font-display">
          Input: {language}
        </span>
        {permissionError && (
          <span className="text-[10px] text-red-400 font-medium">
            {permissionError}
          </span>
        )}
      </div>
      
      <div className="radiant-wrapper rounded-[32px] h-72 md:h-80 group">
        <div className="radiant-border rounded-[32px]"></div>
        <div className="white-panel h-full w-full rounded-[32px] p-8 flex flex-col">
          <textarea 
            placeholder={isRecording ? "Listening..." : `Type or speak in ${language}...`}
            className="bg-transparent w-full flex-1 resize-none outline-none text-xl sm:text-2xl md:text-3xl font-light text-slate-950 placeholder:text-slate-300 leading-relaxed font-serif disabled:opacity-50 overflow-y-auto"
            value={value}
            disabled={isRecording || isProcessing}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          ></textarea>
          
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={handleMicClick}
                disabled={isProcessing}
                className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all duration-300 relative ${
                  isRecording 
                    ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-indigo-500 hover:text-white hover:border-indigo-500'
                } disabled:opacity-50`}
              >
                {isRecording ? <MicOff className="text-xl" /> : <Mic className="text-xl" />}
              </button>
              
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
