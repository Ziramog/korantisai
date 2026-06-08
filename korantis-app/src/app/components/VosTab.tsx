"use client";

import { useState, useEffect } from 'react';
import { User, Globe, MapPin, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useCircadian } from '../contexts/CircadianContext';

export default function VosTab() {
  const { savedVenueIds, city, setCity, language, setLanguage } = useCircadian();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Mock data for the demo
  const progress = 64; 
  const lugaresDescubiertos = 12 + savedVenueIds.length;
  const colecciones = 4;
  
  const moods = [
    { label: 'Íntimo', percentage: 40 },
    { label: 'Social', percentage: 30 },
    { label: 'Refugio', percentage: 20 },
    { label: 'Calmo', percentage: 10 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center min-h-[70vh]">
      <div className="w-24 h-24 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/30 flex items-center justify-center mb-6">
        <User size={40} className="text-[#C9A96E]" />
      </div>
      
      <h2 className="text-3xl font-display text-[#F5F0E8] mb-8">Tu Perfil</h2>

      <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="font-display text-2xl text-[#C9A96E]">{lugaresDescubiertos}</span>
          <span className="font-sans text-[10px] uppercase tracking-wider text-white/50 mt-1">Descubiertos</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
          <span className="font-display text-2xl text-[#C9A96E]">{colecciones}</span>
          <span className="font-sans text-[10px] uppercase tracking-wider text-white/50 mt-1">Colecciones</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-[#0A0806] border border-white/5 rounded-2xl p-6 shadow-xl mb-8">
        <h3 className="font-sans text-xs uppercase tracking-widest text-[#8A7A5A] mb-4">Tus Moods</h3>
        <div className="flex flex-col gap-3">
          {moods.map(mood => (
            <div key={mood.label} className="w-full">
              <div className="flex justify-between text-xs font-sans text-white/70 mb-1">
                <span>{mood.label}</span>
                <span>{mood.percentage}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#C9A96E]/50 to-[#C9A96E] rounded-full"
                  style={{ width: `${mood.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col gap-2 relative">
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex justify-between items-center transition-colors"
        >
          <span className="font-sans text-sm text-white/80">Configuración</span>
          <span className="text-white/30 text-xs">{isConfigOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        </button>

        {isConfigOpen && (
          <div className="w-full bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-4 mb-2 animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-white/70">
                <Globe size={16} />
                <span className="font-sans text-sm">Idioma</span>
              </div>
              <div className="flex bg-white/5 rounded-lg p-1">
                <button 
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 text-xs font-sans rounded-md transition-colors ${language === 'es' ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                >
                  ES
                </button>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-sans rounded-md transition-colors ${language === 'en' ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                >
                  EN
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-white/70">
                <MapPin size={16} />
                <span className="font-sans text-sm">Ciudad</span>
              </div>
              <div className="flex bg-white/5 rounded-lg p-1">
                <button 
                  onClick={() => setCity('BUE')}
                  className={`px-3 py-1 text-xs font-sans rounded-md transition-colors ${city === 'BUE' ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                >
                  BUE
                </button>
                <button 
                  onClick={() => setCity('NYC')}
                  className={`px-3 py-1 text-xs font-sans rounded-md transition-colors ${city === 'NYC' ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                >
                  NYC
                </button>
                <button 
                  onClick={() => setCity('DXB')}
                  className={`px-3 py-1 text-xs font-sans rounded-md transition-colors ${city === 'DXB' ? 'bg-[#C9A96E] text-black font-medium' : 'text-white/60 hover:text-white'}`}
                >
                  DXB
                </button>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => setToastMessage("Próximamente - En desarrollo")}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex justify-between items-center transition-colors"
        >
          <span className="font-sans text-sm text-white/80">Privacidad y Datos</span>
          <span className="text-white/30 text-xs"><ChevronRight size={16} /></span>
        </button>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/90 border border-[#C9A96E]/30 text-white/90 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in z-50">
            <Info size={16} className="text-[#C9A96E]" />
            <span className="font-sans text-xs tracking-wide">{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
