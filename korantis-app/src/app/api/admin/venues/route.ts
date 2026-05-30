import { NextResponse } from 'next/server';

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

// Dummy data for initial UI dev
const MOCK_ADMIN_VENUES: VenueRow[] = [
  {
    id: "flori-123",
    name: "Florería Atlántico",
    city: "Buenos Aires",
    status: "ready_for_review",
    review_count: 450,
    resonance: { score: 0.85, label: "strong" },
    completeness_score: 1.0,
    tags: ["speakeasy", "cocktails", "intimate"],
    last_updated: new Date().toISOString()
  },
  {
    id: "crisol-456",
    name: "Crisol",
    city: "Buenos Aires",
    status: "ready_for_review",
    review_count: 210,
    resonance: { score: 0.52, label: "partial" },
    completeness_score: 0.9,
    tags: ["morning ritual", "soft work", "minimal"],
    last_updated: new Date().toISOString()
  },
  {
    id: "cuervo-789",
    name: "Cuervo Café",
    city: "Buenos Aires",
    status: "pending",
    review_count: 15,
    resonance: { score: 0.21, label: "divergent" },
    completeness_score: 0.4,
    tags: ["specialty coffee", "industrial"],
    last_updated: new Date().toISOString()
  }
];

export async function GET() {
  // TODO: Implement Supabase Query Phase 5.2B
  /*
  select v.id, v.name, v.city, v.status, q.completeness_score, r.cosine_similarity, r.classification
  from venues v
  left join venue_quality q on q.venue_id = v.id
  left join venue_resonance r on r.venue_id = v.id
  order by q.completeness_score desc;
  */

  return NextResponse.json({ venues: MOCK_ADMIN_VENUES });
}
