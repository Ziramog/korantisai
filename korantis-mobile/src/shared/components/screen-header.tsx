import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/shared/theme/tokens';

export function ScreenHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 24 },
  eyebrow: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.8, marginBottom: 9 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 37, lineHeight: 42 },
  description: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 20, marginTop: 10, maxWidth: 340 },
});
