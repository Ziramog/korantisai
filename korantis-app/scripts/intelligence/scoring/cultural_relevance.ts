import { clampScore, weightedAverage } from './utils';

export type CulturalRelevanceInput = {
  reviewCount: number;
  rating?: number | null;
  sourceAuthorityScore?: number;
  heritageSignal?: number;
  landmarkSignal?: number;
};

export function reviewCountLogScore(reviewCount: number): number {
  const safeCount = Math.max(0, reviewCount);
  const maxReference = Math.log10(50000 + 1);
  return clampScore((Math.log10(safeCount + 1) / maxReference) * 100);
}

export function ratingQualityScore(rating: number | null | undefined): number {
  if (rating == null || rating <= 0) return 0;
  if (rating < 3.5) return clampScore((rating / 3.5) * 40);
  return clampScore(40 + ((Math.min(rating, 5) - 3.5) / 1.5) * 60);
}

export function culturalRelevanceScore(input: CulturalRelevanceInput): number {
  const reviewScore = reviewCountLogScore(input.reviewCount);
  const ratingScore = ratingQualityScore(input.rating);
  const sourceScore = input.sourceAuthorityScore ?? 0;
  const heritageBoost = Math.max(input.heritageSignal ?? 0, input.landmarkSignal ?? 0);

  return weightedAverage([
    [reviewScore, 0.45],
    [sourceScore, 0.25],
    [heritageBoost, 0.20],
    [ratingScore, 0.10],
  ]);
}
