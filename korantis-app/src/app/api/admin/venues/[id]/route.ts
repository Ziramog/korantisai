import { NextRequest, NextResponse } from 'next/server';

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
  
  // MOCK DETAIL DATA
  const mockDetail: VenueDetail = {
    venue: {
      id: id,
      name: "Florería Atlántico",
      location: { lat: -34.5898, lng: -58.3792 }
    },
    layer2: {
      curatorialVoice: "A subterranean cocktail vault where time bends. The energy is restrained yet deeply engaging, defined by amber lighting and brass details.",
      editorialTagline: "Hidden beneath the surface, where nights feel like cinema.",
      embedding: [0.1, -0.2, 0.4] // Truncated mock vector
    },
    layer3: {
      atmosphereProse: "The place is super dark and vibey. People come here for dates, it gets really loud after 11 PM but the drinks are amazing.",
      embedding: [0.15, -0.1, 0.5]
    },
    comparison: {
      cosineSimilarity: 0.85,
      classification: "strong",
      editorialThemes: ["restrained energy", "amber lighting", "cinematic"],
      crowdThemes: ["dark", "loud", "dates"],
      overlapThemes: ["intimate", "cocktails"],
      interpretationNotes: "Crowd perceives it as louder and more social than intended, but the general 'dark and intimate' vibe aligns."
    },
    rawReviews: [
      { text: "Great drinks, but incredibly loud.", rating: 4, language: "en" },
      { text: "Excelente lugar para una cita, muy íntimo.", rating: 5, language: "es" },
      { text: "Too dark to read the menu.", rating: 3, language: "en" }
    ],
    quality: {
      completenessScore: 1.0,
      readyForReview: true
    }
  };

  return NextResponse.json({ detail: mockDetail });
}
