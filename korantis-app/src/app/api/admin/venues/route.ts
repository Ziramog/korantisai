import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type VenueRow = {
  id: string;
  name: string;
  city: string;
  status: "pending" | "processing" | "ready_for_review" | "published";
  review_count: number;
  resonance: {
    score: number;
    label: "almost_identical" | "strong" | "partial" | "divergent";
  };
  completeness_score: number;
  tags: string[];
  last_updated: string;
};

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore if called from a server component
          }
        },
      },
    }
  );

  // Implement Supabase Query for Phase 5.2B
  const { data, error } = await supabase
    .from('venues')
    .select(`
      id,
      name,
      city,
      status,
      tags: venue_resonance(editorial_themes),
      quality: venue_quality(completeness_score, review_count),
      resonance: venue_resonance(cosine_similarity, classification)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    // If the tables don't exist yet, we can gracefully fallback or throw an error.
    console.warn("Supabase query failed, tables might be missing:", error.message);
    return NextResponse.json({ error: error.message, venues: [] }, { status: 500 });
  }

  // Transform the data to match the UI expectations
  const mappedVenues: VenueRow[] = (data || []).map((v: any) => ({
    id: v.id,
    name: v.name,
    city: v.city || 'Unknown',
    status: v.status || 'pending',
    review_count: v.quality?.[0]?.review_count || 0,
    resonance: {
      score: v.resonance?.[0]?.cosine_similarity || 0,
      label: v.resonance?.[0]?.classification || 'divergent',
    },
    completeness_score: v.quality?.[0]?.completeness_score || 0,
    tags: v.tags?.[0]?.editorial_themes || [],
    last_updated: v.updated_at || new Date().toISOString()
  }));

  // Sort by completeness_score descending
  mappedVenues.sort((a, b) => b.completeness_score - a.completeness_score);

  return NextResponse.json({ venues: mappedVenues });
}
