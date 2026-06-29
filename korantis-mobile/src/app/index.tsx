import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchOverlay } from '@/features/explore/components/search-overlay';
import { ThematicCarousel } from '@/features/explore/components/thematic-carousel';
import { VenueCard } from '@/features/explore/components/venue-card';
import { useRankedVenues } from '@/features/ranking/use-ranked-venues';
import { useTasteProfile } from '@/features/ranking/taste-profile-context';
import { userFacingError } from '@/shared/api/api-error';
import { CITIES, type CityCode } from '@/shared/cities';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useSavedVenues } from '@/shared/hooks/use-saved-venues';
import { colors, fonts, spacing } from '@/shared/theme/tokens';

const CITY_STORAGE_KEY = 'korantis-city-v1';
const MOODS = [
  { value: 'calm', label: 'Calmo', tags: ['calm', 'quiet', 'slow'] },
  { value: 'intimate', label: 'Íntimo', tags: ['intimate', 'cozy', 'date_night'] },
  { value: 'social', label: 'Social', tags: ['social', 'lively', 'group'] },
  { value: 'energetic', label: 'Energético', tags: ['energetic', 'late_night', 'night'] },
] as const;

const SEARCH_PLACEHOLDERS = [
  'Buscar lugar, mood, barrio...',
  'Lugares para una cita...',
  'Cafés para trabajar...',
  'Refugios para leer...',
] as const;

export default function ExploreScreen() {
  const router = useRouter();
  const [city, setCity] = useState<CityCode>('BUE');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [mood, setMood] = useState<'' | (typeof MOODS)[number]['value']>('');
  const [zone, setZone] = useState('');
  const venuesQuery = useRankedVenues(city);
  const { recordVenueOpen } = useTasteProfile();
  const { savedIds, toggleSaved } = useSavedVenues();

  useEffect(() => {
    void AsyncStorage.getItem(CITY_STORAGE_KEY).then((stored) => {
      if (CITIES.some((item) => item.code === stored)) setCity(stored as CityCode);
    });
  }, []);

  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => setPlaceholderIndex((index) => (index + 1) % SEARCH_PLACEHOLDERS.length), 3000);
    return () => clearInterval(interval);
  }, [query]);

  const chooseNextCity = () => {
    const currentIndex = CITIES.findIndex((item) => item.code === city);
    const next = CITIES[(currentIndex + 1) % CITIES.length].code;
    setCity(next);
    setZone('');
    void AsyncStorage.setItem(CITY_STORAGE_KEY, next);
  };

  const allCityVenues = useMemo(() => venuesQuery.data ?? [], [venuesQuery.data]);
  const venues = useMemo(() => {
    const activeMood = MOODS.find((item) => item.value === mood);
    return allCityVenues.filter((venue) => {
      const haystack = normalize([venue.name, venue.category, venue.location, venue.tagline, ...venue.tags].join(' '));
      const matchesQuery = matchesVenueSearch(venue, query);
      const matchesMood = !activeMood || activeMood.tags.some((tag) => haystack.includes(tag));
      const matchesZone = !zone || normalize(venue.location).includes(normalize(zone));
      return matchesQuery && matchesMood && matchesZone;
    });
  }, [allCityVenues, mood, query, zone]);
  const hasActiveDiscovery = Boolean(query.trim() || mood || zone);

  const currentCity = CITIES.find((item) => item.code === city)!;
  const currentPhase = getCurrentPhase();
  const contextual = allCityVenues.filter((venue) => {
    if (currentPhase === 'morning') return venue.atmosphere === 'morning';
    if (currentPhase === 'afternoon') return ['afternoon', 'golden-hour'].includes(venue.atmosphere);
    return ['night', 'late-night'].includes(venue.atmosphere);
  });
  const contextualTitle = currentPhase === 'morning' ? 'Tu mañana' : currentPhase === 'afternoon' ? 'Tu tarde' : 'Para esta noche';
  const aloneVenues = allCityVenues.filter((venue) => venue.tags.some((tag) => ['quiet', 'work_friendly', 'focused', 'calm', 'slow'].includes(tag.toLowerCase())));
  const zones = [...new Set(allCityVenues.map((venue) => venue.location.split(',')[0]?.trim()).filter(Boolean))].slice(0, 7);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={venuesQuery.isRefetching}
        onRefresh={() => void venuesQuery.refetch()}
        renderItem={({ item, index }) => (
          <View>
            <VenueCard
              venue={item}
              featured={index % 3 === 0}
              saved={savedIds.has(item.id)}
              onToggleSaved={() => toggleSaved(item.id)}
              onPress={() => { recordVenueOpen(item); router.push({ pathname: '/venue/[venueId]', params: { venueId: item.id } }); }}
            />
            {!hasActiveDiscovery && index === 1 && aloneVenues.length > 0 ? (
              <View style={styles.injectedSection}>
                <ThematicCarousel title="Para estar solo" venues={aloneVenues} />
                <Text style={styles.zoneTitle}>EXPLORÁ POR BARRIO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneRail}>
                  {zones.map((itemZone) => (
                    <Pressable key={itemZone} onPress={() => setZone(zone === itemZone ? '' : itemZone)} style={[styles.zonePill, zone === itemZone && styles.zonePillActive]}>
                      <Text style={[styles.zoneText, zone === itemZone && styles.zoneTextActive]}>{itemZone}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.brandLockup}>
                <Image source={require('@/assets/images/korantis-logo.jpeg')} style={styles.logo} contentFit="cover" />
                <Text style={styles.brand}>KORANTIS</Text>
              </View>
              <Pressable onPress={chooseNextCity} style={styles.cityControl} accessibilityLabel="Cambiar ciudad">
                <Text style={styles.cityText}>{currentCity.name.toUpperCase()}</Text>
                <Text style={styles.chevron}>⌄</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setSearchOpen(true)} style={({ pressed }) => [styles.searchShell, pressed && styles.searchPressed]} accessibilityRole="button" accessibilityLabel="Abrir búsqueda">
              <Ionicons name="search-outline" size={17} color={colors.goldMuted} />
              <Text style={[styles.searchText, query && styles.searchTextActive]} numberOfLines={1}>
                {query || SEARCH_PLACEHOLDERS[placeholderIndex]}
              </Text>
              {query ? <Ionicons name="options-outline" size={16} color={colors.goldMuted} /> : null}
            </Pressable>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moods}>
              {MOODS.map((item) => (
                <Pressable key={item.value} onPress={() => setMood(mood === item.value ? '' : item.value)} style={[styles.mood, mood === item.value && styles.moodActive]}>
                  <Text style={[styles.moodText, mood === item.value && styles.moodTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {!hasActiveDiscovery ? <ThematicCarousel title={contextualTitle} venues={contextual.length > 0 ? contextual : allCityVenues} /> : null}

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{hasActiveDiscovery ? 'Resultados' : 'Lo nuevo'}</Text>
              {hasActiveDiscovery ? <Text style={styles.resultCount}>{venues.length} lugares</Text> : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.state}>
            {venuesQuery.isLoading ? (
              <ActivityIndicator color={colors.gold} />
            ) : venuesQuery.isError ? (
              <>
                <Text style={styles.stateTitle}>La señal se perdió.</Text>
                <Text style={styles.stateBody}>{userFacingError(venuesQuery.error)}</Text>
                <Pressable onPress={() => void venuesQuery.refetch()} style={styles.retry}><Text style={styles.retryText}>REINTENTAR</Text></Pressable>
              </>
            ) : (
              <>
                <Text style={styles.stateTitle}>Todavía no hay lugares publicados acá.</Text>
                <Text style={styles.stateBody}>Probá otra ciudad o limpiá los filtros.</Text>
              </>
            )}
          </View>
        }
      />
      <SearchOverlay
        visible={searchOpen}
        query={query}
        venues={venues}
        onChangeQuery={(nextQuery) => {
          setQuery(nextQuery);
          setMood('');
          setZone('');
        }}
        onClose={() => setSearchOpen(false)}
        onSelectVenue={(venue) => {
          setSearchOpen(false);
          recordVenueOpen(venue);
          router.push({ pathname: '/venue/[venueId]', params: { venueId: venue.id } });
        }}
      />
      <BottomNav />
    </SafeAreaView>
  );
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]/g, ' ').toLowerCase().trim();
}

const SEARCH_SYNONYMS: Record<string, string[]> = {
  leer: ['quiet', 'work friendly', 'calm', 'slow', 'focused', 'library'],
  lectura: ['quiet', 'work friendly', 'calm', 'slow', 'focused'],
  tranquilo: ['quiet', 'calm', 'slow', 'intimate'],
  tranquila: ['quiet', 'calm', 'slow', 'intimate'],
  refugio: ['quiet', 'hidden', 'intimate', 'cozy'],
  refugios: ['quiet', 'hidden', 'intimate', 'cozy'],
  cita: ['date night', 'intimate', 'romantic', 'refined'],
  intima: ['intimate', 'cozy', 'date night'],
  intimo: ['intimate', 'cozy', 'date night'],
  cafe: ['cafe', 'coffee', 'roastery', 'bakery'],
  noche: ['night', 'late night', 'bar', 'cocktail'],
  larga: ['late night', 'night', 'energetic'],
  terraza: ['terrace', 'rooftop', 'outdoor', 'patio'],
  sunset: ['golden hour', 'terrace', 'rooftop'],
};

function matchesVenueSearch(venue: { name: string; category: string; location: string; tagline: string; narrative: string; atmosphere: string; tags: string[] }, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  const haystack = normalize([venue.name, venue.category, venue.location, venue.tagline, venue.narrative, venue.atmosphere, ...venue.tags].join(' '));
  if (haystack.includes(normalizedQuery)) return true;
  const ignored = new Set(['para', 'un', 'una', 'de', 'en', 'con', 'ideal']);
  const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 1 && !ignored.has(token));
  return tokens.every((token) => haystack.includes(token) || SEARCH_SYNONYMS[token]?.some((synonym) => haystack.includes(synonym)));
}

function getCurrentPhase(): 'morning' | 'afternoon' | 'night' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  return 'night';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { paddingHorizontal: 10, paddingBottom: 96 },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 1 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 34, height: 34, borderRadius: 4 },
  brand: { color: colors.text, fontFamily: fonts.displayMedium, letterSpacing: 3.2, fontSize: 18 },
  cityControl: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 12 },
  cityText: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 0.7 },
  chevron: { color: colors.textTertiary, fontSize: 12, marginTop: -3 },
  searchShell: { height: 53, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(201,169,110,0.28)', backgroundColor: 'rgba(15,13,11,0.8)', paddingHorizontal: 16, marginTop: 6 },
  searchPressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  searchText: { flex: 1, color: colors.goldMuted, fontFamily: fonts.body, fontSize: 13 },
  searchTextActive: { color: colors.text },
  moods: { gap: 10, paddingVertical: 18 },
  mood: { minHeight: 39, justifyContent: 'center', paddingHorizontal: 17, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.018)' },
  moodActive: { borderColor: 'rgba(201,169,110,0.35)', backgroundColor: 'rgba(201,169,110,0.1)' },
  moodText: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 11 },
  moodTextActive: { color: colors.gold },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 15, paddingHorizontal: 1 },
  sectionTitle: { color: colors.gold, fontFamily: fonts.displayItalic, fontSize: 19 },
  resultCount: { color: colors.textTertiary, fontFamily: fonts.body, fontSize: 10 },
  separator: { height: 31 },
  injectedSection: { marginTop: 42 },
  zoneTitle: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.8, marginBottom: 13, paddingHorizontal: 4 },
  zoneRail: { gap: 10, paddingHorizontal: 2, paddingBottom: 8 },
  zonePill: { minHeight: 38, justifyContent: 'center', borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', paddingHorizontal: 17 },
  zonePillActive: { borderColor: 'rgba(201,169,110,0.35)', backgroundColor: 'rgba(201,169,110,0.1)' },
  zoneText: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 10 },
  zoneTextActive: { color: colors.gold },
  state: { minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  stateTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 25, textAlign: 'center' },
  stateBody: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
  retry: { minHeight: 44, marginTop: spacing.lg, justifyContent: 'center', borderBottomWidth: 1, borderColor: colors.gold },
  retryText: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1.6 },
});
