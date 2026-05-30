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
  lat: number;
  lng: number;
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
    tags: ['Hidden', 'Atmospheric', 'Late Night'],
    lat: -34.5907,
    lng: -58.3789
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
    tags: ['Quiet', 'Minimal', 'Morning'],
    lat: -34.5996,
    lng: -58.4379
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
    tags: ['Greenhouse', 'Daylight', 'Afternoon'],
    lat: -34.5847,
    lng: -58.4002
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
    tags: ['Golden Hour', 'Slow Hum', 'Evening'],
    lat: -34.5886,
    lng: -58.4312
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
    tags: ['Lively', 'Industrial', 'Specialty'],
    lat: -34.5878,
    lng: -58.4288
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
    tags: ['Speakeasy', 'Craft Cocktails', 'Late Night'],
    lat: -34.6212,
    lng: -58.3731
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
    tags: ['Literary', 'Quiet', 'Slow Hours'],
    lat: -34.5872,
    lng: -58.4277
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
    tags: ['Wine Bar', 'Sunset', 'Slow Art'],
    lat: -34.5619,
    lng: -58.4526
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
    tags: ['Rustic', 'Espresso', 'Morning'],
    lat: -34.6200,
    lng: -58.3710
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
    tags: ['Historic', 'Outdoor', 'Classic'],
    lat: -34.5876,
    lng: -58.3905
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
    tags: ['Rooftop', 'Sunset View', 'Cocktails'],
    lat: -34.5779,
    lng: -58.4363
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
    tags: ['Tango', 'Raw', 'Authentic'],
    lat: -34.6111,
    lng: -58.4231
  },
  {
    id: 'lattente',
    name: 'Lattente',
    category: 'Specialty Coffee',
    location: 'Palermo Soho',
    cardSize: 'compact',
    spacing: 'tight',
    heroImage: '/venue_lattente.png',
    atmosphere: 'morning',
    quality: 0.85,
    tagline: 'The birthplace of Buenos Aires specialty coffee.',
    narrative: 'A narrow, bustling space where the focus is entirely on the cup. The energy is high, the extraction is perfect, and people spill out onto the sidewalk.',
    tags: ['Specialty', 'Fast Paced', 'Morning'],
    lat: -34.5888,
    lng: -58.4285
  },
  {
    id: 'surryhills',
    name: 'Surry Hills Coffee',
    category: 'Australian Café',
    location: 'Palermo Soho',
    cardSize: 'layered',
    spacing: 'breathe',
    heroImage: '/venue_crisol.png', // Fallback
    atmosphere: 'afternoon',
    quality: 0.82,
    tagline: 'Airy, light-filled, and unhurried.',
    narrative: 'A sunny corner that feels imported from Sydney. Wide windows, blonde wood, and flat whites that taste like they should. Excellent for soft work.',
    tags: ['Sunny', 'Soft Work', 'Daylight'],
    lat: -34.5855,
    lng: -58.4310
  },
  {
    id: 'birkin',
    name: 'Birkin',
    category: 'Brunch & Coffee',
    location: 'Palermo Botánico',
    cardSize: 'immersive',
    spacing: 'isolated',
    heroImage: '/venue_ninina.png', // Fallback
    atmosphere: 'golden-hour',
    quality: 0.80,
    tagline: 'Lively sidewalk brunch and midday chatter.',
    narrative: 'Always busy, always vibrant. The terrazzo floor and brass details give it a Parisian touch, but the energy is purely porteño.',
    tags: ['Lively', 'Brunch', 'Midday'],
    lat: -34.5821,
    lng: -58.4172
  },
  {
    id: 'padre',
    name: 'Padre Coffee Roasters',
    category: 'Roastery & Café',
    location: 'Palermo Hollywood',
    cardSize: 'compact',
    spacing: 'tight',
    heroImage: '/venue_melbourne.png', // Fallback
    atmosphere: 'morning',
    quality: 0.81,
    tagline: 'Deep roasted aromas in a brutalist setting.',
    narrative: 'Concrete, steel, and the heavy scent of roasting beans. It feels like an engine room for caffeine. Focused, serious, and excellent.',
    tags: ['Brutalist', 'Focused', 'Morning'],
    lat: -34.5790,
    lng: -58.4350
  },
  {
    id: 'tresmonos',
    name: 'Tres Monos',
    category: 'Cocktail Bar',
    location: 'Palermo Soho',
    cardSize: 'cinematic',
    spacing: 'tight',
    heroImage: '/venue_tresmonos.png', // We have this artifact
    atmosphere: 'late-night',
    quality: 0.93,
    tagline: 'Punk rock energy meets world-class mixology.',
    narrative: 'Neon lights, loud music, and cocktails that rank among the best in the world. It’s cramped, chaotic, and completely unforgettable.',
    tags: ['Punk', 'Cocktails', 'Loud'],
    lat: -34.5880,
    lng: -58.4300
  },
  {
    id: 'donjulio',
    name: 'Parrilla Don Julio',
    category: 'Classic Parrilla',
    location: 'Palermo Soho',
    cardSize: 'immersive',
    spacing: 'breathe',
    heroImage: '/venue_labiela.png', // Fallback
    atmosphere: 'night',
    quality: 0.98,
    tagline: 'The temple of Argentine meat and fire.',
    narrative: 'Brick walls lined with wine bottles signed by diners. The smell of woodsmoke and roasting fat is intoxicating. A religious experience for carnivores.',
    tags: ['Meat', 'Classic', 'Formal'],
    lat: -34.5875,
    lng: -58.4245
  },
  {
    id: 'mishiguene',
    name: 'Mishiguene',
    category: 'Jewish Cuisine',
    location: 'Palermo Botánico',
    cardSize: 'layered',
    spacing: 'breathe',
    heroImage: '/venue_invernadero.png', // Fallback
    atmosphere: 'night',
    quality: 0.95,
    tagline: 'Immigrant memory transformed into high dining.',
    narrative: 'A loud, joyous celebration of Jewish diaspora cuisine. The music might start playing, people might start clapping, but the food is deadly serious.',
    tags: ['Joyous', 'Heritage', 'Celebratory'],
    lat: -34.5800,
    lng: -58.4150
  },
  {
    id: 'ninogordo',
    name: 'Niño Gordo',
    category: 'Asian Fusion',
    location: 'Palermo Soho',
    cardSize: 'cinematic',
    spacing: 'isolated',
    heroImage: '/venue_floreria.png', // Fallback
    atmosphere: 'late-night',
    quality: 0.89,
    tagline: 'A fever dream of red lanterns and umami.',
    narrative: 'Hundreds of red paper lanterns hang from the ceiling. The aesthetic is surreal pop-culture overload, matching food that is intensely flavored and playfully irreverent.',
    tags: ['Surreal', 'Umami', 'Visual'],
    lat: -34.5865,
    lng: -58.4280
  },
  {
    id: 'attaboy',
    name: 'Attaboy',
    category: 'Speakeasy',
    location: 'Lower East Side',
    cardSize: 'immersive',
    spacing: 'tight',
    heroImage: '/venue_verne.png', // Fallback
    atmosphere: 'late-night',
    quality: 0.96,
    tagline: 'No menus. Just you, the bartender, and the night.',
    narrative: 'Hidden behind a tailor shop door, the space is narrow, dark, and intensely personal. The drinks are tailored to your exact mood.',
    tags: ['Speakeasy', 'Bespoke', 'NYC'],
    lat: 40.7188,
    lng: -73.9913
  },
  {
    id: 'devocion',
    name: 'Devoción',
    category: 'Coffee Roastery',
    location: 'Williamsburg',
    cardSize: 'layered',
    spacing: 'breathe',
    heroImage: '/venue_invernadero.png', // Fallback
    atmosphere: 'morning',
    quality: 0.88,
    tagline: 'Colombian beans roasted in the heart of Brooklyn.',
    narrative: 'A massive skylight illuminates a living green wall. The scent of freshly roasted coffee hangs in the air, creating a vibrant morning sanctuary.',
    tags: ['Roastery', 'Sunlight', 'NYC'],
    lat: 40.7161,
    lng: -73.9647
  }
];
