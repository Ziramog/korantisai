import { motion } from 'framer-motion';

export interface KorantisMarkerProps {
  isActive?: boolean;
  isSaved?: boolean;
  type?: 'ranked' | 'nearby' | 'cluster';
  clusterCount?: number;
  onClick?: (e: React.MouseEvent) => void;
}

function markerDelay(type: KorantisMarkerProps['type'], isSaved?: boolean) {
  if (isSaved) return 0.4;
  if (type === 'nearby') return 0.8;
  return 1.2;
}

export default function KorantisMarker({ isActive, isSaved, type = 'ranked', clusterCount, onClick }: KorantisMarkerProps) {
  const delay = markerDelay(type, isSaved);

  if (type === 'cluster') {
    return (
      <div 
        className="relative flex items-center justify-center cursor-pointer w-8 h-8 -ml-4 -mt-4 group"
        onClick={onClick}
      >
        {/* Ripple Effect (Onda Expansiva) */}
        <motion.div
          animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-[1.5px] border-k-gold/50 pointer-events-none"
        />
        {/* Core Cluster Marker */}
        <div className="absolute inset-0 rounded-full bg-[#0A0806]/95 border border-k-gold/40 flex items-center justify-center shadow-[0_0_15px_rgba(201,169,110,0.2)] group-hover:border-k-gold group-hover:scale-110 transition-all backdrop-blur-md">
          <span className="text-k-gold text-[10px] font-sans font-medium tracking-wide">{clusterCount}</span>
        </div>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="relative flex items-center justify-center cursor-pointer group w-12 h-12 -ml-6 -mt-6" onClick={onClick}>
        {/* Primary Expansive Wave (Strong) */}
        <motion.div
          animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-[2px] border-k-gold pointer-events-none"
        />
        {/* Secondary Expansive Wave (Wider, softer) */}
        <motion.div
          animate={{ scale: [1, 3.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          className="absolute inset-0 rounded-full border border-k-gold/60 pointer-events-none"
        />
        {/* Core Marker */}
        <div className="w-4 h-4 rounded-full bg-[#0A0806] border-[2.5px] border-k-gold z-10 shadow-[0_0_15px_rgba(201,169,110,0.9)]" />
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className="relative flex items-center justify-center cursor-pointer group w-8 h-8 -ml-4 -mt-4" onClick={onClick}>
        {/* Ripple Effect */}
        <motion.div
          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay }}
          className="absolute inset-0 rounded-full border border-k-gold/30 pointer-events-none"
        />
        <div className="w-3 h-3 rounded-full bg-[#0A0806] border border-k-gold z-10 shadow-[0_0_5px_rgba(201,169,110,0.4)] group-hover:scale-125 transition-transform" />
      </div>
    );
  }

  if (type === 'nearby') {
    return (
      <div className="relative flex items-center justify-center cursor-pointer group w-6 h-6 -ml-3 -mt-3" onClick={onClick}>
        {/* Ripple Effect */}
        <motion.div
          animate={{ scale: [1, 2], opacity: [0.4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay }}
          className="absolute inset-0 rounded-full border border-white/20 pointer-events-none"
        />
        <div className="w-1.5 h-1.5 rounded-full bg-[#E5E1D8]/60 relative z-10 group-hover:bg-k-gold transition-colors" />
      </div>
    );
  }

  // default 'ranked'
  return (
    <div className="relative flex items-center justify-center cursor-pointer group w-6 h-6 -ml-3 -mt-3" onClick={onClick}>
      {/* Ripple Effect (Onda Expansiva) */}
      <motion.div
        animate={{ scale: [1, 2.5], opacity: [0.7, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay }}
        className="absolute inset-0 rounded-full border-[1.5px] border-k-gold/40 pointer-events-none"
      />
      {/* Core Marker */}
      <div className="w-2.5 h-2.5 rounded-full bg-k-gold/80 relative z-10 group-hover:scale-150 group-hover:bg-k-gold transition-all shadow-[0_0_4px_rgba(201,169,110,0.3)]" />
    </div>
  );
}
