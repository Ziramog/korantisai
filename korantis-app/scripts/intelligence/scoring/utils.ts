export function clampScore(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function weightedAverage(parts: Array<[number, number]>) {
  const totalWeight = parts.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) return 0;
  return clampScore(parts.reduce((sum, [score, weight]) => sum + score * weight, 0) / totalWeight);
}

export function maxScore(...values: number[]) {
  return clampScore(Math.max(...values));
}
