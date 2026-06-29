import 'mapbox-gl/dist/mapbox-gl.css';

import type { Map as MapboxMap } from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { env } from '@/shared/config/env';
import { colors, fonts } from '@/shared/theme/tokens';

export type VenueLocationMapProps = {
  coordinate: [number, number];
  label: string;
};

export function VenueLocationMap({ coordinate, label }: VenueLocationMapProps) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (!env.mapboxAccessToken || !containerRef.current) return;
    let disposed = false;
    let map: MapboxMap | null = null;

    void import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (disposed || !containerRef.current) return;
      mapboxgl.accessToken = env.mapboxAccessToken!;
      map = new mapboxgl.Map({
        container: containerRef.current as unknown as HTMLElement,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: coordinate,
        zoom: 14.8,
        pitch: 42,
        antialias: true,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.on('load', () => {
        if (!map) return;
        map.addSource('venue-location', { type: 'geojson', data: { type: 'Point', coordinates: coordinate } });
        map.addLayer({ id: 'venue-location-halo', type: 'circle', source: 'venue-location', paint: { 'circle-color': 'rgba(201,169,110,0.10)', 'circle-radius': 28, 'circle-stroke-color': colors.gold, 'circle-stroke-opacity': 0.4, 'circle-stroke-width': 1.5 } });
        map.addLayer({ id: 'venue-location-core', type: 'circle', source: 'venue-location', paint: { 'circle-color': colors.gold, 'circle-radius': 7, 'circle-stroke-color': colors.blackWarm, 'circle-stroke-width': 3 } });
      });
    });

    return () => { disposed = true; map?.remove(); };
  }, [coordinate]);

  if (!env.mapboxAccessToken) return <View style={[styles.shell, styles.missing]}><Text style={styles.missingText}>MAPA NO DISPONIBLE</Text></View>;

  return (
    <View style={styles.shell}>
      <View ref={containerRef} style={styles.map} />
      <View pointerEvents="none" style={styles.tint} />
      <Text pointerEvents="none" style={styles.label}>{label.toUpperCase()}</Text>
      <Text pointerEvents="none" style={styles.credit}>◉ MAPBOX · KORANTIS ATLAS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { height: 285, borderRadius: 18, overflow: 'hidden', backgroundColor: '#161514', borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2724' },
  map: { flex: 1 },
  tint: { position: 'absolute', inset: 0, backgroundColor: 'rgba(46,37,30,0.08)' },
  label: { position: 'absolute', right: 18, top: 18, color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.2 },
  credit: { position: 'absolute', left: 13, bottom: 12, color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 8, letterSpacing: 0.7 },
  missing: { alignItems: 'center', justifyContent: 'center' },
  missingText: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.4 },
});
