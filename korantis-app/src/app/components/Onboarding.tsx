"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCircadian } from '../contexts/CircadianContext';
import { trackEvent } from '@/lib/analytics';
import { CITY_OPTIONS, type CityCode } from '@/lib/cities';
import Image from 'next/image';

const MOODS = [
  { id: 'intimate', label: 'Íntimo' },
  { id: 'social', label: 'Social' },
  { id: 'energetic', label: 'Energético' },
  { id: 'calm', label: 'Calmo' },
  { id: 'hidden_gem', label: 'Refugio' },
  { id: 'creative', label: 'Creativo' }
];

export default function Onboarding() {
  const { setCity } = useCircadian();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityCode>('BUE');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsOpen(!localStorage.getItem('korantis_onboarded'));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 0) {
      trackEvent('onboarding_step_completed', { step: 'welcome' });
      setStep(1);
    } else if (step === 1) {
      trackEvent('onboarding_step_completed', { step: 'city', city: selectedCity });
      setCity(selectedCity);
      setStep(2);
    } else if (step === 2) {
      trackEvent('onboarding_completed', { moods: selectedMoods.join(',') });
      localStorage.setItem('korantis_onboarded', 'true');
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-[#F5F0E8] font-sans">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center w-full max-w-sm text-center"
          >
            <div className="w-16 h-16 relative mb-8">
              <Image src="/korantislogo.jpeg" alt="Korantis" fill className="rounded-2xl object-cover mix-blend-screen opacity-90" />
            </div>
            <h1 className="font-display text-4xl mb-4 text-[#C9A96E]">
              No busques. Sentí.
            </h1>
            <p className="text-[#B0A898] leading-relaxed mb-12">
              Korantis no es un mapa. Es la capa emocional sobre la ciudad. Encontrá lugares según tu energía y el momento del día.
            </p>
            <button 
              onClick={handleNext}
              className="w-full bg-[#C9A96E] text-black font-medium py-4 rounded-full uppercase tracking-widest text-xs hover:bg-[#D4B87A] transition-colors"
            >
              Comenzar
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col w-full max-w-sm"
          >
            <h2 className="font-display text-3xl mb-2 text-center text-[#C9A96E]">¿Dónde estás?</h2>
            <p className="text-[#B0A898] text-center mb-10 text-sm">Elige tu ciudad base.</p>
            
            <div className="flex flex-col gap-4 mb-12">
              {CITY_OPTIONS.map((cityOption) => (
                <button
                  key={cityOption.code}
                  onClick={() => setSelectedCity(cityOption.code)}
                  className={`p-6 rounded-2xl border text-left transition-all ${selectedCity === cityOption.code ? 'border-[#C9A96E] bg-[#C9A96E]/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                >
                  <div className="text-xl font-display mb-1 text-white">{cityOption.name}</div>
                  <div className="text-xs text-[#8A7A5A] uppercase tracking-wider">{cityOption.code === 'BUE' ? 'Activo' : 'Beta'}</div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleNext}
              className="w-full bg-[#C9A96E] text-black font-medium py-4 rounded-full uppercase tracking-widest text-xs hover:bg-[#D4B87A] transition-colors"
            >
              Siguiente
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col w-full max-w-sm"
          >
            <h2 className="font-display text-3xl mb-2 text-center text-[#C9A96E]">Calibremos tu radar</h2>
            <p className="text-[#B0A898] text-center mb-10 text-sm">Elige hasta 3 moods que suelas buscar.</p>
            
            <div className="flex flex-wrap gap-3 justify-center mb-12">
              {MOODS.map(mood => {
                const isSelected = selectedMoods.includes(mood.id);
                return (
                  <button
                    key={mood.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMoods(prev => prev.filter(m => m !== mood.id));
                      } else if (selectedMoods.length < 3) {
                        setSelectedMoods(prev => [...prev, mood.id]);
                      }
                    }}
                    className={`px-5 py-3 rounded-full border text-sm transition-all ${
                      isSelected 
                        ? 'border-[#C9A96E] bg-[#C9A96E] text-black shadow-[0_0_15px_rgba(201,169,110,0.4)]' 
                        : 'border-white/20 bg-transparent text-[#B0A898] hover:border-white/50'
                    }`}
                  >
                    {mood.label}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={handleNext}
              className={`w-full font-medium py-4 rounded-full uppercase tracking-widest text-xs transition-all ${
                selectedMoods.length > 0 
                  ? 'bg-[#C9A96E] text-black hover:bg-[#D4B87A]' 
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
            >
              {selectedMoods.length > 0 ? 'Finalizar' : 'Saltar'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
