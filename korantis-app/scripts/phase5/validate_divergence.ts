import * as fs from 'fs';
import * as path from 'path';

function cosineSimilarity(A: number[], B: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const EMBEDDINGS_FILE = path.join(__dirname, '..', '..', 'data', 'embeddings.json');
const REPORT_FILE = path.join(__dirname, '..', '..', 'data', 'divergence_report.md');

type VenueEmbeddingRecord = {
  venueName: string;
  l2Vector: number[];
  l3Vector: number[];
  l2Text: string;
  l3Text: string;
};

type DivergenceResult = VenueEmbeddingRecord & {
  venueId: string;
  similarity: number;
};

async function main() {
  if (!fs.existsSync(EMBEDDINGS_FILE)) {
    console.error(`Embeddings file not found: ${EMBEDDINGS_FILE}`);
    process.exit(1);
  }

  const embeddingsData = JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, 'utf-8')) as Record<string, VenueEmbeddingRecord>;
  const results: DivergenceResult[] = [];

  for (const [venueId, data] of Object.entries(embeddingsData)) {
    const similarity = cosineSimilarity(data.l2Vector, data.l3Vector);
    results.push({
      venueId,
      venueName: data.venueName,
      similarity,
      l2Text: data.l2Text,
      l3Text: data.l3Text,
      l2Vector: data.l2Vector,
      l3Vector: data.l3Vector
    });
  }

  // Sort by similarity descending (highest agreement first)
  results.sort((a, b) => b.similarity - a.similarity);

  const similarities = results.map(r => r.similarity);
  const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length || 0;
  
  const mid = Math.floor(similarities.length / 2);
  const medianSim = similarities.length % 2 !== 0 ? similarities[mid] : (similarities[mid - 1] + similarities[mid]) / 2;
  
  const highAlign = results.filter(r => r.similarity >= 0.75).length;
  const partialAlign = results.filter(r => r.similarity >= 0.50 && r.similarity < 0.75).length;
  const diverged = results.filter(r => r.similarity < 0.50).length;

  let report = `# Phase 5.1 Validation: Layer 2 vs Layer 3 Divergence Report\n\n`;
  report += `This report compares the **Layer 2** (Human Curatorial) embeddings against the **Layer 3** (Semantic Extraction from Reviews) embeddings using Cosine Similarity.\n\n`;
  
  report += `## Distribution Summary\n\n`;
  report += `- **Total Venues Analyzed:** ${results.length}\n`;
  report += `- **Average Similarity:** ${avgSim.toFixed(4)}\n`;
  report += `- **Median Similarity:** ${medianSim.toFixed(4)}\n\n`;
  
  report += `### Alignment Clusters\n`;
  report += `- **High Alignment (> 0.75):** ${highAlign} venues\n`;
  report += `- **Partial Alignment (0.50 - 0.75):** ${partialAlign} venues\n`;
  report += `- **Diverged (< 0.50):** ${diverged} venues\n\n`;

  if (results.length > 0) {
    report += `### Extremes\n`;
    report += `- **Highest Similarity:** ${results[0].venueName} (${results[0].similarity.toFixed(4)})\n`;
    report += `- **Lowest Similarity:** ${results[results.length - 1].venueName} (${results[results.length - 1].similarity.toFixed(4)})\n\n`;
  }

  report += `## Venue Analysis\n\n`;
  
  for (const r of results) {
    let status = '🟢 Aligned';
    if (r.similarity < 0.50) status = '🔴 Diverged';
    else if (r.similarity < 0.75) status = '🟡 Partial';

    report += `### ${r.venueName} — ${status} (Score: ${r.similarity.toFixed(4)})\n\n`;
    report += `**Layer 2 (Curatorial Voice & Tagline):**\n> ${r.l2Text}\n\n`;
    report += `**Layer 3 (Atmospheric Prose from Reviews):**\n> ${r.l3Text}\n\n`;
    
    // Auto-generate some divergence notes based on score threshold
    report += `**Divergence Notes:**\n`;
    if (r.similarity >= 0.75) {
      report += `Strong convergence. The crowd's language mirrors the curator's atmospheric intent.\n`;
    } else if (r.similarity >= 0.50) {
      report += `Partial alignment. The general energy matches, but certain sensory or temporal nuances present in the reviews may not exist in the curated priors, or vice versa.\n`;
    } else {
      report += `Significant divergence. The way users describe this space functionally or emotionally conflicts with the curated identity. Recommend human audit of the L2 vector.\n`;
    }
    
    report += `\n---\n\n`;
  }

  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`\nValidation complete. Report written to ${REPORT_FILE}`);
}

main().catch(console.error);
