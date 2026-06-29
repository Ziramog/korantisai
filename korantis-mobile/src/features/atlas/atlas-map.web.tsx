import 'mapbox-gl/dist/mapbox-gl.css';

import type { FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, Map as MapboxMap, MapLayerMouseEvent } from 'mapbox-gl';
import { useEffect, useRef } from 'react';
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

function venuesToGeoJSON(venues: Venue[], savedIds: string[]): FeatureCollection<Point, { venueId: string; isSaved: boolean }> {
  return {
    type: 'FeatureCollection',
    features: venues.map((venue) => ({
      type: 'Feature',
      id: venue.id,
      properties: { venueId: venue.id, isSaved: savedIds.includes(venue.id) },
      geometry: { type: 'Point', coordinates: [venue.lng, venue.lat] },
    })),
  };
}

function userLocationGeoJSON(coordinate?: [number, number] | null): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: coordinate ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coordinate } }] : [],
  };
}

export function AtlasMap({ venues, center, selectedId, savedIds, focusCoordinate, userCoordinate, onSelect }: AtlasMapProps) {
  const containerRef = useRef<View>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const venuesRef = useRef(venues);
  const savedIdsRef = useRef(savedIds);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    venuesRef.current = venues;
  }, [venues]);

  useEffect(() => {
    savedIdsRef.current = savedIds;
  }, [savedIds]);

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
        center,
        zoom: 11.2,
        pitch: 45,
        antialias: true,
        minZoom: 3,
        maxZoom: 18,
        attributionControl: false,
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.on('load', () => {
        if (!map) return;
        map.addSource('korantis-venues', {
          type: 'geojson',
          data: venuesToGeoJSON(venuesRef.current, savedIdsRef.current),
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 60,
        });
        map.addLayer({
          id: 'venue-clusters',
          type: 'circle',
          source: 'korantis-venues',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': colors.blackWarm,
            'circle-radius': 20,
            'circle-stroke-color': colors.gold,
            'circle-stroke-width': 1.5,
          },
        });
        map.addLayer({
          id: 'venue-cluster-count',
          type: 'symbol',
          source: 'korantis-venues',
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 11 },
          paint: { 'text-color': colors.text },
        });
        map.addLayer({
          id: 'venue-selected-halo',
          type: 'circle',
          source: 'korantis-venues',
          filter: ['==', ['get', 'venueId'], '__none__'],
          paint: {
            'circle-color': 'rgba(201,169,110,0.08)',
            'circle-radius': 22,
            'circle-stroke-color': colors.gold,
            'circle-stroke-opacity': 0.65,
            'circle-stroke-width': 1.5,
            'circle-blur': 0.15,
          },
        });
        map.addLayer({
          id: 'venue-selected-halo-secondary',
          type: 'circle',
          source: 'korantis-venues',
          filter: ['==', ['get', 'venueId'], '__none__'],
          paint: {
            'circle-color': 'rgba(201,169,110,0.02)',
            'circle-radius': 22,
            'circle-stroke-color': colors.gold,
            'circle-stroke-opacity': 0.4,
            'circle-stroke-width': 1,
          },
        });
        map.addLayer({
          id: 'venue-points',
          type: 'circle',
          source: 'korantis-venues',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['case', ['==', ['get', 'isSaved'], true], colors.blackWarm, colors.gold],
            'circle-radius': ['case', ['==', ['get', 'isSaved'], true], 8, 7],
            'circle-stroke-color': ['case', ['==', ['get', 'isSaved'], true], colors.gold, colors.black],
            'circle-stroke-width': 2,
          },
        });
        map.addSource('user-location', {
          type: 'geojson',
          data: userLocationGeoJSON(userCoordinate),
        });
        map.addLayer({ id: 'user-location-halo', type: 'circle', source: 'user-location', paint: { 'circle-color': 'rgba(245,240,232,0.18)', 'circle-radius': 13, 'circle-stroke-color': 'rgba(245,240,232,0.55)', 'circle-stroke-width': 1 } });
        map.addLayer({ id: 'user-location-core', type: 'circle', source: 'user-location', paint: { 'circle-color': colors.text, 'circle-radius': 5, 'circle-stroke-color': '#4A6B8A', 'circle-stroke-width': 2 } });

        map.on('click', 'venue-points', (event: MapLayerMouseEvent) => {
          const venueId = event.features?.[0]?.properties?.venueId;
          if (typeof venueId === 'string') onSelectRef.current(venueId);
        });
        map.on('click', 'venue-clusters', (event: MapLayerMouseEvent) => {
          const feature = event.features?.[0];
          const geometry = feature?.geometry;
          if (geometry?.type !== 'Point') return;
          const clusterId = feature?.properties?.cluster_id;
          const source = map?.getSource('korantis-venues') as GeoJSONSource | undefined;
          if (typeof clusterId !== 'number' || !source || !map) return;
          onSelectRef.current(null);
          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error || typeof zoom !== 'number' || !map) return;
            map.easeTo({ center: geometry.coordinates as [number, number], zoom: Math.min(zoom, 18), pitch: 45, duration: 500 });
          });
        });
        for (const layer of ['venue-points', 'venue-clusters']) {
          map.on('mouseenter', layer, () => { if (map) map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layer, () => { if (map) map.getCanvas().style.cursor = ''; });
        }
      });
    });

    return () => {
      disposed = true;
      mapRef.current = null;
      map?.remove();
    };
    // The map instance is created once; subsequent center/data changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const venue = venues.find((item) => item.id === selectedId);
    map.easeTo({ center: venue ? [venue.lng, venue.lat] : focusCoordinate ?? center, zoom: venue ? 15.5 : focusCoordinate ? 14.5 : 11.2, pitch: 45, duration: 650 });
  }, [center, focusCoordinate, selectedId, venues]);

  useEffect(() => {
    const source = mapRef.current?.getSource('korantis-venues') as GeoJSONSource | undefined;
    source?.setData(venuesToGeoJSON(venues, savedIds));
  }, [savedIds, venues]);

  useEffect(() => {
    const source = mapRef.current?.getSource('user-location') as GeoJSONSource | undefined;
    source?.setData(userLocationGeoJSON(userCoordinate));
  }, [userCoordinate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('venue-points')) return;
    map.setPaintProperty('venue-points', 'circle-color', [
      'case',
      ['==', ['get', 'venueId'], selectedId ?? ''],
      colors.text,
      colors.gold,
    ]);
    map.setPaintProperty('venue-points', 'circle-radius', [
      'case',
      ['==', ['get', 'venueId'], selectedId ?? ''],
      10,
      7,
    ]);
    if (map.getLayer('venue-selected-halo')) {
      map.setFilter('venue-selected-halo', ['==', ['get', 'venueId'], selectedId ?? '__none__']);
    }
    if (map.getLayer('venue-selected-halo-secondary')) {
      map.setFilter('venue-selected-halo-secondary', ['==', ['get', 'venueId'], selectedId ?? '__none__']);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let animationFrame = 0;
    const startedAt = Date.now();
    const animate = () => {
      const map = mapRef.current;
      if (map?.getLayer('venue-selected-halo')) {
        const elapsed = Date.now() - startedAt;
        const primary = (elapsed % 2000) / 2000;
        const secondaryElapsed = Math.max(0, elapsed - 600);
        const secondary = (secondaryElapsed % 2000) / 2000;
        map.setPaintProperty('venue-selected-halo', 'circle-radius', 14 + primary * 30);
        map.setPaintProperty('venue-selected-halo', 'circle-stroke-opacity', 0.8 * (1 - primary));
        if (map.getLayer('venue-selected-halo-secondary')) {
          map.setPaintProperty('venue-selected-halo-secondary', 'circle-radius', 14 + secondary * 44);
          map.setPaintProperty('venue-selected-halo-secondary', 'circle-stroke-opacity', elapsed < 600 ? 0 : 0.5 * (1 - secondary));
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [selectedId]);

  if (!env.mapboxAccessToken) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Falta el token público de Mapbox.</Text>
        <Text style={styles.missingBody}>Configurá EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN y reiniciá Metro.</Text>
      </View>
    );
  }

  return <View ref={containerRef} style={styles.map} />;
}

const styles = StyleSheet.create({
  map: { flex: 1, overflow: 'hidden', backgroundColor: '#141312' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black, paddingHorizontal: 36 },
  missingTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 25, textAlign: 'center' },
  missingBody: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 10 },
});
