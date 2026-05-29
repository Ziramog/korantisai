import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize an admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { venueId, tasteVector } = body;

    if (!venueId || !Array.isArray(tasteVector) || tasteVector.length !== 8) {
      return NextResponse.json({ error: 'Invalid payload. Required: venueId and tasteVector (8D array).' }, { status: 400 });
    }

    // Update the taste_vector in the venues table
    // Convert array to string format expected by pgvector: '[v1,v2,...]'
    const vectorString = `[${tasteVector.join(',')}]`;

    const { data, error } = await supabaseAdmin
      .from('venues')
      .update({ taste_vector: vectorString })
      .eq('id', venueId)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, venue: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
