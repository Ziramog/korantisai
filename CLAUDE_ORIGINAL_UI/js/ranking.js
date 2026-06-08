/* ═══════════════════════════════════════════════════════════
   KORANTIS — UNIFIED RANKING ENGINE
   Phase 2C · Perceptual Ranking
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. Architectural Weights & Config ─────────────────── */

  // Dynamic weight sets for the different interface focus states
  const SCORING_WEIGHTS = {
    passive: {
      circadian: 0.40,
      taste:     0.40,
      intent:    0.00,
      context:   0.20
    },
    activeSearch: {
      circadian: 0.10,
      taste:     0.20,
      intent:    0.60,
      context:   0.10
    }
  };

  // Peak times for circadian score calculations (aligned with js/circadian.js)
  const ATMOSPHERE_PEAKS = {
    'late-night': 2.5,
    'dawn': 6.5,
    'morning': 9.5,
    'afternoon': 14.5,
    'golden-hour': 18.0,
    'night': 21.5
  };

  /* ── 2. Vector Mathematics & Similarity ────────────────── */

  // Calculates the cosine similarity between two 8D vectors
  function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0.0;

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    // Handle zero-magnitude edge cases to prevent division by zero
    if (normA === 0.0 || normB === 0.0) return 0.0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Circular hour distance between h1 and h2 (bounds distance to max 12 hours)
  function circularTimeDistance(h1, h2) {
    const diff = Math.abs(h1 - h2);
    return Math.min(diff, 24 - diff);
  }

  /* ── 3. Conceptual Score Calculations ─────────────────── */

  function computeCircadianScore(atmosphere, currentHour) {
    const peakHour = ATMOSPHERE_PEAKS[atmosphere];
    if (peakHour === undefined) return 0.5; // Neutral default

    const dist = circularTimeDistance(currentHour, peakHour);
    // 1.0 represents perfect timing match, 0.0 is exact polar opposite (12h distance)
    return 1.0 - (dist / 12.0);
  }

  function computeTasteScore(atmosphere) {
    if (!window.KorantisTaste) return 0.5;

    const userVector = window.KorantisTaste.getTransientVector();
    const venueVector = window.KorantisTaste.getAtmosphereVector(atmosphere);

    if (!venueVector) return 0.5;

    const similarity = cosineSimilarity(userVector, venueVector);
    // Map cosine output [-1.0, 1.0] to a normalized positive score range [0.0, 1.0]
    return (similarity + 1.0) / 2.0;
  }

  function computeIntentScore(atmosphere, activeIntentVector) {
    if (!activeIntentVector) return 0.0;

    const venueVector = window.KorantisTaste.getAtmosphereVector(atmosphere);
    if (!venueVector) return 0.0;

    const similarity = cosineSimilarity(activeIntentVector, venueVector);
    // Map cosine output [-1.0, 1.0] to normalized positive score [0.0, 1.0]
    return (similarity + 1.0) / 2.0;
  }

  function computeContextScore(venueElement) {
    // Conceptual score for layout spacing, novelty boosting, or structural priority
    // Keeps a stable baseline to allow high-vibe items to float up naturally
    const qualityScore = parseFloat(venueElement.getAttribute('data-quality') || '0.5');
    return qualityScore;
  }

  /* ── 4. Unified Scoring & Feed Choreography ───────────── */

  function rankFeed(feedItems, activeHour, activeIntentVector = null) {
    if (!feedItems || feedItems.length === 0) return;

    // Select the active weight state based on query presence
    const activeWeights = activeIntentVector ? SCORING_WEIGHTS.activeSearch : SCORING_WEIGHTS.passive;

    const scoredItems = [];

    feedItems.forEach((item, index) => {
      const atmosphere = item.getAttribute('data-atmosphere');
      if (!atmosphere) return;

      // 1. Compute distinct sub-scores
      const cScore = computeCircadianScore(atmosphere, activeHour);
      const tScore = computeTasteScore(atmosphere);
      const iScore = computeIntentScore(atmosphere, activeIntentVector);
      const xScore = computeContextScore(item);

      // 2. Linear combination of weighted components
      const finalScore = (
        activeWeights.circadian * cScore +
        activeWeights.taste     * tScore +
        activeWeights.intent    * iScore +
        activeWeights.context   * xScore
      );

      scoredItems.push({
        element: item,
        score: finalScore,
        originalIndex: index, // Tie-breaker to maintain baseline DOM stability
        breakdown: { cScore, tScore, iScore, xScore }
      });
    });

    // 3. Sort items descending by unified score, falling back to original DOM index
    scoredItems.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.0001) {
        return a.originalIndex - b.originalIndex; // Stable sorting
      }
      return b.score - a.score;
    });

    // 4. Map the sorted list to CSS Flexbox orders
    // Flexbox order ranges from 0 to N. Top score gets order = 0.
    scoredItems.forEach((item, rank) => {
      item.element.style.order = rank;
      
      // Cache score breakdown on the element for debug HUD inspection
      item.element.dataset.scoreFinal = item.score.toFixed(3);
      item.element.dataset.scoreC = item.breakdown.cScore.toFixed(3);
      item.element.dataset.scoreT = item.breakdown.tScore.toFixed(3);
      item.element.dataset.scoreI = item.breakdown.iScore.toFixed(3);
      item.element.dataset.scoreX = item.breakdown.xScore.toFixed(3);
    });

    console.log(`RankingEngine: Feed reordered using [${activeIntentVector ? 'Active Search' : 'Passive Discovery'}] weights.`);
  }

  /* ── 5. Initialization & Global API ──────────────── */

  // Export globally as window.KorantisRanking
  window.KorantisRanking = {
    rankFeed,
    cosineSimilarity,
    getAtmospherePeaks: () => ({ ...ATMOSPHERE_PEAKS }),
    getWeights: (mode) => SCORING_WEIGHTS[mode] ? { ...SCORING_WEIGHTS[mode] } : null
  };

})();
