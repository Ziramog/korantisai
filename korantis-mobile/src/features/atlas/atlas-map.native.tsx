import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Venue } from '@/features/venues/api/venue-schema';
import { colors, fonts, spacing } from '@/shared/theme/tokens';

export type AtlasMapProps = {
  venues: Venue[];
  center: [number, number];
  selectedId: string | null;
  savedIds: string[];
  focusCoordinate?: [number, number] | null;
  userCoordinate?: [number, number] | null;
  onSelect: (venueId: string | null) => void;
};

export function AtlasMap({ venues, selectedId, savedIds, userCoordinate, onSelect }: AtlasMapProps) {
  const bounds = useMemo(() => {
    const lngs = venues.map((venue) => venue.lng);
    const lats = venues.map((venue) => venue.lat);
    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  }, [venues]);

  const selectedVenue = venues.find((venue) => venue.id === selectedId);

  return (
    <View style={styles.shell}>
      <View style={styles.mapSurface}>
        <View style={styles.gridLineVertical} />
        <View style={styles.gridLineHorizontal} />
        {venues.map((venue) => {
          const left = percentPosition(venue.lng, bounds.minLng, bounds.maxLng);
          const top = 100 - percentPosition(venue.lat, bounds.minLat, bounds.maxLat);
          const selected = venue.id === selectedId;
          const saved = savedIds.includes(venue.id);

          return (
            <Pressable
              key={venue.id}
              accessibilityRole="button"
              accessibilityLabel={`Select ${venue.name}`}
              onPress={() => onSelect(selected ? null : venue.id)}
              style={[styles.point, { left: `${left}%`, top: `${top}%` }, saved && styles.savedPoint, selected && styles.selectedPoint]}
            />
          );
        })}
        {userCoordinate ? <View style={styles.userPoint} /> : null}
      </View>

      <View style={styles.panel}>
        <Text style={styles.kicker}>EXPO GO ATLAS</Text>
        <Text style={styles.title}>{selectedVenue?.name ?? 'Mapa nativo pendiente'}</Text>
        <Text style={styles.body}>
          {selectedVenue
            ? `${selectedVenue.location} · ${selectedVenue.category}`
            : 'El mapa Mapbox nativo requiere un development build. Esta vista mantiene selección y navegación de venues en Expo Go.'}
        </Text>
      </View>
    </View>
  );
}

function percentPosition(value: number, min: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || min === max) return 50;
  return Math.max(8, Math.min(92, ((value - min) / (max - min)) * 84 + 8));
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.black,
  },
  mapSurface: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2724',
    backgroundColor: '#12100E',
    overflow: 'hidden',
  },
  gridLineVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(201,169,110,0.14)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(201,169,110,0.14)',
  },
  point: {
    position: 'absolute',
    width: 15,
    height: 15,
    marginLeft: -7.5,
    marginTop: -7.5,
    borderRadius: 99,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.black,
  },
  savedPoint: {
    backgroundColor: colors.blackWarm,
    borderColor: colors.gold,
  },
  selectedPoint: {
    width: 25,
    height: 25,
    marginLeft: -12.5,
    marginTop: -12.5,
    backgroundColor: colors.black,
    borderColor: colors.gold,
    borderWidth: 3,
  },
  userPoint: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: '#4A6B8A',
    borderWidth: 2,
    borderColor: colors.text,
  },
  panel: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    marginTop: 6,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});
