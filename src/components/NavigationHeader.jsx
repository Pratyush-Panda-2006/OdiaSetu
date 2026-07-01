import React from 'react';

export default function NavigationHeader({ showBadge = true, homeHref = "#" }) {
  return (
    <div className="text-center space-y-6">
      {showBadge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold tracking-widest uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          New Generation
        </div>
      )}
      <a href={homeHref} className="block hover:opacity-90 transition-opacity">
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter text-white font-serif">
          Odia<span className="italic font-normal text-indigo-200/40">Setu</span>
        </h1>
      </a>
    </div>
  );
}
