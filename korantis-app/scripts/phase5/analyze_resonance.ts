import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });
import { OpenAI } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in environment.');
  process.exit(1);
}

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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
const REPORT_FILE = path.join(__dirname, '..', '..', 'data', 'resonance_report.md');
const ANALYSIS_FILE = path.join(__dirname, '..', '..', 'data', 'resonance_analysis.json');

async function analyzeResonance(l2Text: string, l3Text: string, venueName: string) {
  const prompt = `
Analyze these two atmospheric descriptions of the venue "${venueName}".

Layer 2 (Editorial Interpretation):
"${l2Text}"

Layer 3 (Observed Public Perception from reviews):
"${l3Text}"

Extract the underlying atmospheric themes from both. Identify where they overlap and where they diverge. Provide a brief interpretation of what this difference means for the venue's true identity. Keep notes concise and insightful.
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'layer_comparison',
        schema: {
          type: 'object',
          properties: {
            editorialThemes: { type: 'array', items: { type: 'string' }, description: "Key atmospheric themes from Layer 2" },
            crowdThemes: { type: 'array', items: { type: 'string' }, description: "Key atmospheric themes from Layer 3" },
            overlapThemes: { type: 'array', items: { type: 'string' }, description: "Themes present in both layers" },
            interpretationNotes: { type: 'string', description: "1-2 sentence interpretation of the resonance/divergence between the two perspectives" }
          },
          required: ['editorialThemes', 'crowdThemes', 'overlapThemes', 'interpretationNotes'],
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  const rawContent = response.choices[0].message.content;
  if (!rawContent) throw new Error('No content returned from OpenAI');

  return JSON.parse(rawContent);
}

async function main() {
  if (!fs.existsSync(EMBEDDINGS_FILE)) {
    console.error(`Embeddings file not found: ${EMBEDDINGS_FILE}`);
    process.exit(1);
  }

  const embeddingsData = JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, 'utf-8'));
  const results = [];
  
  // Load existing analysis cache to save API calls if re-running
  let analysisCache: Record<string, any> = {};
  if (fs.existsSync(ANALYSIS_FILE)) {
    analysisCache = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8'));
  }

  console.log("Starting Semantic Resonance Analysis...");

  for (const [venueId, data] of Object.entries(embeddingsData)) {
    const venueData = data as any;
    const similarity = cosineSimilarity(venueData.l2Vector, venueData.l3Vector);
    
    let comparison = analysisCache[venueId];
    if (!comparison) {
      console.log(`[ANALYZE] Generating qualitative comparison for ${venueData.venueName}...`);
      try {
        comparison = await analyzeResonance(venueData.l2Text, venueData.l3Text, venueData.venueName);
        analysisCache[venueId] = comparison;
        // Save incrementally
        fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(analysisCache, null, 2), 'utf-8');
      } catch (e: any) {
        console.error(`Error analyzing ${venueData.venueName}:`, e.message);
        comparison = {
          editorialThemes: [], crowdThemes: [], overlapThemes: [], interpretationNotes: "Analysis failed."
        };
      }
    }

    results.push({
      venueId,
      venueName: venueData.venueName,
      similarity,
      l2Text: venueData.l2Text,
      l3Text: venueData.l3Text,
      ...comparison
    });
  }

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);

  const similarities = results.map(r => r.similarity);
  const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length || 0;
  
  const mid = Math.floor(similarities.length / 2);
  const medianSim = similarities.length % 2 !== 0 ? similarities[mid] : (similarities[mid - 1] + similarities[mid]) / 2;
  
  const almostIdentical = results.filter(r => r.similarity >= 0.80).length;
  const strongResonance = results.filter(r => r.similarity >= 0.60 && r.similarity < 0.80).length;
  const partialResonance = results.filter(r => r.similarity >= 0.40 && r.similarity < 0.60).length;
  const differentInterpretation = results.filter(r => r.similarity >= 0.20 && r.similarity < 0.40).length;
  const extractionIssue = results.filter(r => r.similarity < 0.20).length;

  let report = `# Phase 5.1 Validation: Layer Resonance Report\n\n`;
  report += `This report analyzes the semantic resonance between **Layer 2 (Editorial Interpretation)** and **Layer 3 (Observed Public Perception)**.\n`;
  report += `Similarity measures *resonance*, not correctness. The primary goal is to extract qualitative insights from how the crowd experiences a space versus how the curator initially designed it.\n\n`;
  
  report += `## Distribution Summary\n\n`;
  report += `- **Total Venues Analyzed:** ${results.length}\n`;
  report += `- **Average Resonance:** ${avgSim.toFixed(4)}\n`;
  report += `- **Median Resonance:** ${medianSim.toFixed(4)}\n\n`;
  
  report += `### Resonance Clusters\n`;
  report += `- **Almost Identical Atmosphere (0.80+):** ${almostIdentical} venues\n`;
  report += `- **Strong Resonance (0.60 - 0.80):** ${strongResonance} venues\n`;
  report += `- **Partial Resonance (0.40 - 0.60):** ${partialResonance} venues\n`;
  report += `- **Different Interpretations (0.20 - 0.40):** ${differentInterpretation} venues\n`;
  report += `- **Potential Extraction Issue (< 0.20):** ${extractionIssue} venues\n\n`;

  report += `## Qualitative Venue Analysis\n\n`;
  
  for (const r of results) {
    let status = '';
    let emoji = '';
    if (r.similarity >= 0.80) { status = 'Almost Identical Atmosphere'; emoji = '🔵'; }
    else if (r.similarity >= 0.60) { status = 'Strong Resonance'; emoji = '🟢'; }
    else if (r.similarity >= 0.40) { status = 'Partial Resonance'; emoji = '🟡'; }
    else if (r.similarity >= 0.20) { status = 'Different Interpretations'; emoji = '🟠'; }
    else { status = 'Potential Extraction Issue'; emoji = '🔴'; }

    report += `### ${r.venueName} — ${emoji} ${status} (Score: ${r.similarity.toFixed(4)})\n\n`;
    report += `**Layer 2 (Editorial Seed):**\n> ${r.l2Text}\n\n`;
    report += `**Layer 3 (Crowd Reality):**\n> ${r.l3Text}\n\n`;
    
    report += `#### Thematic Analysis\n`;
    report += `- **Editorial Themes:** ${r.editorialThemes.join(', ')}\n`;
    report += `- **Crowd Themes:** ${r.crowdThemes.join(', ')}\n`;
    report += `- **Overlap:** ${r.overlapThemes.join(', ')}\n\n`;
    
    report += `**Interpretation:** ${r.interpretationNotes}\n`;
    
    if (r.similarity < 0.20) {
      report += `\n> [!WARNING]\n> Similarity is below 0.20. Flagged for pipeline investigation (check if review corpus is accurate or if LLM hallucinated).\n`;
    }

    report += `\n---\n\n`;
  }

  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  console.log(`\nResonance analysis complete. Report written to ${REPORT_FILE}`);
}

main().catch(console.error);
