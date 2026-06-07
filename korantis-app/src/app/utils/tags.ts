export const TAG_DISPLAY: Record<string, string> = {
  'LATE_NIGHT': 'Late night',
  'DATE_NIGHT': 'Date night',
  'HIDDEN_GEM': 'Hidden gem',
  'COCKTAIL_BAR': 'Cocktail bar',
  'VILLA_CRESPO': 'Villa Crespo',
  'RECOLETA': 'Recoleta',
  'PALERMO': 'Palermo',
  'BELGRANO': 'Belgrano',
  'SAN_TELMO': 'San Telmo',
  'CHACARITA': 'Chacarita',
  'MICROCENTRO': 'Microcentro',
  'RESTAURANT': 'Restaurant',
  'BAR': 'Bar',
  'CAFE': 'Café',
  'WARM': 'Warm',
  'INTIMATE': 'Intimate',
  'CREATIVE': 'Creative',
  'REFINED': 'Refined',
  'CASUAL': 'Casual',
  'LIVELY': 'Lively',
  'QUIET': 'Quiet',
  'SOCIAL': 'Social',
  'ENERGETIC': 'Energetic',
  'SLOW_MORNINGS': 'Slow mornings',
  'NATURAL_LIGHT': 'Natural light',
  'WORK_FRIENDLY': 'Work-friendly',
};

// Categorize tags so we can prioritize what to show
export const TAG_CATEGORIES: Record<string, 'mood' | 'occasion' | 'moment' | 'neighborhood' | 'type'> = {
  'WARM': 'mood',
  'INTIMATE': 'mood',
  'CREATIVE': 'mood',
  'REFINED': 'mood',
  'CASUAL': 'mood',
  'LIVELY': 'mood',
  'QUIET': 'mood',
  'SOCIAL': 'mood',
  'ENERGETIC': 'mood',
  'SLOW_MORNINGS': 'moment',
  'NATURAL_LIGHT': 'mood',
  'WORK_FRIENDLY': 'occasion',
  'LATE_NIGHT': 'moment',
  'DATE_NIGHT': 'occasion',
  'HIDDEN_GEM': 'mood',
  'COCKTAIL_BAR': 'type',
  'VILLA_CRESPO': 'neighborhood',
  'RECOLETA': 'neighborhood',
  'PALERMO': 'neighborhood',
  'BELGRANO': 'neighborhood',
  'SAN_TELMO': 'neighborhood',
  'CHACARITA': 'neighborhood',
  'MICROCENTRO': 'neighborhood',
  'RESTAURANT': 'type',
  'BAR': 'type',
  'CAFE': 'type',
};

export const CARD_TAG_RULES = {
  maxTags: 3,
  priority: ['mood', 'occasion', 'moment', 'type', 'neighborhood'],
  exclude: ['neighborhood', 'type'], // Don't show these as tags on cards since they are in the subtitle
};

export function formatTagsForCard(rawTags: string[] | null | undefined): string[] {
  if (!rawTags || rawTags.length === 0) return [];
  
  // Filter out excluded categories
  const filtered = rawTags.filter(tag => {
    const category = TAG_CATEGORIES[tag.toUpperCase()] || 'mood';
    return !CARD_TAG_RULES.exclude.includes(category);
  });

  // Sort by priority
  filtered.sort((a, b) => {
    const catA = TAG_CATEGORIES[a.toUpperCase()] || 'mood';
    const catB = TAG_CATEGORIES[b.toUpperCase()] || 'mood';
    const priorityA = CARD_TAG_RULES.priority.indexOf(catA);
    const priorityB = CARD_TAG_RULES.priority.indexOf(catB);
    return (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB);
  });

  // Slice to max tags and format
  return filtered.slice(0, CARD_TAG_RULES.maxTags).map(tag => {
    return TAG_DISPLAY[tag.toUpperCase()] || tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase().replace(/_/g, ' ');
  });
}

export function isMoodTag(rawTag: string): boolean {
  const category = TAG_CATEGORIES[rawTag.toUpperCase()];
  return category === 'mood';
}
