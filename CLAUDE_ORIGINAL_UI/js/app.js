/* ═══════════════════════════════════════════════════════════
   KORANTIS — APPLICATION SHELL ORCHESTRATOR
   Phase 2A · Transition Architecture
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements
  const viewSearch = document.getElementById('view-search');
  const viewVenue = document.getElementById('view-venue');
  const overlay = document.getElementById('transition-overlay');
  const globalNav = document.getElementById('global-nav');
  
  // State
  let currentView = viewSearch;
  let scrollMemory = {
    'view-search': 0,
    'view-venue': 0
  };
  let isTransitioning = false;

  /* ── Transition Choreography ──────────────────── 
     Fade-through-black between views.
     Saves scroll memory and restores it.
  ── */
  function transitionToView(targetView, duration = 1200) {
    if (isTransitioning || currentView === targetView) return;
    isTransitioning = true;

    // 1. Save scroll memory of current view
    scrollMemory[currentView.id] = currentView.scrollTop;

    // 2. Fade to black
    overlay.classList.add('is-active');

    setTimeout(() => {
      // 3. Swap active classes in the dark
      currentView.classList.remove('k-view--active');
      targetView.classList.add('k-view--active');
      
      // 4. Restore scroll memory for target view
      targetView.scrollTop = scrollMemory[targetView.id] || 0;
      
      currentView = targetView;

      // 5. Fade out black
      setTimeout(() => {
        overlay.classList.remove('is-active');
        isTransitioning = false;
      }, 100); // slight pause in the black
      
    }, duration / 2);
  }

  /* ── FLIP: Card -> Venue Expansion ────────────── 
     1. Capture card bounds
     2. Clone image to body
     3. Animate clone to 100vh bounds
     4. Fade to black & swap views
     5. Fade in venue under the clone, then remove clone
  ── */
  function handleCardClick(event) {
    const card = event.currentTarget;
    const imageWrap = card.querySelector('.k-card__image-wrap');
    const sourceImage = card.querySelector('.k-card__image');
    
    if (!imageWrap || !sourceImage || isTransitioning) return;

    // Record implicit click telemetry to the Taste Engine
    const feedItem = card.closest('.k-feed-item');
    if (feedItem) {
      const atmosphere = feedItem.getAttribute('data-atmosphere');
      if (atmosphere && window.KorantisTaste) {
        window.KorantisTaste.recordClick(atmosphere);
      }
    }

    if (prefersReducedMotion) {
      transitionToView(viewVenue);
      return;
    }
    
    isTransitioning = true;

    // Save scroll state
    scrollMemory[viewSearch.id] = viewSearch.scrollTop;

    // FIRST: Measure source
    const rect = imageWrap.getBoundingClientRect();

    // Create Clone
    const clone = document.createElement('img');
    clone.src = sourceImage.src;
    clone.classList.add('k-flip-clone');
    
    // Set initial bounds
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.borderRadius = window.getComputedStyle(imageWrap).borderRadius;
    
    document.body.appendChild(clone);

    // Hide original image momentarily to prevent duplicate visual
    sourceImage.style.opacity = '0';

    // Fade surrounding feed into black immediately
    viewSearch.style.transition = 'opacity 800ms var(--k-ease-cinematic)';
    viewSearch.style.opacity = '0';
    globalNav.style.opacity = '0';

    // PLAY: Animate clone to fullscreen hero bounds
    requestAnimationFrame(() => {
      // Force reflow
      clone.getBoundingClientRect();
      
      // Destination bounds (100vh)
      clone.style.top = '0px';
      clone.style.left = '0px';
      clone.style.width = '100vw';
      clone.style.height = '100vh';
      clone.style.borderRadius = '0px';

      // After expansion finishes (1200ms)
      setTimeout(() => {
        // Prepare Venue View
        viewSearch.classList.remove('k-view--active');
        viewSearch.style.opacity = ''; // Reset inline style
        sourceImage.style.opacity = ''; // Reset inline style
        
        viewVenue.classList.add('k-view--active');
        viewVenue.scrollTop = 0; // Always start venue at top

        // Update the hero image in the venue view to match the clicked card
        const venueHeroImage = document.getElementById('hero-parallax');
        const heroName = document.querySelector('.k-venue-hero__name');
        const heroLoc = document.querySelector('.k-venue-hero__location');
        const heroTag = document.querySelector('.k-venue-hero__insight');

        if (venueHeroImage) venueHeroImage.src = sourceImage.src;
        if (heroName) heroName.textContent = card.querySelector('.k-card__name').textContent;
        if (heroLoc) heroLoc.textContent = card.querySelector('.k-card__location').textContent;
        if (heroTag) heroTag.textContent = card.querySelector('.k-card__tagline').textContent;

        currentView = viewVenue;
        globalNav.style.opacity = ''; // Restore nav

        // Remove clone smoothly
        clone.style.opacity = '0';
        setTimeout(() => {
          clone.remove();
          isTransitioning = false;
        }, 600);

      }, 1200);
    });
  }


  /* ── Event Listeners ──────────────────────────── */
  
  function bindEvents() {
    // Bind cards in search feed to transition to venue
    const cards = document.querySelectorAll('#view-search .k-card');
    cards.forEach(card => {
      card.addEventListener('click', handleCardClick);
    });

    // Bind back button in venue view to return to search
    const backBtn = document.getElementById('venue-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior if it's an <a>
        transitionToView(viewSearch);
      });
    }

    // Bind global navigation tabs
    const navItems = document.querySelectorAll('.k-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetId = item.getAttribute('data-target');
        const targetView = document.getElementById(targetId);
        if (targetView && targetView !== currentView) {
          // Update active states
          navItems.forEach(n => n.classList.remove('is-active'));
          item.classList.add('is-active');
          transitionToView(targetView);
        }
      });
    });

    // Global Nav behavior (Velocity Aware)
    let scrollTimeout;
    const views = document.querySelectorAll('.k-view');
    
    views.forEach(view => {
      let lastScroll = view.scrollTop;
      
      view.addEventListener('scroll', () => {
        if (prefersReducedMotion) return;
        
        const currentScroll = view.scrollTop;
        const velocity = Math.abs(currentScroll - lastScroll);
        
        // Hide on fast scroll
        if (velocity > 15) {
          globalNav.classList.add('is-hidden');
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          // Restore on pause
          globalNav.classList.remove('is-hidden');
        }, 400);

        lastScroll = currentScroll;
      }, { passive: true });
    });
  }

  /* ── Viewport & Dwell Telemetry Tracking ─────────── */
  function initViewportTracking() {
    if (!window.IntersectionObserver) return;

    const feedItems = document.querySelectorAll('#view-search .k-feed-item');
    const entryTimes = new Map();

    const observerOptions = {
      root: viewSearch,
      threshold: 0.6 // Card must be 60% visible to qualify as "viewed"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const item = entry.target;
        const atmosphere = item.getAttribute('data-atmosphere');
        if (!atmosphere) return;

        if (entry.isIntersecting) {
          // Card entered the viewport
          entryTimes.set(item, performance.now());
        } else {
          // Card left the viewport
          if (entryTimes.has(item)) {
            const entryTime = entryTimes.get(item);
            const dwellTime = performance.now() - entryTime;
            entryTimes.delete(item);

            // 1. Scroll Pass-Through: Scrolled past in under 800ms
            if (dwellTime < 800) {
              if (window.KorantisTaste) {
                window.KorantisTaste.recordPassThrough(atmosphere);
              }
            } 
            // 2. Graded Dwell: Viewed for 2 seconds or longer
            else if (dwellTime >= 2000) {
              if (window.KorantisTaste) {
                window.KorantisTaste.recordDwell(atmosphere, dwellTime);
              }
            }
          }
        }
      });
    }, observerOptions);

    feedItems.forEach(item => observer.observe(item));
  }

  function init() {
    bindEvents();
    initViewportTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
