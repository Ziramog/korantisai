"use client";

import { memo } from 'react';
import { Compass, MapPin, Bookmark, User } from 'lucide-react';
import { useCircadian, type ScoredVenue } from '../contexts/CircadianContext';
import { t } from '../utils/i18n';
import { trackEvent } from '@/lib/analytics';

export type MainTab = 'explore' | 'atlas' | 'guardados' | 'vos';

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
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'atlas', label: 'Atlas', icon: MapPin },
  { id: 'guardados', label: 'Guardados', icon: Bookmark },
  { id: 'vos', label: 'Vos', icon: User },
];

function GlobalNav({ activeTab, setActiveTab }: GlobalNavProps) {
  const { language } = useCircadian();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 border-t border-white/5 pb-[env(safe-area-inset-bottom)]" style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
      <nav className="flex items-center justify-around h-14 px-2 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (isActive) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  trackEvent('navigation_tab_changed', {
                    previous_tab: activeTab,
                    next_tab: item.id,
                  });
                  setActiveTab(item.id);
                }
              }}
              aria-label={t(item.id, language) || item.label}
              aria-pressed={isActive}
              className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors"
            >
              <Icon 
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? 'text-[#C9A96E]' : 'text-[#666666]'}
              />
              <span className={`text-[10px] font-sans tracking-wide ${isActive ? 'text-[#C9A96E] font-medium' : 'text-[#666666]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default memo(GlobalNav);
