/* ═══════════════════════════════════════════════════════════
   KORANTIS — LATENT TASTE VECTOR ENGINE
   Phase 2C · Perceptual Personalization
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. Coordinate Taxonomy & Dimensionality ───────────── */
  
  // The 8-dimensional continuous perceptual coordinate system
  const DIMENSION_LABELS = {
    0: 'Solitude vs. Sociality',          // -1 = Intimate, quiet corners | +1 = Buzzing, social groups
    1: 'Restraint vs. Raw Authenticity',  // -1 = Minimal luxury/design | +1 = Unpolished, organic edge
    2: 'Intellect vs. Warm Sensuality',   // -1 = Cool, stark galleries  | +1 = Warm, romantic mood
    3: 'Sunlight vs. Amber Enclosure',    // -1 = Airy glass pavilions   | +1 = Dark, basement retreats
    4: 'Fast Ritual vs. Slow Pause',      // -1 = Quick espresso bars    | +1 = Multi-hour lingering
    5: 'Urban Edge vs. Nature Infusion',  // -1 = Concrete rooftops      | +1 = Lush garden sanctuaries
    6: 'Minimal Clarity vs. Layering',    // -1 = Pure Nordic/Japanese   | +1 = Maximalist/vintage clutter
    7: 'Nostalgia vs. Avant-Garde'        // -1 = Historic, classical    | +1 = Experimental concept spaces
  };

  // Predefined atmospheric vectors corresponding to the existing circadian data tags
  const ATMOSPHERE_VECTORS = {
    'morning':     [ 0.8, -0.3, -0.4,  0.8,  0.6, -0.2, -0.7, -0.4 ], // Solo, clean design, bright sunlight, focus
    'afternoon':   [ 0.2,  0.1,  0.1,  0.5,  0.2,  0.4,  0.1,  0.1 ], // Balanced, daylight, slow pause, botanical
    'golden-hour': [ 0.0,  0.6,  0.5,  0.2, -0.3,  0.6,  0.3,  0.3 ], // Social, warm ambers, sunset views, lingering
    'night':       [-0.7,  0.8,  0.8, -0.7, -0.6, -0.4,  0.5,  0.6 ], // Intimate, heavy shadow, romantic sensory warmness
    'late-night':  [-0.9,  0.5,  0.9, -0.9, -0.8, -0.6,  0.4,  0.7 ], // Deep solitude, enclosed intimacy, shadow, nostalgic
    'dawn':        [-0.4, -0.5, -0.2,  0.3,  0.8,  0.2, -0.5, -0.5 ]  // Silent clarity, cold contrast, fresh morning ritual
  };

  /* ── 2. Configuration Parameters ─────────────────── */
  
  const LOCAL_STORAGE_KEY = 'k_latent_taste_baseline';
  const TRANSIENT_HALF_LIFE_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  const DECAY_DECAY_RATE = Math.log(2) / TRANSIENT_HALF_LIFE_MS; // Exponential decay lambda

  // Interaction updates learning rates
  const LEARNING_RATES = {
    click: 0.15,
    dwell: 0.05,
    pass:  0.02
  };

  /* ── 3. Internal State ───────────────────────────── */

  let baselineTaste = [0, 0, 0, 0, 0, 0, 0, 0]; // Neutrally initialized baseline
  let transientTaste = [0, 0, 0, 0, 0, 0, 0, 0]; // Real-time session-drift vector
  let lastUpdateTime = Date.now();
  let debugPanelCallback = null;

  /* ── 4. Storage & Synchronization ────────────────── */

  function loadTaste() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        baselineTaste = JSON.parse(stored);
        if (!Array.isArray(baselineTaste) || baselineTaste.length !== 8) {
          throw new Error('Invalid baseline dimensions');
        }
      } else {
        // Initialize fresh baseline to neutral
        baselineTaste = [0, 0, 0, 0, 0, 0, 0, 0];
      }
    } catch (e) {
      console.warn('TasteEngine: Unable to read baseline, resetting to neutral.', e);
      baselineTaste = [0, 0, 0, 0, 0, 0, 0, 0];
    }
    // Transient starts strictly synchronized to baseline on session load
    transientTaste = [...baselineTaste];
    lastUpdateTime = Date.now();
  }

  function saveTaste() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baselineTaste));
    } catch (e) {
      console.warn('TasteEngine: LocalStorage save blocked.', e);
    }
  }

  /* ── 5. Vector Mathematical Logic ────────────────── */

  // Vector attraction/repulsion helper
  function driftVector(source, target, learningRate, positive = true) {
    return source.map((val, idx) => {
      const diff = target[idx] - val;
      const step = learningRate * diff;
      const nextVal = positive ? val + step : val - (step * 0.5); // Repulsion is milder
      // Keep strictly bounded between [-1.0, 1.0]
      return Math.max(-1.0, Math.min(1.0, nextVal));
    });
  }

  // Calculate exponential transient decay back to baseline
  function applyDecay() {
    const now = Date.now();
    const timeDelta = now - lastUpdateTime;
    if (timeDelta <= 0) return;

    const decayFactor = Math.exp(-DECAY_DECAY_RATE * timeDelta);

    transientTaste = transientTaste.map((transVal, idx) => {
      const baseVal = baselineTaste[idx];
      return baseVal + decayFactor * (transVal - baseVal);
    });

    lastUpdateTime = now;
    notifyDebugHUD();
  }

  /* ── 6. Public Telemetry Endpoints ───────────────── */

  // Triggered when a user clicks / expands a card
  function recordClick(atmosphere) {
    applyDecay(); // Catch up decay before drifting
    const target = ATMOSPHERE_VECTORS[atmosphere];
    if (!target) return;

    // Shift transient taste toward venue atmosphere
    transientTaste = driftVector(transientTaste, target, LEARNING_RATES.click, true);
    
    // Baselines are updated in micro-doses on click (10% of click rate) to reflect slow preference alignment
    baselineTaste = driftVector(baselineTaste, target, LEARNING_RATES.click * 0.1, true);
    
    saveTaste();
    notifyDebugHUD();
    console.log(`TasteEngine: Click interaction recorded on [${atmosphere}]. Transient drifted.`);
  }

  // Triggered when a user spends dwell time on a card
  function recordDwell(atmosphere, durationMs) {
    applyDecay();
    const target = ATMOSPHERE_VECTORS[atmosphere];
    if (!target || durationMs < 2000) return; // Ignore accidental hover (< 2 seconds)

    // Graded dwell reward: log-linear scale
    const deltaSeconds = (durationMs - 2000) / 1000;
    const dwellReward = Math.log(1 + deltaSeconds);
    const dynamicRate = Math.min(0.12, LEARNING_RATES.dwell * dwellReward);

    transientTaste = driftVector(transientTaste, target, dynamicRate, true);
    
    // Slow baseline reinforcement on sustained dwell
    if (durationMs > 8000) {
      baselineTaste = driftVector(baselineTaste, target, 0.005, true);
      saveTaste();
    }

    notifyDebugHUD();
    console.log(`TasteEngine: Dwell interaction (${(durationMs/1000).toFixed(1)}s) recorded on [${atmosphere}].`);
  }

  // Triggered when a user scrolls rapidly past a card
  function recordPassThrough(atmosphere) {
    applyDecay();
    const target = ATMOSPHERE_VECTORS[atmosphere];
    if (!target) return;

    // Apply transient repulsion away from the ignored atmosphere
    transientTaste = driftVector(transientTaste, target, LEARNING_RATES.pass, false);

    notifyDebugHUD();
    console.log(`TasteEngine: Fast pass-through recorded on [${atmosphere}]. Repulsion drift applied.`);
  }

  // Force reset baseline and transient back to neutral
  function resetTaste() {
    baselineTaste = [0, 0, 0, 0, 0, 0, 0, 0];
    transientTaste = [0, 0, 0, 0, 0, 0, 0, 0];
    lastUpdateTime = Date.now();
    saveTaste();
    notifyDebugHUD();
    console.log('TasteEngine: User profile reset to neutral baseline.');
  }

  /* ── 7. Debug Utilities ──────────────────────────── */

  function registerDebugCallback(callback) {
    debugPanelCallback = callback;
    notifyDebugHUD();
  }

  function renderTasteRadar() {
    const canvas = document.getElementById('taste-radar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 35; // padding

    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const rings = 4;
    for (let i = 1; i <= rings; i++) {
      const r = (radius / rings) * i;
      ctx.beginPath();
      for (let j = 0; j <= 8; j++) {
        const angle = (Math.PI * 2 / 8) * j - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.stroke();

      // Labels
      const labelRadius = radius + 20;
      const labelX = centerX + Math.cos(angle) * labelRadius;
      const labelY = centerY + Math.sin(angle) * labelRadius;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = DIMENSION_LABELS[i].split(' vs. ');
      ctx.fillText(label[1], labelX, labelY - 6);
      ctx.fillText(label[0], labelX, labelY + 6);
    }

    function drawPolygon(vector, color, fill) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i - Math.PI / 2;
        const val = (vector[i] + 1) / 2; // Map [-1, 1] to [0, 1]
        const r = val * radius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawPolygon(baselineTaste, 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.05)');
    drawPolygon(transientTaste, '#c8956c', 'rgba(201, 169, 110, 0.2)');
  }

  function notifyDebugHUD() {
    renderTasteRadar(); // Render visual taste radar in profile view
    if (debugPanelCallback) {
      debugPanelCallback({
        baseline: [...baselineTaste],
        transient: [...transientTaste],
        labels: DIMENSION_LABELS
      });
    }
  }

  /* ── 8. Dynamic Taste Debug Panel ───────────────── */
  function initTasteDebugHUD() {
    const isDebug = new URLSearchParams(window.location.search).get('debug') === 'circadian' || new URLSearchParams(window.location.search).get('debug') === 'taste';
    if (!isDebug) return;

    // Create container
    const panel = document.createElement('div');
    panel.className = 'k-taste-debug';
    panel.style.cssText = `
      position: fixed;
      bottom: 12px;
      right: 12px;
      z-index: 10000;
      width: 280px;
      background: rgba(10, 10, 10, 0.85);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 14px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-family: monospace;
      font-size: 10px;
      color: #fff;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      opacity: 0.85;
      transition: opacity 0.3s;
    `;
    panel.addEventListener('mouseenter', () => panel.style.opacity = '1.0');
    panel.addEventListener('mouseleave', () => panel.style.opacity = '0.85');

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
        <span style="font-weight:bold; color:var(--k-gold, #c8956c);">Taste Engine Profile</span>
        <button id="taste-reset-btn" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:2px 6px; border-radius:4px; cursor:pointer; font-size:9px;">RESET</button>
      </div>
      <div id="taste-dimensions" style="display:flex; flex-direction:column; gap:6px;"></div>
    `;

    document.body.appendChild(panel);

    const resetBtn = document.getElementById('taste-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetTaste();
        if (window.KorantisCircadian) {
          window.KorantisCircadian.triggerRankingUpdate();
        }
      });
    }

    // Register our callback to update this visual panel dynamically
    registerDebugCallback((data) => {
      const container = document.getElementById('taste-dimensions');
      if (!container) return;

      container.innerHTML = '';
      for (let i = 0; i < 8; i++) {
        const valTrans = data.transient[i];
        const valBase = data.baseline[i];
        const label = data.labels[i];

        // Map values from [-1.0, 1.0] to slider percentage [0%, 100%]
        const pctTrans = ((valTrans + 1) / 2) * 100;
        const pctBase = ((valBase + 1) / 2) * 100;

        const dimRow = document.createElement('div');
        dimRow.style.cssText = `display:flex; flex-direction:column; gap:2px;`;
        dimRow.innerHTML = `
          <div style="display:flex; justify-content:space-between; opacity:0.8; font-size:9px;">
            <span>${label}</span>
            <span style="color:var(--k-gold, #c8956c)">${valTrans.toFixed(2)}</span>
          </div>
          <div style="position:relative; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:visible; margin:2px 0;">
            <!-- Center Line -->
            <div style="position:absolute; left:50%; top:0; height:100%; width:1px; background:rgba(255,255,255,0.2);"></div>
            <!-- Baseline Indicator (tick) -->
            <div style="position:absolute; left:${pctBase}%; top:-2px; height:8px; width:2px; background:#fff; border-radius:1px; z-index:2;" title="Baseline: ${valBase.toFixed(2)}"></div>
            <!-- Transient Indicator (glow bar) -->
            <div style="position:absolute; left:${Math.min(pctTrans, 50)}%; top:0; height:100%; width:${Math.abs(pctTrans - 50)}%; background:rgba(200, 149, 108, 0.4); z-index:1;"></div>
            <div style="position:absolute; left:${pctTrans}%; top:-3px; height:10px; width:4px; background:var(--k-gold, #c8956c); border-radius:2px; z-index:3; transform:translateX(-50%); box-shadow:0 0 8px var(--k-gold, #c8956c);" title="Transient: ${valTrans.toFixed(2)}"></div>
          </div>
        `;
        container.appendChild(dimRow);
      }

      // Update scoring breakdown badges on cards
      updateCardHUDLabels();
    });
  }

  function updateCardHUDLabels() {
    const cards = document.querySelectorAll('#view-search .k-feed-item');
    cards.forEach(card => {
      let badge = card.querySelector('.k-debug-score-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'k-debug-score-badge';
        badge.style.cssText = `
          position: absolute;
          bottom: 12px;
          right: 12px;
          z-index: 10;
          background: rgba(10, 10, 10, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 8px;
          color: rgba(255, 255, 255, 0.7);
          pointer-events: none;
        `;
        const article = card.querySelector('.k-card');
        if (article) {
          article.style.position = 'relative';
          article.appendChild(badge);
        }
      }

      // Read score attributes dynamically populated by ranking.js
      const scoreFinal = card.dataset.scoreFinal || '0.500';
      const scoreC = card.dataset.scoreC || '0.50';
      const scoreT = card.dataset.scoreT || '0.50';
      const scoreI = card.dataset.scoreI || '0.00';
      const scoreX = card.dataset.scoreX || '0.50';

      badge.innerHTML = `
        <span style="color:var(--k-gold, #c8956c); font-weight:bold;">S: ${scoreFinal}</span> | 
        <span>C:${scoreC}</span> | 
        <span>T:${scoreT}</span> | 
        <span>I:${scoreI}</span> | 
        <span>X:${scoreX}</span>
      `;
    });
  }

  /* ── 9. Initialization ───────────────────────────── */

  loadTaste();

  // Run the decay heartbeat calculation every 60 seconds
  setInterval(applyDecay, 60000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTasteDebugHUD();
    });
  } else {
    initTasteDebugHUD();
  }

  // Export globally as window.KorantisTaste
  window.KorantisTaste = {
    getTransientVector: () => { applyDecay(); return [...transientTaste]; },
    getBaselineVector:  () => [...baselineTaste],
    getAtmosphereVector: (atm) => ATMOSPHERE_VECTORS[atm] ? [...ATMOSPHERE_VECTORS[atm]] : null,
    recordClick,
    recordDwell,
    recordPassThrough,
    resetTaste,
    registerDebugCallback
  };

})();
