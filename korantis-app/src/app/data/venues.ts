export interface Venue {
  id: string;
  name: string;
  category: string;
  location: string;
  cardSize: 'immersive' | 'cinematic' | 'layered' | 'compact';
  spacing: 'tight' | 'breathe' | 'isolated';
  heroImage: string;
  atmosphere: 'morning' | 'afternoon' | 'golden-hour' | 'night' | 'late-night' | 'dawn';
  quality: number;
  tagline: string;
  narrative: string;
  tags: string[];
  tasteVector?: number[]; // Added for Phase 3E Database Vector Integration
}

export const MOCK_VENUES: Venue[] = [
  {
    id: 'floreria',
    name: 'Florería Atlántico',
    category: 'Speakeasy Bar',
    location: 'Retiro',
    cardSize: 'immersive',
    spacing: 'breathe',
    heroImage: '/venue_floreria.png',
    atmosphere: 'late-night',
    quality: 0.95,
    tagline: 'Hidden beneath the surface, where nights feel like cinema.',
    narrative: 'A subterranean warmth shaped by amber light, slow jazz, and conversations that naturally drift past midnight. It feels like stepping out of time.',
    tags: ['Hidden', 'Atmospheric', 'Late Night']
  },
  {
    id: 'crisol',
    name: 'Crisol Café',
    category: 'Coffee & Bakery',
    location: 'Villa Crespo',
    cardSize: 'compact',
    spacing: 'tight',
    heroImage: '/venue_crisol.png',
    atmosphere: 'morning',
    quality: 0.80,
    tagline: 'Nordic clarity meets Japanese restraint in a quiet morning ritual.',
    narrative: 'Pale ash wood, a single ceramic pour-over, and sunlight that makes you forget the city outside. Every detail has been considered, every excess removed.',
    tags: ['Quiet', 'Minimal', 'Morning']
  },
  {
    id: 'invernadero',
    name: 'Invernadero',
    category: 'Gin & Tapas',
    location: 'Palermo Botánico',
    cardSize: 'layered',
    spacing: 'breathe',
    heroImage: '/venue_invernadero.png',
    atmosphere: 'afternoon',
    quality: 0.88,
    tagline: 'Dining inside a living greenhouse, where nature sets the table.',
    narrative: 'Glass ceilings filter the afternoon sun through a canopy of ferns and tropical palms. The air feels different here — humid, green, alive. Each plate arrives like a botanical specimen.',
    tags: ['Greenhouse', 'Daylight', 'Afternoon']
  },
  {
    id: 'ninina',
    name: 'Ninina',
    category: 'Bakery & Café',
    location: 'Palermo Soho',
    cardSize: 'cinematic',
    spacing: 'isolated',
    heroImage: '/venue_ninina.png',
    atmosphere: 'golden-hour',
    quality: 0.85,
    tagline: 'Golden warmth and the hum of slow evenings.',
    narrative: 'The late afternoon sun paints everything in amber. Pastries glisten behind curved glass. Conversations become softer as the light deepens.',
    tags: ['Golden Hour', 'Slow Hum', 'Evening']
  },
  {
    id: 'melbourne',
    name: 'Melbourne Café',
    category: 'Specialty Coffee',
    location: 'Palermo Soho',
    cardSize: 'compact',
    spacing: 'tight',
    heroImage: '/venue_melbourne.png',
    atmosphere: 'morning',
    quality: 0.78,
    tagline: 'Industrial warmth and lively mornings.',
    narrative: 'Exposed brick meets specialty roasters. The barista moves with quiet precision. Steam rises against morning light streaming through warehouse windows.',
    tags: ['Lively', 'Industrial', 'Specialty']
  },
  {
    id: 'verne',
    name: 'Verne Club',
    category: 'Cocktail Vault',
    location: 'San Telmo',
    cardSize: 'immersive',
    spacing: 'breathe',
    heroImage: '/venue_verne.png',
    atmosphere: 'late-night',
    quality: 0.90,
    tagline: 'A subterranean cocktail vault where time bends like copper.',
    narrative: 'Descend through a narrow staircase into a world of brass, leather, and amber Edison glow. Every cocktail is a small invention. The walls whisper of expeditions never taken.',
    tags: ['Speakeasy', 'Craft Cocktails', 'Late Night']
  },
  {
    id: 'bookshop',
    name: 'Libros del Pasaje',
    category: 'Bookshop & Café',
    location: 'Palermo Viejo',
    cardSize: 'layered',
    spacing: 'breathe',
    heroImage: '/venue_bookshop.png',
    atmosphere: 'afternoon',
    quality: 0.82,
    tagline: 'Where stories live between the shelves and the steam.',
    narrative: 'Books line every wall. The espresso machine hums behind stacks of poetry. Afternoon light falls across open pages. Hours dissolve.',
    tags: ['Literary', 'Quiet', 'Slow Hours']
  },
  {
    id: 'oporto',
    name: 'Oporto Almacén',
    category: 'Wine Bar & Dining',
    location: 'Palermo Hollywood',
    cardSize: 'cinematic',
    spacing: 'isolated',
    heroImage: '/venue_oporto.png',
    atmosphere: 'golden-hour',
    quality: 0.84,
    tagline: 'Wine, sunset, and the slow art of lingering.',
    narrative: 'The terrace catches the last golden light. Malbec glows in the glass. Conversations stretch across cheese boards and shared silences. Nobody is in a hurry.',
    tags: ['Wine Bar', 'Sunset', 'Slow Art']
  },
  {
    id: 'cuervo',
    name: 'Café Cuervo',
    category: 'Rustic Café',
    location: 'San Telmo',
    cardSize: 'compact',
    spacing: 'tight',
    heroImage: '/venue_cuervo.png',
    atmosphere: 'morning',
    quality: 0.76,
    tagline: 'Rustic stone walls and the slow ritual of espresso.',
    narrative: 'Thick stone walls hold the morning cool. The espresso arrives in ceramic, dark and deliberate. San Telmo wakes slowly through the window.',
    tags: ['Rustic', 'Espresso', 'Morning']
  },
  {
    id: 'labiela',
    name: 'La Biela',
    category: 'Historic Grand Café',
    location: 'Recoleta',
    cardSize: 'immersive',
    spacing: 'breathe',
    heroImage: '/venue_labiela.png',
    atmosphere: 'afternoon',
    quality: 0.87,
    tagline: 'A century of conversations beneath the ancient rubber tree.',
    narrative: 'Marble tables, porteño elegance, and the dappled shade of a tree that has watched generations pass. The waiter knows your order before you speak.',
    tags: ['Historic', 'Outdoor', 'Classic']
  },
  {
    id: 'rooftop',
    name: 'Uptown Bar',
    category: 'Rooftop Lounge',
    location: 'Palermo Soho',
    cardSize: 'cinematic',
    spacing: 'isolated',
    heroImage: '/venue_rooftop.png',
    atmosphere: 'night',
    quality: 0.86,
    tagline: 'City lights below, slow cocktails above.',
    narrative: 'The skyline glitters beyond the railing. Wind carries fragments of music from below. Up here, conversations become confessions and the night feels infinite.',
    tags: ['Rooftop', 'Sunset View', 'Cocktails']
  },
  {
    id: 'boliche',
    name: 'El Boliche de Roberto',
    category: 'Historic Tango Bar',
    location: 'La Boca',
    cardSize: 'immersive',
    spacing: 'breathe',
    heroImage: '/venue_boliche.png',
    atmosphere: 'night',
    quality: 0.92,
    tagline: 'Where tango lives in the walls and the red neon never sleeps.',
    narrative: 'The bandoneon exhales. Worn wooden floors remember a thousand milongas. Red neon stains the walls. This is not a show — this is where tango still breathes.',
    tags: ['Tango', 'Raw', 'Authentic']
  }
];
