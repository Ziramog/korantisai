import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type VenueDetail = {
  venue: {
    id: string;
    name: string;
    location: { lat: number; lng: number };
  };
  layer2: {
    curatorialVoice: string;
    editorialTagline: string;
    embedding: number[];
  };
  layer3: {
    atmosphereProse: string;
    embedding: number[];
  };
  comparison: {
    cosineSimilarity: number;
    classification: string;
    editorialThemes: string[];
    crowdThemes: string[];
    overlapThemes: string[];
    interpretationNotes: string;
  };
  rawReviews: {
    text: string;
    rating: number;
    language: string;
  }[];
  quality: {
    completenessScore: number;
    readyForReview: boolean;
  };
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
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

  try {
    // Parallel fetch for speed
    const [
      venueRes,
      layer2Embedding,
      layer3Embedding,
      atmosphereRes,
      resonanceRes,
      reviewsRes,
      qualityRes
    ] = await Promise.all([
      supabase.from('venues').select('id, name, lat, lng').eq('id', id).single(),
      supabase.from('venue_embeddings').select('source_text, embedding').eq('venue_id', id).eq('layer', 'L2').single(),
      supabase.from('venue_embeddings').select('source_text, embedding').eq('venue_id', id).eq('layer', 'L3').single(),
      supabase.from('venue_atmosphere').select('prose').eq('venue_id', id).single(),
      supabase.from('venue_resonance').select('*').eq('venue_id', id).single(),
      supabase.from('venue_reviews').select('text, rating, language').eq('venue_id', id).limit(5),
      supabase.from('venue_quality').select('completeness_score, ready_for_review').eq('venue_id', id).single()
    ]);

    if (venueRes.error) throw new Error("Venue not found");

    const detail: VenueDetail = {
      venue: {
        id: venueRes.data.id,
        name: venueRes.data.name,
        location: { lat: venueRes.data.lat || 0, lng: venueRes.data.lng || 0 }
      },
      layer2: {
        curatorialVoice: layer2Embedding.data?.source_text || "No curatorial text found",
        editorialTagline: "N/A", // Not stored in schema directly, typically joined or omitted
        embedding: layer2Embedding.data?.embedding ? JSON.parse(layer2Embedding.data.embedding) : []
      },
      layer3: {
        atmosphereProse: atmosphereRes.data?.prose || layer3Embedding.data?.source_text || "No atmosphere prose generated",
        embedding: layer3Embedding.data?.embedding ? JSON.parse(layer3Embedding.data.embedding) : []
      },
      comparison: {
        cosineSimilarity: resonanceRes.data?.cosine_similarity || 0,
        classification: resonanceRes.data?.classification || "divergent",
        editorialThemes: resonanceRes.data?.editorial_themes || [],
        crowdThemes: resonanceRes.data?.crowd_themes || [],
        overlapThemes: resonanceRes.data?.overlap_themes || [],
        interpretationNotes: resonanceRes.data?.interpretation_notes || ""
      },
      rawReviews: reviewsRes.data || [],
      quality: {
        completenessScore: qualityRes.data?.completeness_score || 0,
        readyForReview: qualityRes.data?.ready_for_review || false
      }
    };

    return NextResponse.json({ detail });
  } catch (error: any) {
    console.error("Error fetching venue detail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
