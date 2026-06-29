import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cloudinaryCardUrl } from '@/features/venues/api/venues-repository';
import type { Venue } from '@/features/venues/api/venue-schema';
import { colors, fonts } from '@/shared/theme/tokens';

type Props = {
  venue: Venue;
  onPress: () => void;
  saved: boolean;
  onToggleSaved: () => void;
  featured?: boolean;
};

export function VenueCard({ venue, onPress, saved, onToggleSaved, featured = false }: Props) {
  const source = cloudinaryCardUrl(venue.heroUrl);
  const visibleTags = venue.tags.slice(0, 3);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${venue.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.imageFrame, featured && styles.imageFrameFeatured]}>
        {source ? <Image source={{ uri: source }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} /> : null}
        <View style={styles.imageShade} />
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggleSaved();
          }}
          accessibilityLabel={saved ? 'Quitar de guardados' : 'Guardar lugar'}
          style={[styles.heart, saved && styles.heartSaved]}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={19} color={saved ? colors.black : colors.text} />
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.name} numberOfLines={1}>{venue.name}</Text>
        <View style={styles.place}>
          <Ionicons name="location-outline" size={11} color={colors.goldMuted} />
          <Text style={styles.placeText} numberOfLines={1} ellipsizeMode="tail">{venue.location}</Text>
        </View>
      </View>
      {venue.tagline ? <Text style={styles.tagline} numberOfLines={2}>{venue.tagline}</Text> : null}
      <View style={styles.tags}>
        {visibleTags.map((tag) => (
          <Text key={tag} style={styles.tag}>{tag.replaceAll('_', ' ')}</Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  pressed: { opacity: 0.9 },
  imageFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2D2823',
  },
  imageFrameFeatured: { aspectRatio: 3 / 2 },
  imageShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.07)' },
  heart: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.58)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heartSaved: { backgroundColor: colors.gold, borderColor: colors.gold },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 11, paddingHorizontal: 2 },
  name: { maxWidth: '48%', color: colors.text, fontFamily: fonts.display, fontSize: 24, lineHeight: 29 },
  place: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  placeText: { flexShrink: 1, color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 8.5, lineHeight: 12, letterSpacing: 0.55, textTransform: 'uppercase', textAlign: 'right' },
  tagline: { color: colors.textSecondary, fontFamily: fonts.displayItalic, fontSize: 13, lineHeight: 18, marginTop: 4, paddingHorizontal: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11, paddingHorizontal: 2 },
  tag: { color: colors.textTertiary, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 0.7, textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', borderRadius: 3, paddingHorizontal: 9, paddingVertical: 6 },
});
