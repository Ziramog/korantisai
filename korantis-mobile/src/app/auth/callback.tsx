import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/shared/theme/tokens';

export default function AuthCallbackScreen() {
  const router = useRouter();
  useEffect(() => {
    const timeout = setTimeout(() => router.replace('/profile'), 500);
    return () => clearTimeout(timeout);
  }, [router]);
  return <View style={styles.screen}><ActivityIndicator color={colors.gold} /><Text style={styles.text}>CONECTANDO TU ATLAS…</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, backgroundColor: colors.black },
  text: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.5 },
});
