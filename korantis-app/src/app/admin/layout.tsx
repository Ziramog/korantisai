import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-k-gold/30">
      <nav className="w-full border-b border-[#2A2A2A] px-6 py-4 flex items-center justify-between bg-[#0A0A0A]">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs tracking-widest text-[#888888]">KORANTIS //</span>
          <span className="font-mono text-xs tracking-widest text-k-gold uppercase">Semantic Divergence Inspection</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] bg-[#1A1A1A] px-2 py-1 rounded text-[#888888] border border-[#2A2A2A]">
            SYS: ONLINE
          </span>
        </div>
      </nav>
      <main className="w-full h-[calc(100vh-53px)] overflow-hidden">
        {children}
      </main>
    </div>
  );
}
