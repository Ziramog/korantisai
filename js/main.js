/* ═══════════════════════════════════════════════════════════
   KORANTIS — INTERACTIONS
   Phase 1A.2 · Cinematic Motion Refinement
   
   Motion should feel:
   - floating, not bouncing
   - cinematic, not reactive
   - restrained, not flashy
   - atmospheric, not startup-like
   
   Everything calm and premium.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Respect user preferences */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Cinematic Scroll Reveals ──────────────── 
     Slow, floating entrance. Elements drift
     upward like rising warmth.
  ── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -80px 0px',
    }
  );

  function initReveals() {
    document.querySelectorAll('.k-reveal').forEach((el) => {
      revealObserver.observe(el);
    });
  }


  /* ── Bookmark Toggle ──────────────────────── 
     Quiet save. Minimal fanfare.
  ── */
  function initBookmarks() {
    document.querySelectorAll('.k-card__bookmark, .k-card__panel-bookmark').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const svg = btn.querySelector('svg');
        const isSaved = btn.classList.toggle('is-saved');

        if (isSaved) {
          svg.style.fill = 'currentColor';
          btn.style.color = 'var(--k-gold-light)';
          
          /* Subtle, restrained pulse — not bouncy */
          btn.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.12)', opacity: 0.8 },
            { transform: 'scale(1)', opacity: 1 },
          ], {
            duration: 500,
            easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
          });
        } else {
          svg.style.fill = 'none';
          btn.style.color = '';
        }
      });
    });
  }


  /* ── Staggered Tag Reveal ─────────────────── 
     Tags materialize slowly, one by one,
     like whispered words appearing.
  ── */
  function initTagStagger() {
    const tagContainers = document.querySelectorAll('.k-card__tags');
    if (prefersReducedMotion) return;

    const tagObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tags = entry.target.querySelectorAll('.k-tag');
            tags.forEach((tag, i) => {
              tag.style.opacity = '0';
              tag.style.transform = 'translateY(4px)';
              setTimeout(() => {
                tag.style.transition = 'opacity 800ms cubic-bezier(0.22, 0.61, 0.36, 1), transform 800ms cubic-bezier(0.22, 0.61, 0.36, 1)';
                tag.style.opacity = '1';
                tag.style.transform = 'translateY(0)';
              }, 500 + i * 120);
            });
            tagObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    tagContainers.forEach((container) => tagObserver.observe(container));
  }


  /* ── Cinematic Parallax Drift ─────────────── 
     Ultra-soft vertical drift on scroll.
     The image barely moves — just enough 
     to feel alive, like breathing.
  ── */
  function initParallax() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.k-card--immersive, .k-card--cinematic');
    if (!cards.length) return;

    let ticking = false;

    const handleScroll = () => {
      const viewH = window.innerHeight;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();

        if (rect.top < viewH && rect.bottom > 0) {
          const progress = (viewH - rect.top) / (viewH + rect.height);
          const offset = (progress - 0.5) * 8; /* Ultra-subtle: 8px max drift */
          const img = card.querySelector('.k-card__image');
          if (img) {
            img.style.transform = `translateY(${offset}px) scale(1.03)`;
          }
        }
      });
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ── Gradient Depth on Scroll ─────────────── 
     As the user scrolls past a card, 
     the gradient subtly deepens — 
     the card sinks into darkness.
  ── */
  function initGradientDepth() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.k-card--immersive, .k-card--cinematic');
    if (!cards.length) return;

    let ticking = false;

    const handleScroll = () => {
      const viewH = window.innerHeight;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();

        if (rect.top < viewH && rect.bottom > 0) {
          const progress = (viewH - rect.top) / (viewH + rect.height);
          /* As card scrolls up, gradient gets slightly deeper */
          const extraDark = Math.max(0, (progress - 0.6) * 0.15);
          const gradient = card.querySelector('.k-card__gradient');
          if (gradient) {
            gradient.style.opacity = 1 + extraDark;
          }
        }
      });
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ── Mobile Tap Feedback ──────────────────── 
     Restrained tactile response.
     The card compresses slightly, like pressing 
     into a premium material.
  ── */
  function initCardTaps() {
    if (!('ontouchstart' in window)) return;

    document.querySelectorAll('.k-card:not(.k-card--minimal)').forEach((card) => {
      let pressTimer;

      card.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          card.style.transition = 'transform 150ms cubic-bezier(0.22, 0.61, 0.36, 1)';
          card.style.transform = 'scale(0.985)';
        }, 60);
      }, { passive: true });

      card.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        card.style.transition = 'transform 500ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        card.style.transform = '';
      }, { passive: true });

      card.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
        card.style.transition = '';
        card.style.transform = '';
      }, { passive: true });
    });
  }


  /* ── Init ──────────────────────────────────── */
  function init() {
    initReveals();
    initBookmarks();
    initTagStagger();
    initParallax();
    initGradientDepth();
    initCardTaps();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
