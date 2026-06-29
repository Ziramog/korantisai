import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cloudinaryCardUrl } from '@/features/venues/api/venues-repository';
import type { Venue } from '@/features/venues/api/venue-schema';
import { useVenue } from '@/features/venues/hooks/use-venues';
import { VenueLocationMap } from '@/features/atlas/venue-location-map';
import { BottomNav } from '@/shared/components/bottom-nav';
import { useSavedVenues } from '@/shared/hooks/use-saved-venues';
import { colors, fonts, spacing } from '@/shared/theme/tokens';

export default function VenueDetailScreen() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const venueQuery = useVenue(venueId);
  const venue = venueQuery.data;
  const { savedIds, toggleSaved } = useSavedVenues();

  if (venueQuery.isLoading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.gold} /></View>;
  }

  if (!venue) {
    return <View style={styles.loading}><Text style={styles.missing}>Este lugar ya no está disponible.</Text></View>;
  }

  const hero = cloudinaryCardUrl(venue.heroUrl);
  const saved = savedIds.has(venue.id);
  const bestFor = getBestFor(venue);
  const moments = getMoments(venue);

  const openDirections = () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`);
  const shareVenue = () => Share.share({ message: `${venue.name} — ${venue.location}\nhttps://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}` });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {hero ? <Image source={{ uri: hero }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : null}
          <LinearGradient colors={['rgba(10,10,10,0.1)', 'rgba(15,13,11,0.25)', colors.blackWarm]} locations={[0.22, 0.63, 1]} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']} style={styles.backSafe}>
            <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={19} color={colors.text} />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroCopy}>
            <Text style={styles.category}>{venue.category.toUpperCase()} · {venue.cityCode}</Text>
            <Text style={styles.name}>{venue.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.goldMuted} />
              <Text style={styles.location}>{venue.location}</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.atmosphere}>{localizeAtmosphere(venue.atmosphere)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.tags}>
            {venue.tags.slice(0, 3).map((tag) => <Text key={tag} style={styles.tag}>{tag.replaceAll('_', ' ')}</Text>)}
          </View>

          <View style={styles.actions}>
            <ActionButton
              label={saved ? 'Quitar guardado' : 'Guardar'}
              icon={saved ? 'heart' : 'heart-outline'}
              active={saved}
              onPress={() => toggleSaved(venue.id)}
            />
            <ActionButton label="Ir" icon="navigate-outline" onPress={() => void openDirections()} />
            <ActionButton label="Compartir" icon="share-outline" onPress={() => void shareVenue()} />
          </View>

          {venue.tagline ? <Text style={styles.tagline}>{venue.tagline}</Text> : null}
          {venue.narrative ? <Text style={styles.narrative}>{venue.narrative}</Text> : null}

          <SectionLabel>MEJOR PARA</SectionLabel>
          <View style={styles.bestFor}>
            {bestFor.map((item) => <Text key={item} style={styles.bestForPill}>{item}</Text>)}
          </View>

          <SectionLabel>EL MOMENTO IDEAL</SectionLabel>
          <View style={styles.momentList}>
            {moments.map((moment) => {
              const active = moment.phase === normalizePhase(venue.atmosphere);
              return (
                <View key={moment.phase} style={[styles.momentCard, active && styles.momentCardActive]}>
                  <View style={styles.momentTitleRow}>
                    <Text style={styles.momentTitle}>{moment.title}</Text>
                    {active ? <Text style={styles.recommended}>RECOMENDADO</Text> : null}
                  </View>
                  <Text style={styles.momentBody}>{moment.description}</Text>
                </View>
              );
            })}
          </View>

          <SectionLabel>ANTES DE IR</SectionLabel>
          <View style={styles.practicalCard}>
            <Ionicons name="time-outline" size={17} color={colors.gold} />
            <View style={styles.practicalCopy}>
              <Text style={styles.practicalEyebrow}>RITMO</Text>
              <Text style={styles.practicalText}>{getRhythm(venue)}</Text>
            </View>
          </View>

          <SectionLabel>UBICACIÓN</SectionLabel>
          <Text style={styles.locationEyebrow}>UBICACIÓN ATMOSFÉRICA</Text>
          <Text style={styles.mapTitle}>Dónde vive esta atmósfera</Text>
          <Text style={styles.mapIntro}>Un punto dentro del ritmo de {venue.location}.</Text>
          <VenueLocationMap coordinate={[venue.lng, venue.lat]} label={venue.location.split(',')[0] ?? venue.name} />
          <Pressable
            onPress={() => router.push({ pathname: '/atlas', params: { venueId: venue.id, city: venue.cityCode ?? undefined } })}
            style={styles.atlasButton}>
            <Text style={styles.atlasButtonText}>ABRIR EN ATLAS</Text>
          </Pressable>
          <Pressable onPress={() => void openDirections()} style={styles.nearbyButton}><Text style={styles.nearbyButtonText}>CÓMO LLEGAR</Text></Pressable>

          <SectionLabel>LUGARES SIMILARES</SectionLabel>
          <View style={styles.comingSoon}><Text style={styles.comingSoonText}>EN CONSTRUCCIÓN · SPRINT 2</Text></View>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

function ActionButton({ label, icon, onPress, active = false }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton}>
      <Ionicons name={icon} size={20} color={active ? colors.gold : colors.textSecondary} />
      <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function getBestFor(venue: Venue): string[] {
  const map: Record<string, string> = {
    date_night: 'cita', intimate: 'grupo chico', work_friendly: 'trabajar', quiet: 'estar solo',
    late_night: 'salida nocturna', social: 'con amigos', refined: 'ocasión especial', outdoor: 'al aire libre',
  };
  const values = venue.tags.map((tag) => map[tag.toLowerCase()]).filter(Boolean);
  return [...new Set(values.length ? values : ['pausa sin apuro', 'descubrir algo nuevo'])].slice(0, 4);
}

function normalizePhase(atmosphere: string): 'morning' | 'afternoon' | 'night' {
  if (atmosphere === 'morning' || atmosphere === 'dawn') return 'morning';
  if (atmosphere === 'afternoon' || atmosphere === 'golden-hour') return 'afternoon';
  return 'night';
}

function getMoments(venue: Venue) {
  const text = `${venue.category} ${venue.tags.join(' ')}`.toLowerCase();
  const cafe = /cafe|coffee|bakery|brunch/.test(text);
  const bar = /bar|cocktail|wine|rooftop|lounge/.test(text);
  return [
    { phase: 'morning' as const, title: 'Mañana', description: cafe ? 'Más calmo temprano. Mejor para café, lectura o empezar tranquilo.' : 'Más bajo temprano. Mejor dejarlo para una pausa más tarde.' },
    { phase: 'afternoon' as const, title: 'Tarde', description: bar ? 'Buen momento para una copa lenta, algo simple y conversación.' : 'Buen momento para una pausa lenta, conversación o algo dulce.' },
    { phase: 'night' as const, title: 'Noche', description: bar ? 'Más social y producido. Mejor para una salida con energía.' : 'Más cálido y de mesa. Mejor para quedarse un poco más.' },
  ];
}

function getRhythm(venue: Venue) {
  const text = `${venue.category} ${venue.tags.join(' ')}`.toLowerCase();
  if (/bar|cocktail|wine|rooftop|lounge/.test(text)) return 'Ritmo social. Mejor para una salida sin apuro.';
  if (/cafe|coffee|bakery/.test(text)) return 'Pausa breve. Mejor para café o un encuentro sin demasiada presión.';
  return 'Ritmo de mesa. Mejor cuando el lugar es parte del plan.';
}

function localizeAtmosphere(value: string) {
  return ({ morning: 'Mañana', afternoon: 'Tarde', 'golden-hour': 'Tarde dorada', night: 'Noche', 'late-night': 'Noche larga', dawn: 'Amanecer' } as Record<string, string>)[value] ?? value;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.blackWarm },
  content: { paddingBottom: 108 },
  loading: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missing: { color: colors.text, fontFamily: fonts.display, fontSize: 27, textAlign: 'center' },
  hero: { height: 510, backgroundColor: colors.surface },
  backSafe: { position: 'absolute', left: 16, top: 0 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,10,0.52)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  heroCopy: { position: 'absolute', left: 22, right: 22, bottom: 24 },
  category: { color: colors.goldLight, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.8 },
  name: { color: colors.text, fontFamily: fonts.display, fontSize: 43, lineHeight: 47, marginTop: 9 },
  locationRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  location: { color: colors.goldMuted, fontFamily: fonts.body, fontSize: 12 },
  dot: { color: colors.goldMuted, fontFamily: fonts.body, fontSize: 12 },
  atmosphere: { color: colors.gold, fontFamily: fonts.body, fontSize: 12 },
  body: { paddingHorizontal: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tag: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 0.7, textTransform: 'uppercase', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(201,169,110,0.24)', backgroundColor: 'rgba(201,169,110,0.07)', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 7 },
  actions: { flexDirection: 'row', gap: 9, paddingVertical: 27, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#27221E' },
  actionButton: { flex: 1, minHeight: 74, alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: StyleSheet.hairlineWidth, borderColor: '#28231F' },
  actionLabel: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 0.7, textTransform: 'uppercase' },
  actionLabelActive: { color: colors.gold },
  tagline: { color: colors.gold, fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 31, marginTop: 30 },
  narrative: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 22, marginTop: 18 },
  sectionLabel: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.6, marginTop: 42, marginBottom: 16 },
  bestFor: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  bestForPill: { color: colors.goldLight, fontFamily: fonts.bodyMedium, fontSize: 10, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(201,169,110,0.26)', backgroundColor: 'rgba(201,169,110,0.05)', paddingHorizontal: 14, paddingVertical: 9 },
  momentList: { gap: 12 },
  momentCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#29241F', backgroundColor: 'rgba(255,255,255,0.022)', padding: 18 },
  momentCardActive: { borderColor: 'rgba(201,169,110,0.34)', backgroundColor: 'rgba(201,169,110,0.08)' },
  momentTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  momentTitle: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 13 },
  recommended: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 7, letterSpacing: 1 },
  momentBody: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, lineHeight: 17, marginTop: 8 },
  practicalCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 15, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#29241F', backgroundColor: 'rgba(255,255,255,0.022)', padding: 18 },
  practicalCopy: { flex: 1 },
  practicalEyebrow: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 1, marginBottom: 6 },
  practicalText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, lineHeight: 17 },
  locationEyebrow: { color: colors.textTertiary, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 1.4, marginBottom: 12 },
  mapTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 24 },
  mapIntro: { color: colors.gold, fontFamily: fonts.body, fontSize: 11, marginTop: 7, marginBottom: 18 },
  atlasButton: { height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(201,169,110,0.42)', marginTop: 17 },
  atlasButtonText: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1 },
  nearbyButton: { height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: '#29241F', marginTop: 9 },
  nearbyButtonText: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1 },
  comingSoon: { minHeight: 120, alignItems: 'center', justifyContent: 'center', opacity: 0.5 },
  comingSoonText: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.3 },
});
