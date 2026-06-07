"use client";

import { User } from 'lucide-react';
import { useCircadian } from '../contexts/CircadianContext';

export default function VosTab() {
  const { savedVenueIds } = useCircadian();

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

      <div className="w-full max-w-md flex flex-col gap-2">
        <button className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex justify-between items-center transition-colors">
          <span className="font-sans text-sm text-white/80">Configuración</span>
          <span className="text-white/30 text-xs">›</span>
        </button>
        <button className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 flex justify-between items-center transition-colors">
          <span className="font-sans text-sm text-white/80">Privacidad y Datos</span>
          <span className="text-white/30 text-xs">›</span>
        </button>
      </div>
    </div>
  );
}
