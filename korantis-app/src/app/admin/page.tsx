"use client";

import React, { useEffect, useState } from 'react';
import { VenueRow } from '../api/admin/venues/route';
import VenueInspectorPanel from './components/VenueInspectorPanel';

export default function AdminDashboardPage() {
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/venues')
      .then(res => res.json())
      .then(data => {
        setVenues(data.venues);
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'ready_for_review': return 'text-k-gold bg-k-gold/10 border-k-gold/20';
      case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getResonanceColor = (label: string) => {
    switch (label) {
      case 'almost_identical': return 'text-green-400';
      case 'strong': return 'text-green-500';
      case 'partial': return 'text-yellow-500';
      case 'divergent': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex w-full h-full">
      {/* Main Grid Area */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${selectedId ? 'w-2/3' : 'w-full'}`}>
        {/* Filters Bar (Stub) */}
        <div className="p-4 border-b border-[#2A2A2A] bg-[#0A0A0A] flex gap-4">
          <input 
            type="text" 
            placeholder="Filter by name..." 
            className="bg-[#111] border border-[#2A2A2A] rounded-sm px-3 py-1.5 text-xs text-[#E0E0E0] outline-none focus:border-[#555] font-mono"
          />
          <select className="bg-[#111] border border-[#2A2A2A] rounded-sm px-3 py-1.5 text-xs text-[#E0E0E0] outline-none focus:border-[#555] font-mono">
            <option value="">Status: All</option>
            <option value="ready_for_review">Ready for Review</option>
            <option value="published">Published</option>
          </select>
          <select className="bg-[#111] border border-[#2A2A2A] rounded-sm px-3 py-1.5 text-xs text-[#E0E0E0] outline-none focus:border-[#555] font-mono">
            <option value="">Divergence: All</option>
            <option value="divergent">Divergent</option>
            <option value="strong">Strong</option>
          </select>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-[#050505]">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-[#0A0A0A] text-[#888] sticky top-0 border-b border-[#2A2A2A] z-10 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="py-3 px-4 font-normal">Venue</th>
                <th className="py-3 px-4 font-normal">City</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Resonance</th>
                <th className="py-3 px-4 font-normal">Quality</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-[#555]">
                    Initializing semantic grid...
                  </td>
                </tr>
              ) : (
                venues.map((venue) => (
                  <tr 
                    key={venue.id} 
                    className={`hover:bg-[#111] transition-colors cursor-pointer ${selectedId === venue.id ? 'bg-[#151515]' : ''}`}
                    onClick={() => setSelectedId(venue.id)}
                  >
                    <td className="py-3 px-4 text-[#E0E0E0]">
                      {venue.name}
                      <div className="text-[9px] text-[#555] mt-1 line-clamp-1">{venue.tags.join(' • ')}</div>
                    </td>
                    <td className="py-3 px-4 text-[#888]">{venue.city}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-sm border ${getStatusColor(venue.status)} text-[9px] uppercase tracking-wider`}>
                        {venue.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getResonanceColor(venue.resonance.label)}`}>
                          {venue.resonance.score.toFixed(2)}
                        </span>
                        <span className="text-[#555] uppercase text-[9px]">{venue.resonance.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-[#222] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#888]" 
                            style={{ width: `${venue.completeness_score * 100}%` }}
                          />
                        </div>
                        <span className="text-[#888]">{venue.completeness_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-[#888] hover:text-[#FFF] uppercase tracking-widest text-[9px]">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Panel */}
      {selectedId && (
        <div className="w-1/3 h-full border-l border-[#2A2A2A] bg-[#0A0A0A] flex-shrink-0 animate-in slide-in-from-right-8 duration-200">
          <VenueInspectorPanel venueId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}
