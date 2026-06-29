import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AtlasMap } from '@/features/atlas/atlas-map';
import { useCurrentLocation } from '@/features/atlas/use-current-location';
import { useRankedVenues } from '@/features/ranking/use-ranked-venues';
import { useTasteProfile } from '@/features/ranking/taste-profile-context';
import { cloudinaryCardUrl } from '@/features/venues/api/venues-repository';
import { CITIES, type CityCode } from '@/shared/cities';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useSavedVenues } from '@/shared/hooks/use-saved-venues';
import { colors, fonts } from '@/shared/theme/tokens';

const CITY_STORAGE_KEY = 'korantis-city-v1';
const CARD_GAP = 14;

export default function AtlasScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { venueId: initialVenueId, city: initialCity } = useLocalSearchParams<{ venueId?: string; city?: string }>();
  const carouselRef = useRef<ScrollView>(null);
  const defaultedSelectionRef = useRef(Boolean(initialVenueId));
  const { savedIds } = useSavedVenues();
  const { recordVenueOpen } = useTasteProfile();
  const { coordinate: userCoordinate, locating, error: locationError, locate } = useCurrentLocation();
  const [city, setCity] = useState<CityCode>(() => CITIES.some((item) => item.code === initialCity) ? initialCity as CityCode : 'BUE');
  const [selectedId, setSelectedId] = useState<string | null>(initialVenueId ?? null);
  const venuesQuery = useRankedVenues(city);
  const venues = useMemo(() => venuesQuery.data ?? [], [venuesQuery.data]);
  const cityOption = CITIES.find((item) => item.code === city)!;
  const center: [number, number] = [(cityOption.bounds.minLng + cityOption.bounds.maxLng) / 2, (cityOption.bounds.minLat + cityOption.bounds.maxLat) / 2];
  const savedIdList = useMemo(() => [...savedIds], [savedIds]);
  const effectiveSelectedId = selectedId;
  const cardWidth = Math.min(286, Math.round(width * 0.68));
  const cardStep = cardWidth + CARD_GAP;
  const centerPadding = Math.max(24, (width - cardWidth) / 2);

  useEffect(() => {
    if (initialCity && CITIES.some((item) => item.code === initialCity)) return;
    void AsyncStorage.getItem(CITY_STORAGE_KEY).then((stored) => {
      if (CITIES.some((item) => item.code === stored)) setCity(stored as CityCode);
    });
  }, [initialCity]);

  useEffect(() => {
    if (defaultedSelectionRef.current || !venues[0]) return;
    defaultedSelectionRef.current = true;
    setSelectedId(venues[0].id);
  }, [venues]);

  useEffect(() => {
    const index = venues.findIndex((venue) => venue.id === effectiveSelectedId);
    if (index >= 0) carouselRef.current?.scrollTo({ x: index * cardStep, animated: true });
  }, [cardStep, effectiveSelectedId, venues]);

  const changeCity = (next: CityCode) => {
    defaultedSelectionRef.current = false;
    setCity(next);
    setSelectedId(null);
    carouselRef.current?.scrollTo({ x: 0, animated: false });
    void AsyncStorage.setItem(CITY_STORAGE_KEY, next);
  };

  const cycleCity = () => {
    const index = CITIES.findIndex((item) => item.code === city);
    changeCity(CITIES[(index + 1) % CITIES.length].code);
  };

  const selectVenue = (venueId: string) => {
    if (effectiveSelectedId === venueId) {
      const venue = venues.find((item) => item.id === venueId);
      if (venue) recordVenueOpen(venue);
      router.push({ pathname: '/venue/[venueId]', params: { venueId } });
      return;
    }
    setSelectedId(venueId);
  };

  return (
    <View style={styles.screen}>
      <AtlasMap
        venues={venues}
        center={center}
        selectedId={effectiveSelectedId}
        savedIds={savedIdList}
        focusCoordinate={userCoordinate}
        userCoordinate={userCoordinate}
        onSelect={setSelectedId}
      />
      <View pointerEvents="none" style={styles.cinematicTint} />

      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={styles.brandLockup}>
            <Image source={require('@/assets/images/korantis-logo.jpeg')} style={styles.logo} contentFit="cover" />
            <Text style={styles.brand}>KORANTIS</Text>
          </View>
          <Pressable onPress={cycleCity} style={styles.cityControl} accessibilityLabel="Cambiar ciudad">
            <Text style={styles.cityName}>{cityOption.name.toUpperCase()}</Text>
            <Text style={styles.cityChevron}>▼</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {venuesQuery.isLoading ? <ActivityIndicator color={colors.gold} style={styles.loader} /> : null}

      <Pressable
        accessibilityLabel="Centrar mapa en mi ubicación"
        disabled={locating}
        onPress={() => { setSelectedId(null); void locate(); }}
        style={[styles.locationButton, locating && styles.locationButtonBusy]}>
        {locating ? <ActivityIndicator color={colors.gold} size="small" /> : <Ionicons name="locate-outline" size={19} color={colors.gold} />}
      </Pressable>
      {locationError ? <View style={styles.locationError}><Text style={styles.locationErrorText}>{locationError}</Text></View> : null}

      <View style={styles.carouselWrap} pointerEvents="box-none">
        <ScrollView
          ref={carouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardStep}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ gap: CARD_GAP, paddingHorizontal: centerPadding, paddingBottom: 10 }}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / cardStep);
            const venue = venues[Math.max(0, Math.min(index, venues.length - 1))];
            if (venue) setSelectedId(venue.id);
          }}>
          {venues.map((venue) => {
            const isSelected = effectiveSelectedId === venue.id;
            const isSaved = savedIds.has(venue.id);
            return (
              <Pressable
                key={venue.id}
                accessibilityRole="button"
                accessibilityLabel={`${isSelected ? 'Abrir' : 'Seleccionar'} ${venue.name}`}
                onPress={() => selectVenue(venue.id)}
                style={[styles.venueCard, { width: cardWidth }, isSelected && styles.venueCardSelected]}>
                <View style={styles.cardImageFrame}>
                  <Image source={{ uri: cloudinaryCardUrl(venue.heroUrl) ?? undefined }} style={styles.cardImage} contentFit="cover" transition={180} />
                  {isSaved ? <View style={styles.savedBadge}><Text style={styles.savedIcon}>♥</Text></View> : null}
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{venue.name}</Text>
                  <Text style={styles.cardLocation} numberOfLines={1}>{venue.location} · {venue.atmosphere.replace('-', ' ')}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  cinematicTint: { position: 'absolute', inset: 0, backgroundColor: 'rgba(46,37,30,0.08)' },
  topOverlay: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: 'rgba(10,10,10,0.30)' },
  headerRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 42, height: 42, borderRadius: 5 },
  brand: { color: colors.text, fontFamily: fonts.displayMedium, fontSize: 19, letterSpacing: 3.4 },
  cityControl: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 12 },
  cityName: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 0.8 },
  cityChevron: { color: colors.textTertiary, fontSize: 7 },
  loader: { position: 'absolute', left: 0, right: 0, top: '48%' },
  locationButton: { position: 'absolute', right: 14, top: 96, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,13,11,0.88)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.38)', ...Platform.select({ web: { boxShadow: '0 4px 10px rgba(0,0,0,0.40)' }, default: { elevation: 6 } }) },
  locationButtonBusy: { opacity: 0.65 },
  locationError: { position: 'absolute', left: 18, right: 70, top: 100, minHeight: 36, justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(15,13,11,0.92)', paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(216,135,115,0.35)' },
  locationErrorText: { color: colors.error, fontFamily: fonts.body, fontSize: 9, lineHeight: 13 },
  carouselWrap: { position: 'absolute', left: 0, right: 0, bottom: 66 },
  venueCard: { height: 180, overflow: 'hidden', borderRadius: 15, backgroundColor: colors.blackWarm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...Platform.select({ web: { boxShadow: '0 8px 18px rgba(0,0,0,0.42)' }, default: { elevation: 8 } }) },
  venueCardSelected: { borderColor: 'rgba(201,169,110,0.72)' },
  cardImageFrame: { height: 124, backgroundColor: colors.surface, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%', backgroundColor: colors.surface },
  cardFooter: { flex: 1, justifyContent: 'center', paddingHorizontal: 11, backgroundColor: 'rgba(15,13,11,0.98)' },
  cardTitle: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 18 },
  cardLocation: { color: colors.goldMuted, fontFamily: fonts.body, fontSize: 8, lineHeight: 11, marginTop: 3, textTransform: 'uppercase' },
  savedBadge: { position: 'absolute', top: 9, right: 9, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,10,0.68)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(201,169,110,0.5)' },
  savedIcon: { color: colors.gold, fontSize: 13 },
});
