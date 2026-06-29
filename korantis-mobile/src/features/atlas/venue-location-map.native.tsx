import Mapbox from '@rnmapbox/maps';
import type { FeatureCollection, Point } from 'geojson';
import { StyleSheet, Text, View } from 'react-native';

import { env } from '@/shared/config/env';
import { colors, fonts } from '@/shared/theme/tokens';

export type VenueLocationMapProps = {
  coordinate: [number, number];
  label: string;
};

if (env.mapboxAccessToken) void Mapbox.setAccessToken(env.mapboxAccessToken);

export function VenueLocationMap({ coordinate, label }: VenueLocationMapProps) {
  if (!env.mapboxAccessToken) return <MissingMap />;

  const shape: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coordinate } }],
  };

  return (
    <View style={styles.shell}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        compassEnabled={false}
        pitchEnabled
        zoomEnabled
        scrollEnabled>
        <Mapbox.Camera defaultSettings={{ centerCoordinate: coordinate, zoomLevel: 14.8, pitch: 42 }} />
        <Mapbox.ShapeSource id="venue-location" shape={shape}>
          <Mapbox.CircleLayer id="venue-location-halo" style={{ circleColor: 'rgba(201,169,110,0.10)', circleRadius: 28, circleStrokeColor: colors.gold, circleStrokeOpacity: 0.4, circleStrokeWidth: 1.5 }} />
          <Mapbox.CircleLayer id="venue-location-core" style={{ circleColor: colors.gold, circleRadius: 7, circleStrokeColor: colors.blackWarm, circleStrokeWidth: 3 }} />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>
      <View pointerEvents="none" style={styles.tint} />
      <Text pointerEvents="none" style={styles.label}>{label.toUpperCase()}</Text>
      <Text pointerEvents="none" style={styles.credit}>MAPBOX · KORANTIS ATLAS</Text>
    </View>
  );
}

function MissingMap() {
  return <View style={[styles.shell, styles.missing]}><Text style={styles.missingText}>MAPA NO DISPONIBLE</Text></View>;
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
