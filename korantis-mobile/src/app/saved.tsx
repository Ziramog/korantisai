import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VenueCard } from '@/features/explore/components/venue-card';
import { useRankedVenueCatalog } from '@/features/ranking/use-ranked-venues';
import { useTasteProfile } from '@/features/ranking/taste-profile-context';
import { BottomNav } from '@/shared/components/bottom-nav';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useSavedVenues } from '@/shared/hooks/use-saved-venues';
import { colors, fonts, spacing } from '@/shared/theme/tokens';

export default function SavedScreen() {
  const router = useRouter();
  const catalogQuery = useRankedVenueCatalog();
  const { recordVenueOpen } = useTasteProfile();
  const { savedIds, toggleSaved } = useSavedVenues();
  const venues = (catalogQuery.data ?? []).filter((venue) => savedIds.has(venue.id));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={venues}
        keyExtractor={(venue) => venue.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={<ScreenHeader eyebrow={`${venues.length.toString().padStart(2, '0')} LUGARES`} title="Guardados" description="Tu colección privada de lugares para volver cuando llegue el momento." />}
        renderItem={({ item, index }) => (
          <VenueCard
            venue={item}
            featured={index % 3 === 0}
            saved
            onToggleSaved={() => toggleSaved(item.id)}
            onPress={() => { recordVenueOpen(item); router.push({ pathname: '/venue/[venueId]', params: { venueId: item.id } }); }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            {catalogQuery.isLoading ? <ActivityIndicator color={colors.gold} /> : (
              <>
                <View style={styles.emptyIcon}><Ionicons name="bookmark-outline" size={27} color={colors.gold} /></View>
                <Text style={styles.emptyTitle}>Todavía no guardaste ningún lugar.</Text>
                <Text style={styles.emptyBody}>Marcá el corazón en una card y va a aparecer acá.</Text>
                <Pressable onPress={() => router.replace('/')} style={styles.exploreButton}><Text style={styles.exploreText}>EXPLORAR LUGARES</Text></Pressable>
              </>
            )}
          </View>
        }
      />
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { paddingHorizontal: 10, paddingBottom: 96 },
  separator: { height: 31 },
  empty: { minHeight: 460, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(201,169,110,0.3)', backgroundColor: 'rgba(201,169,110,0.06)', marginBottom: 20 },
  emptyTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 25, lineHeight: 31, textAlign: 'center' },
  emptyBody: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 9 },
  exploreButton: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderColor: colors.gold, marginTop: 24 },
  exploreText: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.4 },
});
