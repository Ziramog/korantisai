"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type LightboxImage = {
  src?: string | null;
  role?: string | null;
  source?: string | null;
};

type VenueImageLightboxProps = {
  images: LightboxImage[];
  index: number | null;
  venueName: string;
  language: Locale;
  onClose: () => void;
  onChange: (index: number) => void;
};

const imageEase = [0.16, 1, 0.3, 1] as const;

export default function VenueImageLightbox({
  images,
  index,
  venueName,
  language,
  onClose,
  onChange,
}: VenueImageLightboxProps) {
  const isOpen = index !== null;
  const currentImage = index !== null ? images[index] : null;
  const canNavigate = images.length > 1;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (index === null || !canNavigate) return;

      if (event.key === 'ArrowLeft') {
        onChange((index - 1 + images.length) % images.length);
      }

      if (event.key === 'ArrowRight') {
        onChange((index + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canNavigate, images.length, index, isOpen, onChange, onClose]);

  return (
    <AnimatePresence>
      {isOpen && currentImage?.src && (
        <motion.div
          className="fixed inset-0 z-[120] bg-[#070504]/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'es' ? `Imagen ampliada de ${venueName}` : `Expanded image of ${venueName}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: imageEase }}
        >
          <button
            type="button"
            aria-label={language === 'es' ? 'Cerrar imagen' : 'Close image'}
            className="absolute inset-0 cursor-zoom-out"
            onClick={onClose}
          />

          <motion.div
            key={`${venueName}-${index}-${currentImage.src}`}
            className="pointer-events-none absolute inset-x-3 top-16 bottom-16 md:inset-x-14 md:top-10 md:bottom-10"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.48, ease: imageEase }}
          >
            <Image
              src={currentImage.src}
              alt={`${venueName} ${language === 'es' ? 'escena ampliada' : 'expanded scene'}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </motion.div>

          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between md:left-6 md:right-6">
            <div className="font-sans text-[10px] uppercase tracking-[0.28em] text-k-gold/45">
              {index !== null ? `${index + 1} / ${images.length}` : ''}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={language === 'es' ? 'Cerrar imagen' : 'Close image'}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-k-gold/10 bg-[#0F0D0B]/35 text-k-text-secondary/70 backdrop-blur-md transition hover:border-k-gold/25 hover:text-k-text"
            >
              <X size={16} />
            </button>
          </div>

          {canNavigate && index !== null && (
            <>
              <button
                type="button"
                onClick={() => onChange((index - 1 + images.length) % images.length)}
                aria-label={language === 'es' ? 'Imagen anterior' : 'Previous image'}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-white/70 drop-shadow-[0_2px_14px_rgba(0,0,0,0.75)] backdrop-blur-[1px] transition hover:text-white md:left-8"
              >
                <ChevronLeft size={52} strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={() => onChange((index + 1) % images.length)}
                aria-label={language === 'es' ? 'Imagen siguiente' : 'Next image'}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-white/70 drop-shadow-[0_2px_14px_rgba(0,0,0,0.75)] backdrop-blur-[1px] transition hover:text-white md:right-8"
              >
                <ChevronRight size={52} strokeWidth={1.25} />
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
