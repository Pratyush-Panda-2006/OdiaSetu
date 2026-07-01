import React from 'react';

export default function HistoryCard({
  timeLabel,
  sourceText,
  translatedText,
  sourceLang,
  targetLang,
  onClick
}) {
  return (
    <div 
      onClick={() => onClick({ sourceText, translatedText, sourceLang, targetLang })}
      className="p-8 rounded-[24px] bg-slate-900/40 border border-slate-800/50 hover:border-slate-700 transition-all duration-300 group cursor-pointer hover:shadow-xl hover:shadow-slate-950/20"
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          {timeLabel}
        </span>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-semibold tracking-wider uppercase">
          {sourceLang} ➔ {targetLang}
        </span>
      </div>
      <p className="text-white text-xl font-serif mb-4 line-clamp-2 group-hover:text-indigo-200 transition-colors">
        {sourceText}
      </p>
      <p className="text-slate-500 italic line-clamp-2">
        {translatedText}
      </p>
    </div>
  );
}
