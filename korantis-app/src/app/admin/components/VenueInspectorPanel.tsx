"use client";

import React, { useEffect, useState } from 'react';
import { VenueDetail } from '../../api/admin/venues/[id]/route';

interface InspectorProps {
  venueId: string | null;
  onClose: () => void;
}

export default function VenueInspectorPanel({ venueId, onClose }: InspectorProps) {
  const [detail, setDetail] = useState<VenueDetail | null>(null);
  const [resolvedVenueId, setResolvedVenueId] = useState<string | null>(null);
  const activeDetail = detail?.venue.id === venueId ? detail : null;
  const loading = Boolean(venueId) && !activeDetail && resolvedVenueId !== venueId;
  const loadFailed = Boolean(venueId) && !activeDetail && resolvedVenueId === venueId;

  useEffect(() => {
    if (!venueId) {
      return;
    }

    let cancelled = false;
    fetch(`/api/admin/venues/${venueId}`)
      .then((response) => response.json() as Promise<{ detail: VenueDetail }>)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setDetail(data.detail);
        setResolvedVenueId(venueId);
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedVenueId(venueId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  if (!venueId) return null;

  return (
    <div className="w-full h-full bg-[#0A0A0A] border-l border-[#2A2A2A] flex flex-col overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center bg-[#111111]">
        <h2 className="font-mono text-sm tracking-widest text-[#E0E0E0] uppercase">
          {loading ? 'Loading...' : activeDetail?.venue.name || 'Unavailable'}
        </h2>
        <button onClick={onClose} className="text-[#888888] hover:text-[#E0E0E0] font-mono text-xs">
          [X] CLOSE
        </button>
      </div>

      {loading || !activeDetail ? (
        <div className="flex-1 p-6 flex items-center justify-center font-mono text-xs text-[#555555]">
          {loadFailed ? 'Unable to fetch semantic vectors.' : 'Fetching semantic vectors...'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 font-mono">
          
          {/* Resonance Metrics */}
          <section className="p-4 border border-[#2A2A2A] bg-[#0D0D0D] rounded-sm">
              <h3 className="text-[10px] text-[#888888] uppercase tracking-widest mb-3">Resonance Score</h3>
              <div className="flex items-center gap-6">
                <div className="text-3xl text-k-gold">{activeDetail.comparison.cosineSimilarity.toFixed(2)}</div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#555555]">Classification</span>
                  <span className={`text-xs uppercase ${activeDetail.comparison.classification === 'divergent' ? 'text-red-400' : 'text-[#E0E0E0]'}`}>
                    {activeDetail.comparison.classification}
                  </span>
                </div>
              </div>
          </section>

          {/* Layer Comparison */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[10px] text-[#888888] uppercase tracking-widest border-b border-[#2A2A2A] pb-2">
              Semantic Layers
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* L2 Curator */}
              <div className="p-4 border border-[#1A2A3A] bg-[#0A1118] rounded-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-[#4A88C0] uppercase tracking-widest">Layer 2 (Curator)</span>
                  <span className="text-[8px] text-[#4A88C0] opacity-50">seed_vector</span>
                </div>
                <p className="text-xs text-[#A0C0E0] leading-relaxed">
                  {activeDetail.layer2.curatorialVoice}
                </p>
                <div className="mt-3 pt-3 border-t border-[#1A2A3A]/50">
                  <span className="text-[9px] text-[#4A88C0] opacity-70 block mb-1">Tagline</span>
                  <span className="text-[10px] text-[#E0E0E0] italic">{activeDetail.layer2.editorialTagline}</span>
                </div>
              </div>

              {/* L3 Crowd */}
              <div className="p-4 border border-[#3A2A1A] bg-[#18110A] rounded-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-[#C0884A] uppercase tracking-widest">Layer 3 (Crowd)</span>
                  <span className="text-[8px] text-[#C0884A] opacity-50">atm_prose</span>
                </div>
                <p className="text-xs text-[#E0C0A0] leading-relaxed">
                  {activeDetail.layer3.atmosphereProse}
                </p>
              </div>
            </div>
          </section>

          {/* Tags Diff */}
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] text-[#888888] uppercase tracking-widest border-b border-[#2A2A2A] pb-2">
              Theme Divergence
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-[#4A88C0] block mb-1">Editorial Only</span>
                <ul className="text-[10px] text-[#E0E0E0] flex flex-col gap-1">
                  {activeDetail.comparison.editorialThemes.map((t, i) => <li key={i}>- {t}</li>)}
                </ul>
              </div>
              <div>
                <span className="text-[9px] text-[#C0884A] block mb-1">Crowd Only</span>
                <ul className="text-[10px] text-[#E0E0E0] flex flex-col gap-1">
                  {activeDetail.comparison.crowdThemes.map((t, i) => <li key={i}>- {t}</li>)}
                </ul>
              </div>
              <div className="col-span-2 mt-2 p-3 bg-[#111111] border border-[#2A2A2A]">
                <span className="text-[9px] text-[#888888] block mb-1">Interpretation Notes</span>
                <p className="text-[10px] text-[#A0A0A0]">{activeDetail.comparison.interpretationNotes}</p>
              </div>
            </div>
          </section>

          {/* Raw Reviews */}
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] text-[#888888] uppercase tracking-widest border-b border-[#2A2A2A] pb-2">
              Layer 0 (Raw Review Corpus)
            </h3>
            <div className="flex flex-col gap-2">
              {activeDetail.rawReviews.map((rev, i) => (
                <div key={i} className="p-3 border border-[#2A2A2A] bg-[#0A0A0A] rounded-sm">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] text-[#E0E0E0]">Rating: {rev.rating}/5</span>
                    <span className="text-[8px] text-[#555555] uppercase">{rev.language}</span>
                  </div>
                  <p className="text-[10px] text-[#AAAAAA] italic">&quot;{rev.text}&quot;</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
