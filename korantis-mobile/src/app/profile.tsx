import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CITIES, type CityCode } from '@/shared/cities';
import { useTasteProfile } from '@/features/ranking/taste-profile-context';
import { useAuth } from '@/features/auth/auth-context';
import { BottomNav } from '@/shared/components/bottom-nav';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useSavedVenues } from '@/shared/hooks/use-saved-venues';
import { colors, fonts } from '@/shared/theme/tokens';

const CITY_STORAGE_KEY = 'korantis-city-v1';
const LANGUAGE_STORAGE_KEY = 'korantis-language-v1';

export default function ProfileScreen() {
  const [city, setCity] = useState<CityCode>('BUE');
  const [language, setLanguage] = useState<'ES' | 'EN'>('ES');
  const { savedIds, clearSaved, syncError } = useSavedVenues();
  const { resetTaste } = useTasteProfile();
  const { user, loading: authLoading, working: authWorking, configured: authConfigured, error: authError, signInWithGoogle, signOut } = useAuth();
  const displayName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : user?.email ?? 'Tu perfil Korantis';

  useEffect(() => {
    void AsyncStorage.multiGet([CITY_STORAGE_KEY, LANGUAGE_STORAGE_KEY]).then((entries) => {
      const storedCity = entries[0][1];
      const storedLanguage = entries[1][1];
      if (CITIES.some((item) => item.code === storedCity)) setCity(storedCity as CityCode);
      if (storedLanguage === 'ES' || storedLanguage === 'EN') setLanguage(storedLanguage);
    });
  }, []);

  const changeCity = (next: CityCode) => {
    setCity(next);
    void AsyncStorage.setItem(CITY_STORAGE_KEY, next);
  };

  const changeLanguage = (next: 'ES' | 'EN') => {
    setLanguage(next);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  };

  const resetLocalProfile = () => {
    Alert.alert('Restablecer perfil local', 'Se borrarán guardados y preferencias de este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restablecer', style: 'destructive', onPress: () => { clearSaved(); resetTaste(); changeCity('BUE'); changeLanguage('ES'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="PERFIL DE GUSTO" title="Vos" description="Korantis aprende del tipo de lugares que elegís, guardás y dejás pasar." />

        <View style={styles.identityCard}>
          <View style={styles.avatar}><Ionicons name="person-outline" size={27} color={colors.gold} /></View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityTitle}>{user ? displayName : 'Modo invitado'}</Text>
            <Text style={styles.identityBody}>{savedIds.size} lugares guardados {user ? 'y sincronizados' : 'en este dispositivo'}</Text>
          </View>
          <Text style={styles.localBadge}>{user ? 'SYNC' : 'LOCAL'}</Text>
        </View>

        <SectionTitle>CIUDAD ACTIVA</SectionTitle>
        <View style={styles.optionGrid}>
          {CITIES.map((item) => (
            <Pressable key={item.code} onPress={() => changeCity(item.code)} style={[styles.option, city === item.code && styles.optionActive]}>
              <Text style={[styles.optionCode, city === item.code && styles.optionCodeActive]}>{item.code}</Text>
              <Text style={styles.optionName}>{item.name}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle>IDIOMA</SectionTitle>
        <View style={styles.segmented}>
          {(['ES', 'EN'] as const).map((item) => (
            <Pressable key={item} onPress={() => changeLanguage(item)} style={[styles.segment, language === item && styles.segmentActive]}>
              <Text style={[styles.segmentText, language === item && styles.segmentTextActive]}>{item === 'ES' ? 'Español' : 'English'}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle>TU SEÑAL</SectionTitle>
        <View style={styles.signalCard}>
          <SignalRow icon="heart-outline" title="Guardados" value={savedIds.size.toString()} />
          <View style={styles.rule} />
          <SignalRow icon="location-outline" title="Ciudad" value={city} />
          <View style={styles.rule} />
          <SignalRow icon="language-outline" title="Idioma" value={language} />
        </View>

        <SectionTitle>CUENTA</SectionTitle>
        <Pressable
          disabled={authLoading || authWorking || (!authConfigured && !user)}
          onPress={() => void (user ? signOut() : signInWithGoogle())}
          style={[styles.accountButton, (authLoading || authWorking || (!authConfigured && !user)) && styles.accountButtonDisabled]}>
          {authLoading || authWorking ? <ActivityIndicator color={colors.gold} size="small" /> : <Ionicons name={user ? 'log-out-outline' : 'logo-google'} size={17} color={colors.text} />}
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>{user ? 'Cerrar sesión' : 'Continuar con Google'}</Text>
            <Text style={styles.accountBody}>{user?.email ?? (authConfigured ? 'Sincronizá Guardados y tu perfil de gusto' : 'Agregá las variables públicas de Supabase')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
        </Pressable>
        {authError || syncError ? <Text style={styles.accountError}>{authError ?? syncError}</Text> : null}

        <Pressable onPress={resetLocalProfile} style={styles.resetButton}><Text style={styles.resetText}>RESTABLECER PERFIL LOCAL</Text></Pressable>
        <Text style={styles.version}>KORANTIS MOBILE · 0.1.0</Text>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SignalRow({ icon, title, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; value: string }) {
  return <View style={styles.signalRow}><Ionicons name={icon} size={16} color={colors.gold} /><Text style={styles.signalTitle}>{title}</Text><Text style={styles.signalValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  content: { paddingHorizontal: 10, paddingBottom: 100 },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', backgroundColor: colors.surface },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(201,169,110,0.3)', backgroundColor: 'rgba(201,169,110,0.06)' },
  identityCopy: { flex: 1 },
  identityTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 20 },
  identityBody: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 10, marginTop: 4 },
  localBadge: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 7, letterSpacing: 1.2 },
  sectionTitle: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.6, marginTop: 34, marginBottom: 13 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { width: '48.8%', minHeight: 67, justifyContent: 'center', borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.018)' },
  optionActive: { borderColor: 'rgba(201,169,110,0.45)', backgroundColor: 'rgba(201,169,110,0.08)' },
  optionCode: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1 },
  optionCodeActive: { color: colors.gold },
  optionName: { color: colors.textTertiary, fontFamily: fonts.body, fontSize: 9, marginTop: 4 },
  segmented: { flexDirection: 'row', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', padding: 3 },
  segment: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  segmentActive: { backgroundColor: colors.gold },
  segmentText: { color: colors.textSecondary, fontFamily: fonts.bodyMedium, fontSize: 10 },
  segmentTextActive: { color: colors.black },
  signalCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', backgroundColor: 'rgba(255,255,255,0.018)', paddingHorizontal: 16 },
  signalRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  signalTitle: { flex: 1, color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  signalValue: { color: colors.gold, fontFamily: fonts.bodyMedium, fontSize: 10 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: '#2A2520' },
  accountButton: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2A2520', paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.018)' },
  accountButtonDisabled: { opacity: 0.5 },
  accountCopy: { flex: 1 },
  accountTitle: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 12 },
  accountBody: { color: colors.textTertiary, fontFamily: fonts.body, fontSize: 9, marginTop: 4 },
  accountError: { color: colors.error, fontFamily: fonts.body, fontSize: 10, lineHeight: 16, marginTop: 10, paddingHorizontal: 5 },
  resetButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  resetText: { color: colors.error, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.2 },
  version: { color: colors.textTertiary, fontFamily: fonts.body, fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 12 },
});
