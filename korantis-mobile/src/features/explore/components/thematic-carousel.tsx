import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { cloudinaryCardUrl } from '@/features/venues/api/venues-repository';
import type { Venue } from '@/features/venues/api/venue-schema';
import { useTasteProfile } from '@/features/ranking/taste-profile-context';
import { colors, fonts, spacing } from '@/shared/theme/tokens';

type Props = {
  title: string;
  venues: Venue[];
};

export function ThematicCarousel({ title, venues }: Props) {
  const router = useRouter();
  const { recordVenueOpen } = useTasteProfile();
  if (venues.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {venues.slice(0, 6).map((venue) => (
          <Pressable
            key={venue.id}
            onPress={() => { recordVenueOpen(venue); router.push({ pathname: '/venue/[venueId]', params: { venueId: venue.id } }); }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <Image
              source={{ uri: cloudinaryCardUrl(venue.heroUrl) ?? undefined }}
              style={styles.image}
              contentFit="cover"
              transition={250}
            />
            <Text style={styles.name} numberOfLines={1}>{venue.name}</Text>
            <Text style={styles.location} numberOfLines={1}>{venue.location}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: -spacing.md, marginBottom: spacing.xl },
  title: {
    color: colors.gold,
    fontFamily: fonts.displayItalic,
    fontSize: 19,
    marginBottom: 14,
    paddingHorizontal: spacing.md,
  },
  rail: { gap: 12, paddingHorizontal: spacing.md, paddingBottom: 2 },
  card: { width: 126 },
  pressed: { opacity: 0.78 },
  image: { width: 126, height: 158, borderRadius: 10, backgroundColor: colors.surface },
  name: { color: colors.text, fontFamily: fonts.display, fontSize: 14, marginTop: 8 },
  location: { color: colors.textTertiary, fontFamily: fonts.body, fontSize: 8, marginTop: 2, textTransform: 'uppercase' },
});
