export type EnrichmentNeed =
  | 'gallery_depth'
  | 'hero_missing'
  | 'hero_weak'
  | 'editorial_thin'
  | 'facts_missing'
  | 'evidence_weak'
  | 'stale'
  | 'source_unchecked';

export type CurrentVenueStatus = 'active' | 'pending_review' | 'other';

export type SourceType =
  | 'official'
  | 'maps_places'
  | 'editorial_trusted'
  | 'local_media'
  | 'booking_menu'
  | 'social_profile'
  | 'user_generated'
  | 'local_blog';

export type AuthorityLevel = 1 | 2 | 3 | 4 | 5;

export type FetchStatus = 'stored' | 'success' | 'failed' | 'timeout' | 'blocked' | 'not_attempted';

export type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unknown';

export type FactStatus = 'confirmed' | 'likely' | 'weak_hint' | 'unknown' | 'conflict' | 'stale';

export interface EnrichmentRunConfig {
  run_id: string;
  generated_at: string;
  args: Record<string, unknown>;
  filters: {
    active_only: boolean;
    pending_review: boolean;
    city?: string;
    venue_ids: string[];
    missing_gallery: boolean;
    missing_editorial: boolean;
    missing_facts: boolean;
    max_targets: number;
    force: boolean;
  };
  safety: {
    read_only_supabase: true;
    no_supabase_writes: true;
    no_cloudinary_uploads: true;
    no_external_model_calls: true;
    no_publication_changes: true;
  };
}

export interface EnrichmentTarget {
  venue_id: string;
  venue_name: string;
  city: string;
  neighborhood?: string;
  current_status: CurrentVenueStatus;
  curation_status?: string;
  needs: EnrichmentNeed[];
  priority_score: number;
  last_enriched_at: string | null;
  last_enrichment_run_id: string | null;
  current: {
    image_count: number;
    usable_image_count: number;
    hero_image_url?: string;
    has_cloudinary_hero: boolean;
    has_tagline: boolean;
    has_description: boolean;
    mood_tag_count: number;
    has_price_level: boolean;
    has_opening_hours: boolean;
    has_website: boolean;
    has_phone: boolean;
    has_instagram: boolean;
    evidence_coverage?: number;
  };
  reasons: string[];
  warnings: string[];
}

export interface EnrichmentTargetsResult {
  run_id: string;
  generated_at: string;
  mode: 'read_only_target_selection';
  total_venues_read: number;
  total_images_read: number;
  selected_count: number;
  skipped_recent_count: number;
  targets: EnrichmentTarget[];
  summary: Record<string, number>;
  safety: EnrichmentRunConfig['safety'];
}

export interface EvidenceFact {
  field: string;
  value: unknown;
  display_value?: string;
  source_id: string;
  source_url?: string;
  source_authority: AuthorityLevel;
  extraction_method: 'deterministic' | 'stored';
  confidence: number;
  status: FactStatus;
  show_to_user: boolean;
  notes?: string;
}

export interface EvidenceSource {
  source_id: string;
  source_name: string;
  source_type: SourceType;
  authority_level: AuthorityLevel;
  source_url?: string;
  fetched_at: string;
  fetch_status: FetchStatus;
  freshness_status: FreshnessStatus;
  extracted_facts: EvidenceFact[];
  raw_snippet?: string;
  warnings: string[];
}

export interface VenueEvidence {
  venue_id: string;
  venue_name: string;
  city: string;
  sources_attempted: number;
  sources_successful: number;
  evidence_coverage_score: number;
  highest_authority: AuthorityLevel | 0;
  facts: EvidenceFact[];
  sources: EvidenceSource[];
  warnings: string[];
}

export interface EvidenceCollectionResult {
  run_id: string;
  generated_at: string;
  mode: 'read_only_evidence_collection';
  target_count: number;
  venues_processed: number;
  sources_attempted: number;
  sources_successful: number;
  average_evidence_coverage: number;
  venue_evidence: VenueEvidence[];
  fetch_log: Array<{
    venue_id: string;
    source_id: string;
    source_url?: string;
    fetch_status: FetchStatus;
    warning?: string;
  }>;
  safety: EnrichmentRunConfig['safety'];
}

export interface GenericVenueRow {
  [key: string]: unknown;
  id?: unknown;
  name?: unknown;
  city?: unknown;
  neighborhood?: unknown;
  curation_status?: unknown;
  coordinates?: unknown;
  hero_image?: unknown;
  tagline?: unknown;
  narrative?: unknown;
  description?: unknown;
  atmosphere_prose?: unknown;
  tags?: unknown;
  mood_tags?: unknown;
  price_level?: unknown;
  opening_hours?: unknown;
  website?: unknown;
  phone?: unknown;
  instagram_url?: unknown;
  menu_url?: unknown;
  reservation_url?: unknown;
  canonical_data?: unknown;
  enrichment_data?: unknown;
  evidence_data?: unknown;
  last_enriched_at?: unknown;
  enrichment_version?: unknown;
  publication_metadata?: unknown;
}

export interface GenericImageRow {
  [key: string]: unknown;
  id?: unknown;
  venue_id?: unknown;
  secure_url?: unknown;
  url?: unknown;
  role?: unknown;
  is_cover?: unknown;
  is_selected_hero?: unknown;
  rights_status?: unknown;
  quality_score?: unknown;
  gallery_rank?: unknown;
  source_origin?: unknown;
  selection_data?: unknown;
}

export function safeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

export function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function escapeMd(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

