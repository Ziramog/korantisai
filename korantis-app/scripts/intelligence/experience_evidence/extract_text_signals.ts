import type { EvidenceConstraint, EvidenceExtractionResult, ExperienceEvidenceItem, ExperienceEvidenceSignal } from './types';
import { emptySignalScores } from './signals';

type SignalDictionaryEntry = {
  signal: ExperienceEvidenceSignal;
  terms: string[];
  score: number;
};

type ConstraintDictionaryEntry = {
  constraint: EvidenceConstraint;
  terms: string[];
};

const SIGNAL_DICTIONARY: SignalDictionaryEntry[] = [
  { signal: 'work_signal', score: 70, terms: ['work', 'working', 'remote work', 'trabajar', 'trabajar con notebook', 'trabajo remoto', 'cowork', 'coworking', 'sit-down coffee'] },
  { signal: 'laptop_signal', score: 76, terms: ['laptop', 'notebook', 'computer', 'computadora', 'portatil', 'portátil', 'trabajar con notebook'] },
  { signal: 'wifi_signal', score: 72, terms: ['wifi', 'wi-fi', 'internet'] },
  { signal: 'outlet_signal', score: 70, terms: ['outlet', 'outlets', 'plug', 'power socket', 'enchufe', 'enchufes', 'tomacorriente', 'sin enchufes'] },
  { signal: 'study_signal', score: 70, terms: ['study', 'studying', 'estudiar', 'estudio'] },
  { signal: 'quiet_signal', score: 68, terms: ['quiet', 'calm', 'tranquilo', 'tranquila', 'silencioso', 'relajado', 'stay long', 'quedarse'] },
  { signal: 'reading_signal', score: 64, terms: ['read', 'reading', 'leer', 'lectura', 'book', 'libro'] },
  { signal: 'long_stay_signal', score: 66, terms: ['long stay', 'stay long', 'stay awhile', 'sit for hours', 'quedarse', 'pasar la tarde', 'comfortable seating'] },
  { signal: 'quick_stop_signal', score: 62, terms: ['quick', 'to go', 'takeaway', 'take away', 'take away', 'para llevar', 'al paso', 'counter', 'counter only'] },
  { signal: 'seating_signal', score: 66, terms: ['seating', 'tables', 'table', 'chairs', 'sillas', 'mesa', 'mesas', 'asientos', 'sit-down', 'sentarse', 'pocas mesas', 'no hay lugar'] },
  { signal: 'interior_signal', score: 64, terms: ['interior', 'inside', 'indoors', 'adentro', 'interiores', 'salon', 'salón'] },
  { signal: 'crowded_signal', score: 72, terms: ['crowded', 'crowded weekends', 'packed', 'busy', 'lleno', 'llena', 'abarrotado', 'mucha gente', 'no hay lugar', 'pocas mesas'] },
  { signal: 'loud_signal', score: 72, terms: ['loud', 'noisy', 'ruidoso', 'ruidosa', 'noise', 'ruido'] },
  { signal: 'tourist_signal', score: 68, terms: ['tourist', 'tourists', 'turistico', 'turístico', 'turistas', 'must visit', 'landmark'] },
  { signal: 'local_signal', score: 66, terms: ['local', 'neighborhood', 'barrio', 'vecinos', 'community', 'comunidad'] },
  { signal: 'heritage_signal', score: 70, terms: ['classic', 'historical', 'historic', 'histórico', 'tradicional', 'traditional', 'heritage'] },
  { signal: 'premium_signal', score: 70, terms: ['premium', 'fine dining', 'michelin', '50 best', 'elegant', 'luxury', 'lujo'] },
  { signal: 'romantic_signal', score: 68, terms: ['romantic', 'romantico', 'romántico', 'intimate', 'íntimo', 'intimo', 'candle', 'low-lit', 'cita', 'pareja'] },
  { signal: 'date_signal', score: 68, terms: ['date', 'cita', 'pareja', 'wine night', 'night out'] },
  { signal: 'group_signal', score: 62, terms: ['group', 'groups', 'amigos', 'friends', 'grupo', 'compartir'] },
  { signal: 'solo_signal', score: 58, terms: ['solo', 'alone', 'individual', 'solo coffee', 'ir solo'] },
  { signal: 'design_signal', score: 66, terms: ['design', 'beautiful', 'stylish', 'architecture', 'diseño', 'lindo', 'estetica', 'estética'] },
  { signal: 'specialty_signal', score: 72, terms: ['specialty', 'especialidad', 'speciality', 'natural wine', 'craft cocktail'] },
  { signal: 'coffee_quality_signal', score: 74, terms: ['coffee', 'café', 'cafe', 'espresso', 'filter coffee', 'tostadores', 'roaster', 'roasters'] },
  { signal: 'wine_signal', score: 74, terms: ['wine', 'wine list', 'carta de vinos', 'bar de vinos', 'vino', 'vinos', 'sommelier', 'malbec', 'natural wine'] },
  { signal: 'cocktail_signal', score: 74, terms: ['cocktail', 'cocktails', 'coctel', 'cóctel', 'cocteleria', 'coctelería', 'bartender', 'bar', 'vermouth'] },
  { signal: 'dinner_signal', score: 68, terms: ['dinner', 'cena', 'restaurant', 'restaurante', 'menu', 'tasting menu', 'parrilla', 'fine dining'] },
  { signal: 'service_signal', score: 58, terms: ['service', 'servicio', 'atención', 'atencion', 'staff'] },
  { signal: 'price_complaint_signal', score: 72, terms: ['expensive', 'pricey', 'overpriced', 'caro', 'cara', 'muy caro'] },
  { signal: 'reservation_signal', score: 62, terms: ['reservation', 'book ahead', 'reservar', 'reserva', 'reservations'] },
];

const CONSTRAINT_DICTIONARY: ConstraintDictionaryEntry[] = [
  { constraint: 'crowded', terms: ['crowded', 'crowded weekends', 'packed', 'lleno', 'llena', 'abarrotado', 'mucha gente', 'no hay lugar', 'pocas mesas'] },
  { constraint: 'loud', terms: ['loud', 'noisy', 'ruidoso', 'ruidosa', 'ruido'] },
  { constraint: 'expensive', terms: ['expensive', 'pricey', 'overpriced', 'caro', 'muy caro'] },
  { constraint: 'slow_service', terms: ['slow service', 'servicio lento', 'demora', 'tardaron'] },
  { constraint: 'poor_service', terms: ['poor service', 'bad service', 'mala atención', 'mala atencion'] },
  { constraint: 'no_seating', terms: ['no seating', 'sin asientos', 'no seats', 'no hay mesas', 'no hay lugar', 'pocas mesas'] },
  { constraint: 'takeaway_first', terms: ['takeaway', 'take away', 'to go', 'para llevar', 'al paso', 'coffee to go', 'counter only'] },
  { constraint: 'tourist_heavy', terms: ['tourist trap', 'touristy', 'turistico', 'turístico', 'turistas'] },
];

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function includesTerm(text: string, term: string): boolean {
  return normalizeText(text).includes(normalizeText(term));
}

export function extractTextSignals(item: ExperienceEvidenceItem): EvidenceExtractionResult {
  const text = item.text || '';
  const structuredText = JSON.stringify(item.structured_data || {});
  const combinedText = `${text} ${structuredText}`;
  const signals = emptySignalScores();
  const matchedTerms: string[] = [];
  const constraints = new Set<EvidenceConstraint>();

  if (combinedText.trim().length === 0) {
    return {
      evidence_item_id: item.id,
      signals,
      constraints: ['weak_text_evidence'],
      confidence: 0,
      matched_terms: [],
    };
  }

  for (const entry of SIGNAL_DICTIONARY) {
    const matches = entry.terms.filter((term) => includesTerm(combinedText, term));
    if (matches.length === 0) continue;
    signals[entry.signal] = Math.max(signals[entry.signal], Math.min(100, entry.score + Math.min(16, (matches.length - 1) * 4)));
    matchedTerms.push(...matches);
  }

  for (const entry of CONSTRAINT_DICTIONARY) {
    if (entry.terms.some((term) => includesTerm(combinedText, term))) constraints.add(entry.constraint);
  }

  const signalCount = Object.values(signals).filter((score) => score > 0).length;
  const confidence = Math.min(100, Math.round(item.confidence * 0.65 + Math.min(35, signalCount * 5)));

  return {
    evidence_item_id: item.id,
    signals,
    constraints: [...constraints],
    confidence,
    matched_terms: Array.from(new Set(matchedTerms)),
  };
}
