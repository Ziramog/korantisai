"use client";

import { useState, useEffect } from 'react';
import { useCircadian } from '../contexts/CircadianContext';
import { Sliders, Save, CheckCircle, Database } from 'lucide-react';
import Image from 'next/image';

export default function AdminDashboard() {
  const { rankedVenues, dimensionLabels } = useCircadian();
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  
  // Local state for the vector being edited
  const [editVector, setEditVector] = useState<number[]>(Array(8).fill(0));
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Simple hardcoded auth for demo purposes
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'k_admin_123') {
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    if (selectedVenue) {
      // In CircadianContext, tasteVector is present on the venue if loaded, 
      // but rankedVenues doesn't expose it directly in the type unless we cast it.
      // Wait, let's just default to [0,0,0,0,0,0,0,0] if missing, but we really want the current prior.
      // Since it's a prototype, we'll try to read it.
      const current = selectedVenue.tasteVector || Array(8).fill(0);
      setEditVector([...current]);
      setSaveStatus('idle');
    }
  }, [selectedVenue]);

  const handleSliderChange = (index: number, value: number) => {
    const newVector = [...editVector];
    newVector[index] = value;
    setEditVector(newVector);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedVenue) return;
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/admin/venues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: selectedVenue.id,
          tasteVector: editVector
        })
      });

      if (!res.ok) throw new Error('Failed to update');
      
      setSaveStatus('success');
      // Update local context seamlessly
      selectedVenue.tasteVector = [...editVector];
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={handleAuth} className="w-full max-w-sm bg-k-surface-elevated/20 p-8 rounded-2xl border border-white/5 text-center">
          <Database size={32} className="text-k-gold mx-auto mb-4" />
          <h1 className="text-2xl font-display text-white mb-6">Atmosphere Seeder v1</h1>
          <input 
            type="password" 
            placeholder="Admin Passcode"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-k-gold mb-4 text-center font-mono tracking-widest"
          />
          <button type="submit" className="w-full bg-k-gold text-black font-bold uppercase tracking-wider text-xs py-3 rounded-lg hover:bg-k-gold-light transition">
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-k-text bg-[#0A0A0A]">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 h-auto md:h-screen md:overflow-y-auto p-6 bg-k-surface/30 flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <Database size={20} className="text-k-gold" />
          <h1 className="text-xl font-display uppercase tracking-widest">Atmosphere Seeder</h1>
        </div>

        <div className="flex flex-col gap-2 max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-y-visible pr-1 md:pr-0">
          {rankedVenues.map(venue => (
            <button
              key={venue.id}
              onClick={() => setSelectedVenue(venue)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedVenue?.id === venue.id 
                  ? 'border-k-gold bg-k-gold/5' 
                  : 'border-white/5 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <h3 className="font-display text-lg text-white">{venue.name}</h3>
              <p className="text-[10px] uppercase tracking-wider text-k-text-tertiary font-sans mt-1">
                {venue.category} &middot; {venue.atmosphere.replace('-', ' ')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="w-full md:w-2/3 h-auto md:h-screen md:overflow-y-auto p-6 md:p-12">
        {selectedVenue ? (
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-12">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 shadow-lg">
                <Image src={selectedVenue.heroImage} alt={selectedVenue.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl md:text-4xl font-display text-white">{selectedVenue.name}</h2>
                <p className="text-xs md:text-sm text-k-text-secondary font-sans leading-relaxed max-w-lg">
                  {selectedVenue.narrative}
                </p>
              </div>
            </div>

            {/* Editor Sliders */}
            <div className="bg-k-surface-elevated/20 border border-white/5 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Sliders className="text-k-gold" size={20} />
                  <h3 className="text-lg font-sans font-light uppercase tracking-widest text-white">8D Prior Vector</h3>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-k-gold text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-k-gold-light transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : saveStatus === 'success' ? <><CheckCircle size={14}/> Saved</> : <><Save size={14}/> Inject Vector</>}
                </button>
              </div>

              <div className="flex flex-col gap-8">
                {Array.from({ length: 8 }).map((_, i) => {
                  const label = dimensionLabels[i].split(' vs. ');
                  const val = editVector[i];
                  
                  return (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="flex justify-between text-[11px] font-sans tracking-widest uppercase">
                        <span className={val < 0 ? 'text-k-gold font-bold' : 'text-k-text-tertiary'}>{label[0]}</span>
                        <span className="text-white/40">{val.toFixed(2)}</span>
                        <span className={val > 0 ? 'text-k-gold font-bold' : 'text-k-text-tertiary'}>{label[1]}</span>
                      </div>
                      
                      <div className="relative w-full h-1 bg-white/10 rounded-full flex items-center">
                        {/* Center marker */}
                        <div className="absolute left-1/2 w-0.5 h-3 bg-white/30 -translate-x-1/2 rounded"></div>
                        
                        <input 
                          type="range" 
                          min="-1" 
                          max="1" 
                          step="0.05" 
                          value={val}
                          onChange={(e) => handleSliderChange(i, parseFloat(e.target.value))}
                          className="w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-k-gold [&::-webkit-slider-thumb]:rounded-full cursor-pointer relative z-10"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-k-text-tertiary uppercase tracking-widest font-sans text-xs">
            Select a venue to edit its semantic prior
          </div>
        )}
      </div>
    </div>
  );
}
