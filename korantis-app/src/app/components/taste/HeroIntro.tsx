"use client";

import { useCircadian } from '../../contexts/CircadianContext';
import { t } from '../../utils/i18n';

export default function HeroIntro() {
  const { language } = useCircadian();

  return (
    <div className="w-full text-center flex flex-col items-center justify-center pt-8 pb-3 px-4 pointer-events-auto">
      <h2 className="font-display text-[2rem] leading-[1.1] md:text-5xl text-k-text mb-3 tracking-wide max-w-2xl mx-auto">
        {t('heroPrimary', language)}
      </h2>
      <p className="font-sans text-sm md:text-[15px] font-light text-k-text-secondary leading-relaxed max-w-lg mx-auto">
        {t('heroSecondary', language)}
      </p>
    </div>
  );
}
