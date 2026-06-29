import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/shared/theme/tokens';

export type VenueLocationMapProps = {
  coordinate: [number, number];
  label: string;
};

export function VenueLocationMap({ coordinate, label }: VenueLocationMapProps) {
  return (
    <View style={styles.shell}>
      <View style={styles.crosshairHorizontal} />
      <View style={styles.crosshairVertical} />
      <View style={styles.halo} />
      <View style={styles.point} />
      <Text pointerEvents="none" style={styles.label}>{label.toUpperCase()}</Text>
      <Text pointerEvents="none" style={styles.coordinate}>{coordinate[1].toFixed(4)}, {coordinate[0].toFixed(4)}</Text>
      <Text pointerEvents="none" style={styles.credit}>EXPO GO · MAP PREVIEW</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 285,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#161514',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2724',
  },
  crosshairHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(201,169,110,0.16)',
  },
  crosshairVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(201,169,110,0.16)',
  },
  halo: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 58,
    height: 58,
    marginLeft: -29,
    marginTop: -29,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: 'rgba(201,169,110,0.44)',
    backgroundColor: 'rgba(201,169,110,0.08)',
  },
  point: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    borderRadius: 99,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.blackWarm,
  },
  label: {
    position: 'absolute',
    right: 18,
    top: 18,
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  coordinate: {
    position: 'absolute',
    left: 18,
    top: 18,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
  },
  credit: {
    position: 'absolute',
    left: 13,
    bottom: 12,
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 8,
    letterSpacing: 0.7,
  },
});
