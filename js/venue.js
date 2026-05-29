/* ═══════════════════════════════════════════════════════════
   KORANTIS — VENUE EXPERIENCE INTERACTIONS
   Phase 1C · Emotional Spatial Immersion
   
   - Heavy hero parallax breathing
   - Scroll-linked time-shift atmosphere
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Hero Parallax Breathing ─────────────────── 
     The hero image drifts down slowly as the user scrolls,
     creating a deep sense of scale and immersion.
  ── */
  function initHeroParallax() {
    if (prefersReducedMotion) return;

    const heroImage = document.getElementById('hero-parallax');
    const scrollContainer = document.getElementById('view-venue') || window;
    if (!heroImage) return;

    let ticking = false;

    scrollContainer.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = scrollContainer.scrollTop || window.scrollY || 0;
          // Apply a slow, heavy parallax translation
          // Only process if within the first 120vh to save performance
          if (scrollY < window.innerHeight * 1.2) {
            const yOffset = scrollY * 0.35;
            heroImage.style.transform = `translateY(${yOffset}px) scale(1.02)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── Scroll-Linked Time Shifts ───────────────── 
     As the user scrolls down through the .k-time-block elements,
     the background atmosphere (color) of the page smoothly shifts.
  ── */
  function initTimeShifts() {
    const timeBlocks = document.querySelectorAll('.k-time-block');
    const scrollContainer = document.getElementById('view-venue') || null;
    const body = document.body;
    
    if (timeBlocks.length === 0) return;

    // Define the atmospheric background colors for each time state
    const themes = {
      default: 'var(--k-black)',
      morning: '#111416',    // Cooler, quieter dark
      afternoon: '#181410',  // Warm, active dark
      night: '#060504'       // Deep cinematic black
    };

    const observerOptions = {
      root: scrollContainer,
      rootMargin: '-30% 0px -40% 0px', // Trigger when block is in the middle of the screen
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const block = entry.target;
          const theme = block.getAttribute('data-theme');
          
          // Activate the block text
          timeBlocks.forEach(b => b.classList.remove('is-active'));
          block.classList.add('is-active');

          // Shift the global atmosphere
          if (themes[theme]) {
            body.style.backgroundColor = themes[theme];
          }
        }
      });
    }, observerOptions);

    timeBlocks.forEach(block => observer.observe(block));

    // Reset background when leaving the time shift container
    const container = document.getElementById('time-shifts-container');
    if (container) {
      const containerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            // Restore default black if we scroll completely out of the time section
            body.style.backgroundColor = themes.default;
            timeBlocks.forEach(b => b.classList.remove('is-active'));
          }
        });
      }, {
        root: scrollContainer,
        rootMargin: '0px',
        threshold: 0
      });
      containerObserver.observe(container);
    }
  }


  function init() {
    initHeroParallax();
    initTimeShifts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
