import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('venues')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map snake_case to camelCase and parse the taste_vector string into an array of numbers
    const mappedVenues = data.map((v: any) => {
      let parsedVector = [0, 0, 0, 0, 0, 0, 0, 0];
      if (typeof v.taste_vector === 'string') {
        try {
          parsedVector = JSON.parse(v.taste_vector);
        } catch (e) {
          console.warn(`Failed to parse vector for ${v.name}`);
        }
      } else if (Array.isArray(v.taste_vector)) {
        parsedVector = v.taste_vector;
      }

      return {
        id: v.id,
        name: v.name,
        category: v.category,
        location: v.location,
        cardSize: v.card_size,
        spacing: v.spacing,
        heroImage: v.hero_image,
        atmosphere: v.atmosphere,
        quality: v.quality,
        tagline: v.tagline,
        narrative: v.narrative,
        tags: v.tags,
        tasteVector: parsedVector
      };
    });

    return NextResponse.json({ venues: mappedVenues });
  } catch (err: any) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
