"use client";

import { useCircadian } from '../contexts/CircadianContext';

export default function HeaderControls() {
  const { language, setLanguage, city, setCity } = useCircadian();

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
      {/* City Switch */}
      <div className="flex p-1 rounded-full bg-[#0F0D0B]/80 backdrop-blur-md border border-white/10 shadow-lg">
        <button
          onClick={() => setCity('BUE')}
          className={`px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-widest uppercase transition-all duration-300 ${
            city === 'BUE' 
              ? 'bg-k-gold text-k-black shadow-[0_0_10px_rgba(212,175,55,0.3)]' 
              : 'text-k-text-secondary hover:text-white'
          }`}
        >
          BUE
        </button>
        <button
          onClick={() => setCity('NYC')}
          className={`px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-widest uppercase transition-all duration-300 ${
            city === 'NYC' 
              ? 'bg-k-gold text-k-black shadow-[0_0_10px_rgba(212,175,55,0.3)]' 
              : 'text-k-text-secondary hover:text-white'
          }`}
        >
          NYC
        </button>
      </div>

      {/* Language Switch */}
      <div className="flex p-1 rounded-full bg-[#0F0D0B]/80 backdrop-blur-md border border-white/10 shadow-lg">
        <button
          onClick={() => setLanguage('es')}
          className={`px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-widest uppercase transition-all duration-300 ${
            language === 'es' 
              ? 'bg-k-surface-elevated text-k-gold border border-k-gold/30' 
              : 'text-k-text-secondary hover:text-white border border-transparent'
          }`}
        >
          ES
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-full text-[10px] font-sans font-semibold tracking-widest uppercase transition-all duration-300 ${
            language === 'en' 
              ? 'bg-k-surface-elevated text-k-gold border border-k-gold/30' 
              : 'text-k-text-secondary hover:text-white border border-transparent'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
