/* ═══════════════════════════════════════════════════════════
   KORANTIS — SEARCH EXPERIENCE INTERACTIONS
   Phase 1B · Editorial Choreography
   
   - Hybrid sticky header compression
   - Scroll velocity awareness
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Hybrid Sticky Header ──────────────────── 
     Scroll down: compress & blur.
     Scroll up: expand smoothly.
  ── */
  function initStickyHeader() {
    const header = document.getElementById('search-header');
    const scrollContainer = document.getElementById('view-search') || window;
    if (!header) return;

    let lastScrollY = scrollContainer.scrollTop || window.scrollY || 0;
    let ticking = false;
    
    // Thresholds
    const compressThreshold = 40; // Pixels to scroll before compressing
    
    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop || window.scrollY || 0;
      
      // At the very top, always expanded
      if (currentScrollY <= compressThreshold) {
        header.classList.remove('is-compressed', 'is-hidden');
      } 
      // Scrolling down past threshold -> compress
      else if (currentScrollY > lastScrollY) {
        header.classList.add('is-compressed');
        
        // Optional: If we want to hide it completely on deep scroll down:
        // if (currentScrollY > 200) {
        //   header.classList.add('is-hidden');
        // }
      } 
      // Scrolling up -> expand
      else if (currentScrollY < lastScrollY - 5) {
        // We only remove 'is-hidden' if we hid it, but for Phase 1B
        // the user requested it remains minimized, so we keep 'is-compressed' 
        // until we reach the top.
        // If we want it to expand fully on scroll up:
        header.classList.remove('is-compressed', 'is-hidden');
      }

      lastScrollY = currentScrollY;
    };

    scrollContainer.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ── Scroll Velocity Awareness ─────────────── 
     Fast scroll -> Cards get slightly dimmer, motion pauses.
     Slow scroll -> Normal luxury parallax.
  ── */
  function initVelocityAwareness() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.k-card');
    const scrollContainer = document.getElementById('view-search') || window;
    let lastScrollY = scrollContainer.scrollTop || window.scrollY || 0;
    let lastTimestamp = performance.now();
    let scrollTimeout;
    
    // State flag
    let isFastScrolling = false;

    scrollContainer.addEventListener('scroll', () => {
      const currentScrollY = scrollContainer.scrollTop || window.scrollY || 0;
      const currentTimestamp = performance.now();
      
      const deltaY = Math.abs(currentScrollY - lastScrollY);
      const deltaTime = currentTimestamp - lastTimestamp;
      
      // pixels per millisecond
      const velocity = deltaY / (deltaTime || 1); 
      
      // Threshold for "fast scroll"
      if (velocity > 1.8) {
        if (!isFastScrolling) {
          isFastScrolling = true;
          // Apply a "quiet" state to cards
          cards.forEach(card => {
            // Lower opacity slightly, disable pointer events momentarily
            card.style.transition = 'opacity 300ms ease, transform 300ms ease';
            card.style.opacity = '0.85';
            card.style.pointerEvents = 'none';
          });
        }
      } else {
        if (isFastScrolling) {
          isFastScrolling = false;
          cards.forEach(card => {
            card.style.transition = 'opacity 600ms var(--k-ease-cinematic), transform 600ms var(--k-ease-cinematic)';
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
          });
        }
      }

      // Reset state when scrolling completely stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isFastScrolling) {
          isFastScrolling = false;
          cards.forEach(card => {
            card.style.transition = 'opacity 600ms var(--k-ease-cinematic), transform 600ms var(--k-ease-cinematic)';
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
          });
        }
      }, 150);

      lastScrollY = currentScrollY;
      lastTimestamp = currentTimestamp;
    }, { passive: true });
  }

  /* ── Search Intent Vector Mapping ──────────────────── */

  const PILL_VECTORS = {
    'quiet':         [ 0.9, -0.2, -0.4,  0.4,  0.5, -0.2, -0.6, -0.3 ],
    'warm':          [ 0.1,  0.4,  0.8, -0.2, -0.4,  0.2,  0.4,  0.2 ],
    'natural light': [ 0.7, -0.3, -0.5,  0.9,  0.5,  0.2, -0.8, -0.4 ],
    'hidden gem':    [-0.6,  0.2,  0.5, -0.5, -0.4,  0.3,  0.4,  0.5 ],
    'creative':      [ 0.0,  0.5,  0.3,  0.1, -0.2,  0.4,  0.6,  0.7 ],
    'slow mornings': [ 0.8, -0.4, -0.3,  0.8,  0.8,  0.1, -0.5, -0.4 ],
    'late night':    [-0.9,  0.5,  0.9, -0.9, -0.8, -0.6,  0.4,  0.7 ]
  };

  const KEYWORD_VECTORS = [
    { keys: ['read', 'work', 'laptop', 'focus', 'study'], vector: [ 0.8, -0.2, -0.3,  0.5,  0.6, -0.1, -0.5, -0.3 ] },
    { keys: ['date', 'intimate', 'candlelit', 'romantic', 'night out'], vector: [-0.8,  0.5,  0.9, -0.8, -0.5, -0.3,  0.3,  0.5 ] },
    { keys: ['coffee', 'cafe', 'espresso', 'morning'], vector: [ 0.7, -0.2, -0.4,  0.8,  0.7, -0.2, -0.6, -0.4 ] },
    { keys: ['social', 'friends', 'meet', 'group', 'buzzing'], vector: [ 0.8,  0.3,  0.4,  0.0, -0.6,  0.5,  0.5,  0.3 ] }
  ];

  let queryVector = null;
  let activePillVectors = [];

  // Expose global search intent manager
  window.KorantisSearchIntent = {
    getActiveIntent: () => {
      if (!queryVector && activePillVectors.length === 0) return null;

      // Synthesize combined vector (average of active vectors)
      const vectors = [];
      if (queryVector) vectors.push(queryVector);
      activePillVectors.forEach(v => vectors.push(v));

      const combined = [0, 0, 0, 0, 0, 0, 0, 0];
      vectors.forEach(v => {
        for (let i = 0; i < 8; i++) {
          combined[i] += v[i];
        }
      });

      return combined.map(val => Math.max(-1.0, Math.min(1.0, val / vectors.length)));
    }
  };

  function updateIntentFromQuery(text) {
    const cleaned = text.toLowerCase().trim();
    if (cleaned.length < 3) {
      queryVector = null;
      return;
    }

    let foundVector = [0, 0, 0, 0, 0, 0, 0, 0];
    let matches = 0;

    KEYWORD_VECTORS.forEach(kv => {
      const isMatch = kv.keys.some(key => cleaned.includes(key));
      if (isMatch) {
        for (let i = 0; i < 8; i++) {
          foundVector[i] += kv.vector[i];
        }
        matches++;
      }
    });

    if (matches > 0) {
      queryVector = foundVector.map(val => val / matches);
    } else {
      // Fallback: search query has text but no exact match. Give a mild general search vector.
      queryVector = [0, 0, 0, 0, 0.1, 0, 0, 0];
    }
  }

  /* ── Horizontal Filter Pill Interactions ────── */
  function initFilters() {
    const pills = document.querySelectorAll('.k-filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pill.classList.toggle('is-active');
        
        // Update active pill vectors
        const activePills = document.querySelectorAll('.k-filter-pill.is-active');
        activePillVectors = [];
        
        activePills.forEach(ap => {
          const text = ap.textContent.trim().toLowerCase();
          if (PILL_VECTORS[text]) {
            activePillVectors.push(PILL_VECTORS[text]);
          }
        });

        // Trigger feed reordering based on intent shifts
        if (window.KorantisCircadian) {
          window.KorantisCircadian.triggerRankingUpdate();
        }
      });
    });
  }

  function initQueryInput() {
    const searchInput = document.querySelector('.k-search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      updateIntentFromQuery(e.target.value);
      
      // Dynamic feed update as query changes
      if (window.KorantisCircadian) {
        window.KorantisCircadian.triggerRankingUpdate();
      }
    });
  }

  function init() {
    initStickyHeader();
    initVelocityAwareness();
    initFilters();
    initQueryInput();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
