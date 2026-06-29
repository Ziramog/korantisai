import Mapbox, { type Camera, type ShapeSource } from '@rnmapbox/maps';
import type { FeatureCollection, Point } from 'geojson';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Venue } from '@/features/venues/api/venue-schema';
import { env } from '@/shared/config/env';
import { colors, fonts } from '@/shared/theme/tokens';

export type AtlasMapProps = {
  venues: Venue[];
  center: [number, number];
  selectedId: string | null;
  savedIds: string[];
  focusCoordinate?: [number, number] | null;
  userCoordinate?: [number, number] | null;
  onSelect: (venueId: string | null) => void;
};

if (env.mapboxAccessToken) void Mapbox.setAccessToken(env.mapboxAccessToken);

export function AtlasMap({ venues, center, selectedId, savedIds, focusCoordinate, userCoordinate, onSelect }: AtlasMapProps) {
  const cameraRef = useRef<Camera>(null);
  const sourceRef = useRef<ShapeSource>(null);
  const selectedVenue = venues.find((venue) => venue.id === selectedId);
  const [primaryExpanded, setPrimaryExpanded] = useState(false);
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);

  useEffect(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: selectedVenue ? [selectedVenue.lng, selectedVenue.lat] : focusCoordinate ?? center,
      zoomLevel: selectedVenue ? 16.8 : focusCoordinate ? 14.5 : 11.2,
      pitch: 45,
      animationDuration: 650,
    });
  }, [center, focusCoordinate, selectedVenue]);

  useEffect(() => {
    if (!selectedId) return;

    let primaryStart: ReturnType<typeof setTimeout> | undefined;
    let secondaryStart: ReturnType<typeof setTimeout> | undefined;
    let secondaryInterval: ReturnType<typeof setInterval> | undefined;

    const runPrimary = () => {
      setPrimaryExpanded(false);
      primaryStart = setTimeout(() => setPrimaryExpanded(true), 35);
    };

    const runSecondary = () => {
      setSecondaryExpanded(false);
      secondaryStart = setTimeout(() => setSecondaryExpanded(true), 35);
    };

    const primaryKickoff = setTimeout(runPrimary, 0);
    const primaryInterval = setInterval(runPrimary, 2000);
    const secondaryDelay = setTimeout(() => {
      runSecondary();
      secondaryInterval = setInterval(runSecondary, 2000);
    }, 600);

    return () => {
      clearTimeout(primaryStart);
      clearTimeout(secondaryStart);
      clearTimeout(primaryKickoff);
      clearTimeout(secondaryDelay);
      clearInterval(primaryInterval);
      clearInterval(secondaryInterval);
    };
  }, [selectedId]);

  const shape = useMemo<FeatureCollection<Point, { venueId: string; isSaved: boolean }>>(() => ({
    type: 'FeatureCollection',
    features: venues.filter((venue) => venue.id !== selectedId).map((venue) => ({
      type: 'Feature',
      id: venue.id,
      properties: { venueId: venue.id, isSaved: savedIds.includes(venue.id) },
      geometry: { type: 'Point', coordinates: [venue.lng, venue.lat] },
    })),
  }), [savedIds, selectedId, venues]);
  const selectedShape = useMemo<FeatureCollection<Point, { venueId: string }>>(() => ({
    type: 'FeatureCollection',
    features: selectedVenue ? [{
      type: 'Feature',
      id: selectedVenue.id,
      properties: { venueId: selectedVenue.id },
      geometry: { type: 'Point', coordinates: [selectedVenue.lng, selectedVenue.lat] },
    }] : [],
  }), [selectedVenue]);
  const userShape = useMemo<FeatureCollection<Point>>(() => ({
    type: 'FeatureCollection',
    features: userCoordinate ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: userCoordinate } }] : [],
  }), [userCoordinate]);

  if (!env.mapboxAccessToken) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Falta el token público de Mapbox.</Text>
        <Text style={styles.missingBody}>Configurá EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN y reconstruí la app instalable.</Text>
      </View>
    );
  }

  return (
    <Mapbox.MapView
      style={styles.map}
      styleURL={Mapbox.StyleURL.Dark}
      logoEnabled
      attributionEnabled={false}
      scaleBarEnabled={false}
      compassEnabled
      compassFadeWhenNorth
      scrollEnabled
      zoomEnabled
      rotateEnabled={false}
      pitchEnabled={false}
      preferredFramesPerSecond={60}
      surfaceView
      requestDisallowInterceptTouchEvent
      gestureSettings={{
        pinchPanEnabled: true,
        pinchZoomEnabled: true,
        pinchZoomDecelerationEnabled: false,
        pitchEnabled: false,
        rotateEnabled: false,
        rotateDecelerationEnabled: false,
      }}>
      <Mapbox.Camera ref={cameraRef} defaultSettings={{ centerCoordinate: center, zoomLevel: 11.2, pitch: 45 }} />
      <Mapbox.ShapeSource
        ref={sourceRef}
        id="korantis-venues"
        shape={shape}
        cluster
        hitbox={{ width: 52, height: 52 }}
        clusterRadius={60}
        clusterMaxZoomLevel={16}
        onPress={async (event) => {
          const feature = event.features[0];
          if ((feature?.properties?.cluster || feature?.properties?.point_count) && feature.geometry.type === 'Point') {
            onSelect(null);
            try {
              const zoom = await sourceRef.current?.getClusterExpansionZoom(feature);
              if (typeof zoom === 'number') {
                cameraRef.current?.setCamera({
                  centerCoordinate: feature.geometry.coordinates as [number, number],
                  zoomLevel: Math.min(zoom, 18),
                  pitch: 45,
                  animationDuration: 500,
                });
              }
            } catch {
              cameraRef.current?.setCamera({
                centerCoordinate: feature.geometry.coordinates as [number, number],
                zoomLevel: 14,
                pitch: 45,
                animationDuration: 500,
              });
            }
            return;
          }
          const venueId = feature?.properties?.venueId;
          if (typeof venueId === 'string') onSelect(venueId);
        }}>
        <Mapbox.CircleLayer
          id="venue-clusters"
          filter={['has', 'point_count']}
          style={{ circleColor: colors.blackWarm, circleRadius: 20, circleStrokeColor: colors.gold, circleStrokeWidth: 1.5 }}
        />
        <Mapbox.SymbolLayer
          id="venue-cluster-count"
          filter={['has', 'point_count']}
          style={{ textField: ['get', 'point_count_abbreviated'], textColor: colors.text, textSize: 11 }}
        />
        <Mapbox.CircleLayer
          id="venue-points"
          filter={['!', ['has', 'point_count']]}
          style={{
            circleColor: ['case', ['==', ['get', 'isSaved'], true], colors.blackWarm, colors.gold],
            circleRadius: ['case', ['==', ['get', 'isSaved'], true], 8, 7],
            circleStrokeColor: ['case', ['==', ['get', 'isSaved'], true], colors.gold, colors.black],
            circleStrokeWidth: 2,
          }}
        />
      </Mapbox.ShapeSource>
      <Mapbox.ShapeSource
        id="korantis-selected-venue"
        shape={selectedShape}
        hitbox={{ width: 64, height: 64 }}
        onPress={() => {
          if (selectedId) onSelect(selectedId);
        }}>
        <Mapbox.CircleLayer
          id="venue-selected-wave-secondary"
          style={{
            circleColor: 'rgba(201,169,110,0.02)',
            circleRadius: secondaryExpanded ? 58 : 14,
            circleRadiusTransition: { duration: secondaryExpanded ? 2000 : 0, delay: 0 },
            circleStrokeColor: colors.gold,
            circleStrokeOpacity: secondaryExpanded ? 0 : 0.5,
            circleStrokeOpacityTransition: { duration: secondaryExpanded ? 2000 : 0, delay: 0 },
            circleStrokeWidth: 1,
            circlePitchAlignment: 'map',
            circlePitchScale: 'map',
          }}
        />
        <Mapbox.CircleLayer
          id="venue-selected-wave-primary"
          style={{
            circleColor: 'rgba(201,169,110,0.03)',
            circleRadius: primaryExpanded ? 44 : 14,
            circleRadiusTransition: { duration: primaryExpanded ? 2000 : 0, delay: 0 },
            circleStrokeColor: colors.gold,
            circleStrokeOpacity: primaryExpanded ? 0 : 0.8,
            circleStrokeOpacityTransition: { duration: primaryExpanded ? 2000 : 0, delay: 0 },
            circleStrokeWidth: 1.5,
            circlePitchAlignment: 'map',
            circlePitchScale: 'map',
          }}
        />
        <Mapbox.CircleLayer
          id="venue-selected-halo"
          style={{
            circleColor: 'rgba(201,169,110,0.08)',
            circleRadius: 22,
            circleStrokeColor: colors.gold,
            circleStrokeOpacity: 0.65,
            circleStrokeWidth: 1.5,
            circleBlur: 0.15,
          }}
        />
        <Mapbox.CircleLayer
          id="venue-selected-point"
          style={{
            circleColor: colors.text,
            circleRadius: 10,
            circleStrokeColor: colors.gold,
            circleStrokeWidth: 2,
          }}
        />
      </Mapbox.ShapeSource>
      <Mapbox.ShapeSource id="korantis-user-location" shape={userShape}>
        <Mapbox.CircleLayer id="user-location-halo" style={{ circleColor: 'rgba(245,240,232,0.18)', circleRadius: 13, circleStrokeColor: 'rgba(245,240,232,0.55)', circleStrokeWidth: 1 }} />
        <Mapbox.CircleLayer id="user-location-core" style={{ circleColor: colors.text, circleRadius: 5, circleStrokeColor: '#4A6B8A', circleStrokeWidth: 2 }} />
      </Mapbox.ShapeSource>
    </Mapbox.MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black, paddingHorizontal: 36 },
  missingTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 25, textAlign: 'center' },
  missingBody: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 10 },
});
