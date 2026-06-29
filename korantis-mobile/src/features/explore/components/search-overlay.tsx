import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Venue } from '@/features/venues/api/venue-schema';
import { cloudinaryCardUrl } from '@/features/venues/api/venues-repository';
import { colors, fonts } from '@/shared/theme/tokens';

const CATEGORIES = [
  { label: 'Café de especialidad', query: 'café' },
  { label: 'Vino natural', query: 'vino natural' },
  { label: 'Cocktails', query: 'cocktails' },
  { label: 'Cita', query: 'cita íntima' },
  { label: 'Para leer', query: 'leer tranquilo' },
  { label: 'Restaurante', query: 'restaurante' },
] as const;

const QUICK_IDEAS = ['Chacarita', 'Palermo', 'Patio', 'Vino', 'Íntimo', 'Café'] as const;

type Props = {
  visible: boolean;
  query: string;
  venues: Venue[];
  onChangeQuery: (query: string) => void;
  onClose: () => void;
  onSelectVenue: (venue: Venue) => void;
};

export function SearchOverlay({ visible, query, venues, onChangeQuery, onClose, onSelectVenue }: Props) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(focusTimer);
  }, [visible]);

  const hasQuery = Boolean(query.trim());

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <View style={styles.searchShell}>
              <Ionicons name="search-outline" size={18} color={colors.goldMuted} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={onChangeQuery}
                placeholder="Buscar lugar, mood, barrio..."
                placeholderTextColor={colors.goldMuted}
                selectionColor={colors.gold}
                returnKeyType="search"
                autoCorrect={false}
                style={styles.input}
                accessibilityLabel="Buscar lugares"
              />
              {hasQuery ? (
                <Pressable onPress={() => onChangeQuery('')} accessibilityLabel="Limpiar búsqueda" hitSlop={10}>
                  <Ionicons name="close" size={17} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>

          {hasQuery ? (
            <FlatList
              data={venues.slice(0, 12)}
              keyExtractor={(venue) => venue.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.results}
              ListHeaderComponent={
                <View style={styles.resultHeader}>
                  <Ionicons name="sparkles-outline" size={14} color={colors.goldMuted} />
                  <Text style={styles.eyebrow}>RESULTADOS PARA “{query.trim()}” · {venues.length}</Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable onPress={() => onSelectVenue(item)} style={({ pressed }) => [styles.resultCard, pressed && styles.pressed]}>
                  <Image source={{ uri: cloudinaryCardUrl(item.heroUrl) ?? undefined }} style={styles.resultImage} contentFit="cover" transition={140} />
                  <View style={styles.resultCopy}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.resultLocation} numberOfLines={1}>{item.location}</Text>
                    <Text style={styles.resultCategory} numberOfLines={1}>{item.category.replaceAll('_', ' ')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No encontramos lugares que coincidan.</Text>}
            />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.discovery}>
              <Text style={styles.eyebrow}>CATEGORÍAS</Text>
              <View style={styles.categoryWrap}>
                {CATEGORIES.map((category) => (
                  <Pressable key={category.label} onPress={() => onChangeQuery(category.query)} style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{category.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.quickHeading}>
                <Ionicons name="time-outline" size={14} color={colors.goldMuted} />
                <Text style={styles.eyebrow}>IDEAS RÁPIDAS</Text>
              </View>
              {QUICK_IDEAS.map((idea) => (
                <Pressable key={idea} onPress={() => onChangeQuery(idea)} style={styles.quickRow}>
                  <Text style={styles.quickText}>{idea}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.blackWarm },
  header: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(15,13,11,0.98)' },
  searchShell: { flex: 1, height: 51, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(201,169,110,0.45)', backgroundColor: 'rgba(255,255,255,0.025)' },
  input: { flex: 1, height: '100%', color: colors.text, fontFamily: fonts.body, fontSize: 14 },
  cancelButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 3 },
  cancelText: { color: colors.goldMuted, fontFamily: fonts.body, fontSize: 13 },
  discovery: { paddingHorizontal: 15, paddingTop: 24, paddingBottom: 40 },
  eyebrow: { color: colors.goldMuted, fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 1.5 },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 29 },
  categoryPill: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.045)' },
  categoryText: { color: colors.goldLight, fontFamily: fonts.body, fontSize: 12 },
  quickHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 },
  quickRow: { minHeight: 47, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.065)' },
  quickText: { color: colors.text, fontFamily: fonts.body, fontSize: 13 },
  results: { paddingHorizontal: 15, paddingTop: 22, paddingBottom: 42 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  resultCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.065)' },
  pressed: { opacity: 0.72 },
  resultImage: { width: 72, height: 72, borderRadius: 9, backgroundColor: colors.surface },
  resultCopy: { flex: 1, minWidth: 0 },
  resultName: { color: colors.text, fontFamily: fonts.display, fontSize: 17 },
  resultLocation: { color: colors.goldMuted, fontFamily: fonts.body, fontSize: 9, marginTop: 4, textTransform: 'uppercase' },
  resultCategory: { color: colors.textTertiary, fontFamily: fonts.body, fontSize: 9, marginTop: 3, textTransform: 'uppercase' },
  empty: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', paddingTop: 70 },
});
