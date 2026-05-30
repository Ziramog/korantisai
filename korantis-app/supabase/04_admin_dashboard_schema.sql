-- Phase 5.2B: Semantic Divergence Inspection Layer

-- 1.1 venues (core)
CREATE TABLE IF NOT EXISTS public.venues (
  id text PRIMARY KEY,
  place_id text UNIQUE,
  name text NOT NULL,
  city text,
  country text,
  lat double precision,
  lng double precision,
  status text DEFAULT 'pending', -- pending | processing | ready_for_review | published
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 1.2 venue_reviews (Layer 0)
CREATE TABLE IF NOT EXISTS public.venue_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id text REFERENCES public.venues(id) ON DELETE CASCADE,
  author_name text,
  rating int,
  text text,
  language text,
  source text DEFAULT 'google_places',
  created_at timestamp with time zone DEFAULT now()
);

-- 1.3 venue_atmosphere (Layer 3)
CREATE TABLE IF NOT EXISTS public.venue_atmosphere (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id text REFERENCES public.venues(id) ON DELETE CASCADE,
  prose text, -- GPT-4o-mini output
  word_count int,
  model text,
  created_at timestamp with time zone DEFAULT now()
);

-- 1.4 venue_embeddings
CREATE TABLE IF NOT EXISTS public.venue_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id text REFERENCES public.venues(id) ON DELETE CASCADE,
  layer text, -- L2 | L3
  embedding vector(1536),
  source_text text, -- curatorial or atmosphere prose
  created_at timestamp with time zone DEFAULT now()
);

-- 1.5 venue_resonance
CREATE TABLE IF NOT EXISTS public.venue_resonance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id text REFERENCES public.venues(id) ON DELETE CASCADE,
  cosine_similarity double precision,
  classification text, -- almost_identical | strong | partial | divergent
  editorial_themes text[],
  crowd_themes text[],
  overlap_themes text[],
  interpretation_notes text,
  computed_at timestamp with time zone DEFAULT now()
);

-- 1.6 venue_quality
CREATE TABLE IF NOT EXISTS public.venue_quality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id text REFERENCES public.venues(id) ON DELETE CASCADE,
  review_count int DEFAULT 0,
  has_atmosphere boolean DEFAULT false,
  has_embedding boolean DEFAULT false,
  has_images boolean DEFAULT false,
  completeness_score double precision DEFAULT 0.0,
  ready_for_review boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS Setup
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_atmosphere ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_resonance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_quality ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (Admin)
CREATE POLICY "Admins can read venues" ON public.venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can read venue_reviews" ON public.venue_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can read venue_atmosphere" ON public.venue_atmosphere FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can read venue_embeddings" ON public.venue_embeddings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can read venue_resonance" ON public.venue_resonance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can read venue_quality" ON public.venue_quality FOR SELECT TO authenticated USING (true);
