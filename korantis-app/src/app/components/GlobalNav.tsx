"use client";

import { memo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Map, User } from 'lucide-react';
import { useCircadian, type ScoredVenue } from '../contexts/CircadianContext';
import { t } from '../utils/i18n';

export type MainTab = 'explore' | 'atlas' | 'taste';

interface GlobalNavProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  selectedVenue: ScoredVenue | null;
}

const NAV_ITEMS: Array<{
  id: MainTab;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'explore', label: 'Explore', icon: Search },
  { id: 'atlas', label: 'Atlas', icon: Map },
  { id: 'taste', label: 'Taste', icon: User },
];

const NAV_SPRING = { type: 'spring', damping: 28, stiffness: 260, mass: 0.8 } as const;

function GlobalNav({ activeTab, setActiveTab, selectedVenue }: GlobalNavProps) {
  const { language } = useCircadian();
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(true);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const velocity = scrollY.getVelocity();
    
    if (latest < 60) {
      setIsVisible(true);
    } else if (velocity > 30) {
      setIsVisible(false);
    } else if (velocity < -30) {
      setIsVisible(true);
    }
  });

  return (
    <AnimatePresence initial={false}>
      {!selectedVenue && (
        <div
          key="global-nav-shell"
          className="pointer-events-none fixed bottom-8 pb-[env(safe-area-inset-bottom)] left-0 right-0 z-50 flex justify-center px-4"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: isVisible ? 0 : 80, opacity: isVisible ? 1 : 0 }}
            exit={{ y: 80, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : NAV_SPRING}
            className="pointer-events-auto"
          >
            <nav
              className="flex items-center gap-6 rounded-full border border-white/5 bg-[#050505]/65 px-6 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
              style={{ backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)' }}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-label={t(item.id, language) || item.label}
                    aria-pressed={isActive}
                    className="group relative flex items-center justify-center p-1"
                  >
                    <Icon 
                      size={18}
                      strokeWidth={1.5}
                      className={`transition-colors ${isActive ? 'text-[#C9A96E]' : 'text-[#4A4A4A] group-hover:text-[#6A6A6A]'}`}
                    />
                  </button>
                );
              })}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default memo(GlobalNav);
