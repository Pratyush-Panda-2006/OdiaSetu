import React, { useEffect, useRef } from 'react';
import { X, Shield, Lock, FileText, AlertCircle } from 'lucide-react';

export default function TermsModal({ isOpen, onClose }) {
  const contentRef = useRef(null);

  // Prevent body scrolling and reset modal content scroll position when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[80vh] overflow-hidden transform transition-all duration-300 scale-100 z-10 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">Terms & Conditions</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">OdiaSetu License Agreement</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800/50"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div 
          ref={contentRef}
          className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
          
          {/* Main Strict Banner */}
          <div className="relative p-4 sm:p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-indigo-500/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
            <div className="flex gap-3 sm:gap-4">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 self-start">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-indigo-300 font-display mb-1 text-sm sm:text-base">Ownership & Usage Restriction</h4>
                <p className="text-slate-200 font-medium">
                  This website and application are Made by Pratyush Panda and without my permission no one can use this.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold font-display text-xs sm:text-sm">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>Intellectual Property</span>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-xs pl-5 sm:pl-6">
              All proprietary code, stylesheets, designs, text, brand materials, API orchestrations, and interfaces contained within OdiaSetu are the exclusive intellectual property of Pratyush Panda. Any unauthorized reproduction, distribution, modification, reverse engineering, redistribution as templates, hosting, or deployment of this software is strictly prohibited under applicable copyright laws.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold font-display text-xs sm:text-sm">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Acceptable Use Policy</span>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-xs pl-5 sm:pl-6">
              OdiaSetu is provided as a translation platform. Users may query translation utilities through the official website interface. You agree not to abuse the underlying API key infrastructures, initiate high-frequency automated scraping campaigns, or conduct actions designed to disrupt, degrade, or bypass the application's rate-limits or service integrity.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold font-display text-xs sm:text-sm">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Disclaimer of Warranty</span>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-xs pl-5 sm:pl-6">
              OdiaSetu and its translations are provided on an "AS IS" and "AS AVAILABLE" basis. While efforts are made to use advanced Gemini models for precise translation, the owner does not guarantee absolute accuracy or uninterrupted service. Use of the application is entirely at your own risk.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800/60 bg-slate-950/20 flex justify-between items-center gap-4">
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-display">© {new Date().getFullYear()} Pratyush Panda</span>
          <button 
            onClick={onClose}
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 border border-indigo-500/20"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
}
