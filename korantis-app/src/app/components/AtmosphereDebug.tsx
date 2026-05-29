"use client";

import { useEffect, useState } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { Sliders, Clock, RotateCcw, Activity } from 'lucide-react';

export default function AtmosphereDebug() {
  const {
    currentHour,
    scrubTime,
    setScrubTime,
    isFrozen,
    setIsFrozen,
    identityCentroid,
    currentDrift,
    resetTaste,
    dimensionLabels,
    currentPhase
  } = useCircadian();

  const [active, setActive] = useState(false);

  // Bind key trigger or check URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === 'taste' || params.get('debug') === 'circadian') {
        setActive(true);
      }
    }
  }, []);

  if (!active) return null;

  const formattedTime = () => {
    const h = Math.floor(currentHour);
    const m = Math.floor((currentHour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-72 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-white shadow-2xl font-mono text-[10px] flex flex-col gap-4 max-h-[80vh] overflow-y-auto pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="text-k-gold animate-pulse" size={14} />
          <span className="font-bold uppercase tracking-wider text-k-gold">Atmosphere Engine HUD</span>
        </div>
        <button 
          onClick={resetTaste}
          className="p-1 px-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 text-white cursor-pointer hover:border-white/10 transition-colors flex items-center gap-1"
          title="Reset latent taste profile"
        >
          <RotateCcw size={10} />
          <span>RESET</span>
        </button>
      </div>

      {/* Circadian Scrubber Controller */}
      <div className="flex flex-col gap-2.5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
        <div className="flex justify-between items-center">
          <span className="text-k-text-secondary flex items-center gap-1.5">
            <Clock size={11} className="text-k-gold-muted" />
            <span>Time Scrubber</span>
          </span>
          <span className="text-k-gold font-bold">{formattedTime()} ({currentPhase.replace('-', ' ')})</span>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="range" 
            min="0" 
            max="24" 
            step="0.1" 
            value={scrubTime !== null ? scrubTime : currentHour}
            onChange={(e) => setScrubTime(parseFloat(e.target.value))}
            className="flex-grow h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-k-gold"
          />
          <button 
            onClick={() => {
              if (isFrozen) {
                setIsFrozen(false);
                setScrubTime(null);
              } else {
                setIsFrozen(true);
              }
            }}
            className={`px-2 py-1 rounded text-[8px] font-bold ${
              isFrozen 
                ? 'bg-k-gold text-k-black' 
                : 'bg-white/10 text-white'
            } cursor-pointer transition-colors`}
          >
            {isFrozen ? 'FROZEN' : 'FREEZE'}
          </button>
        </div>
      </div>

      {/* Latent Vector Sliders */}
      <div className="flex flex-col gap-3">
        <span className="text-k-text-secondary flex items-center gap-1.5 border-b border-white/5 pb-1">
          <Sliders size={11} className="text-k-gold-muted" />
          <span>8D Latent Taste Coordinates</span>
        </span>
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
          {Array.from({ length: 8 }).map((_, i) => {
            const label = dimensionLabels[i];
            const transVal = currentDrift[i];
            const baseVal = identityCentroid[i];

            // Map continuous range [-1.0, 1.0] to percentage [0%, 100%]
            const pctBase = ((baseVal + 1) / 2) * 100;
            const pctTrans = ((transVal + 1) / 2) * 100;

            return (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center leading-none">
                  <span className="text-white/60 text-[9px] max-w-[190px] truncate">{label}</span>
                  <span className="text-k-gold text-[9px] font-bold">{transVal.toFixed(2)}</span>
                </div>
                
                {/* Visual Glow Track Bar */}
                <div className="relative h-2.5 bg-white/5 rounded-full border border-white/5">
                  {/* Center Line Anchor */}
                  <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/20"></div>

                  {/* Baseline Indicator Tick */}
                  <div 
                    style={{ left: `${pctBase}%` }}
                    className="absolute top-[-2px] h-[14px] w-[2px] bg-white rounded-full z-20 shadow-md transform -translate-x-1/2"
                    title={`Baseline profile: ${baseVal.toFixed(2)}`}
                  ></div>

                  {/* Transient Indicator Glow Bar */}
                  <div 
                    style={{
                      left: `${Math.min(pctTrans, 50)}%`,
                      width: `${Math.abs(pctTrans - 50)}%`
                    }}
                    className="absolute top-0 h-full bg-k-gold/30 z-10"
                  ></div>

                  {/* Active Indicator Pulse Ring */}
                  <div 
                    style={{ left: `${pctTrans}%` }}
                    className="absolute top-[-3px] h-[16px] w-[4px] rounded bg-k-gold z-30 shadow-[0_0_10px_#C9A96E] transform -translate-x-1/2"
                    title={`Transient profile: ${transVal.toFixed(2)}`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
