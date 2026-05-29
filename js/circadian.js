/* ═══════════════════════════════════════════════════════════
   KORANTIS — CIRCADIAN EMOTIONAL ENGINE
   Phase 2B · Atmospheric Drift
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. Configuration & Anchors ────────────────── */
  
  // The 6 emotional anchors across the 24h cycle
  const ANCHORS = [
    { id: 'late-night',  hour: 2.5,  ambient: [6, 5, 4],     opacity: 0.85, contrast: 0.8,  grain: 0.04, motion: 1.2, bias: 0.8 },
    { id: 'dawn',        hour: 6.5,  ambient: [25, 28, 30],  opacity: 0.5,  contrast: 0.85, grain: 0.02, motion: 1.0, bias: 0.5 },
    { id: 'morning',     hour: 9.5,  ambient: [240, 235, 225],opacity: 0.05, contrast: 1.0,  grain: 0.01, motion: 0.9, bias: 0.7 },
    { id: 'afternoon',   hour: 14.5, ambient: [201, 169, 110],opacity: 0.1,  contrast: 1.0,  grain: 0.01, motion: 1.0, bias: 0.4 },
    { id: 'golden-hour', hour: 18.0, ambient: [180, 80, 30], opacity: 0.25, contrast: 0.95, grain: 0.03, motion: 1.0, bias: 0.9 },
    { id: 'night',       hour: 21.5, ambient: [10, 8, 7],    opacity: 0.8,  contrast: 0.9,  grain: 0.05, motion: 1.1, bias: 0.9 }
  ];

  // Map atmosphere tags to peak hours for content choreography
  const ATMOSPHERE_PEAKS = {
    'late-night': 2.5,
    'dawn': 6.5,
    'morning': 9.5,
    'afternoon': 14.5,
    'golden-hour': 18.0,
    'night': 21.5
  };

  /* ── 2. State & Debugging ──────────────────────── */

  let debugMode = new URLSearchParams(window.location.search).get('debug') === 'circadian';
  let scrubTime = null;
  let isFrozen = false;
  let cycleInterval = null;

  /* ── 3. Math & Interpolation ───────────────────── */

  function lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  // Circular distance for hours (0-24)
  function timeDistance(h1, h2) {
    let diff = Math.abs(h1 - h2);
    return Math.min(diff, 24 - diff);
  }

  function getInterpolatedState(currentHour) {
    // Sort anchors by time
    let sorted = [...ANCHORS].sort((a, b) => a.hour - b.hour);
    
    let prev = sorted[sorted.length - 1]; // defaults to last anchor
    let next = sorted[0];

    // Find the bounding anchors
    for (let i = 0; i < sorted.length; i++) {
      if (currentHour < sorted[i].hour) {
        next = sorted[i];
        prev = i === 0 ? sorted[sorted.length - 1] : sorted[i - 1];
        break;
      }
      if (i === sorted.length - 1) {
        prev = sorted[i];
        next = sorted[0];
      }
    }

    // Calculate normalized progress (t)
    let t = 0;
    if (prev.hour < next.hour) {
      t = (currentHour - prev.hour) / (next.hour - prev.hour);
    } else {
      // Wraparound past midnight
      let hoursFromPrev = currentHour >= prev.hour ? currentHour - prev.hour : (24 - prev.hour) + currentHour;
      let totalDiff = (24 - prev.hour) + next.hour;
      t = hoursFromPrev / totalDiff;
    }

    return {
      ambient: [
        lerp(prev.ambient[0], next.ambient[0], t),
        lerp(prev.ambient[1], next.ambient[1], t),
        lerp(prev.ambient[2], next.ambient[2], t)
      ],
      opacity: lerp(prev.opacity, next.opacity, t),
      contrast: lerp(prev.contrast, next.contrast, t),
      grain: lerp(prev.grain, next.grain, t),
      motion: lerp(prev.motion, next.motion, t),
      bias: lerp(prev.bias, next.bias, t)
    };
  }

  /* ── 4. Engine Application ─────────────────────── */

  function applyCircadianState(hour) {
    const state = getInterpolatedState(hour);
    const root = document.documentElement;

    // Apply CSS Variables softly
    root.style.setProperty('--k-ambient-r', Math.round(state.ambient[0]));
    root.style.setProperty('--k-ambient-g', Math.round(state.ambient[1]));
    root.style.setProperty('--k-ambient-b', Math.round(state.ambient[2]));
    root.style.setProperty('--k-ambient-opacity', state.opacity.toFixed(3));
    root.style.setProperty('--k-text-contrast', state.contrast.toFixed(3));
    root.style.setProperty('--k-grain-intensity', state.grain.toFixed(3));
    root.style.setProperty('--k-motion-scale', state.motion.toFixed(3));
    root.style.setProperty('--k-feed-bias-strength', state.bias.toFixed(3));

    // Update debug HUD if active
    if (debugMode) {
      updateDebugHUD(hour, state);
    }

    // Choreograph feed
    applyFeedChoreography(hour, state.bias);
  }

  /* ── 5. Content Choreography ───────────────────── */

  function applyFeedChoreography(currentHour, biasStrength) {
    const feedItems = document.querySelectorAll('#view-search .k-feed-item');
    if (feedItems.length === 0) return;

    // Delegate to Phase 2C Unified Ranking Engine if active
    if (window.KorantisRanking) {
      const intentVector = window.KorantisSearchIntent ? window.KorantisSearchIntent.getActiveIntent() : null;
      window.KorantisRanking.rankFeed(feedItems, currentHour, intentVector);
      return;
    }
    
    // Fallback: Phase 2B Simple Circular Time Reordering
    feedItems.forEach(item => {
      const atmosphere = item.getAttribute('data-atmosphere');
      if (!atmosphere || !ATMOSPHERE_PEAKS[atmosphere]) return;

      const peakTime = ATMOSPHERE_PEAKS[atmosphere];
      const dist = timeDistance(currentHour, peakTime);
      let affinityScore = 12 - dist;
      let orderValue = 100 - (affinityScore * 8 * biasStrength);
      
      item.element ? item.element.style.order = Math.round(orderValue) : item.style.order = Math.round(orderValue);
      item.style.transition = 'order 0s';
    });
  }

  /* ── 6. Cycle Runner ───────────────────────────── */

  function runCycle() {
    if (isFrozen) return;

    let date = new Date();
    let currentHour = scrubTime !== null ? scrubTime : date.getHours() + (date.getMinutes() / 60);
    
    applyCircadianState(currentHour);
  }

  function startEngine() {
    runCycle(); // Run immediately
    cycleInterval = setInterval(runCycle, 60000); // Update every 60 seconds
  }

  /* ── 7. Debug HUD ──────────────────────────────── */

  function initDebugMode() {
    if (!debugMode) return;

    const hud = document.createElement('div');
    hud.className = 'k-circadian-debug';
    hud.innerHTML = `
      <div class="k-circadian-debug-header">
        <span>Circadian Engine</span>
        <button class="k-circadian-debug-freeze" id="circ-freeze">FREEZE</button>
      </div>
      <div>
        <label>Time: <span id="circ-time-val">--</span>h</label>
        <input type="range" id="circ-scrubber" min="0" max="24" step="0.1" value="12">
      </div>
      <div id="circ-vars" style="margin-top:8px; opacity:0.7"></div>
    `;
    document.body.appendChild(hud);

    const scrubber = document.getElementById('circ-scrubber');
    const freezeBtn = document.getElementById('circ-freeze');

    // Init slider to current real time
    let d = new Date();
    scrubber.value = d.getHours() + (d.getMinutes() / 60);

    scrubber.addEventListener('input', (e) => {
      scrubTime = parseFloat(e.target.value);
      runCycle();
    });

    freezeBtn.addEventListener('click', () => {
      isFrozen = !isFrozen;
      freezeBtn.classList.toggle('is-frozen', isFrozen);
    });
  }

  function updateDebugHUD(hour, state) {
    const timeVal = document.getElementById('circ-time-val');
    const varsVal = document.getElementById('circ-vars');
    
    if (timeVal) {
      let h = Math.floor(hour);
      let m = Math.floor((hour - h) * 60);
      timeVal.textContent = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    }

    if (varsVal) {
      varsVal.innerHTML = `
        glow: rgba(${Math.round(state.ambient[0])}, ${Math.round(state.ambient[1])}, ${Math.round(state.ambient[2])}, ${state.opacity.toFixed(2)})<br>
        contrast: ${state.contrast.toFixed(2)}<br>
        grain: ${state.grain.toFixed(3)}<br>
        bias: ${state.bias.toFixed(2)}
      `;
    }
  }


  /* ── Initialization ────────────────────────────── */

  // Expose global circadian accessors
  window.KorantisCircadian = {
    getCurrentHour: () => {
      let date = new Date();
      return scrubTime !== null ? scrubTime : date.getHours() + (date.getMinutes() / 60);
    },
    triggerRankingUpdate: () => {
      let date = new Date();
      let currentHour = scrubTime !== null ? scrubTime : date.getHours() + (date.getMinutes() / 60);
      const feedItems = document.querySelectorAll('#view-search .k-feed-item');
      if (window.KorantisRanking && feedItems.length > 0) {
        const intentVector = window.KorantisSearchIntent ? window.KorantisSearchIntent.getActiveIntent() : null;
        window.KorantisRanking.rankFeed(feedItems, currentHour, intentVector);
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initDebugMode();
      startEngine();
    });
  } else {
    initDebugMode();
    startEngine();
  }

})();
