import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/shared/theme/tokens';

type TabId = 'explore' | 'atlas' | 'saved' | 'profile';

const ITEMS = [
  { id: 'explore' as const, label: 'Explore', icon: 'compass-outline' as const, route: '/' as const },
  { id: 'atlas' as const, label: 'Atlas', icon: 'location-outline' as const, route: '/atlas' as const },
  { id: 'saved' as const, label: 'Guardados', icon: 'bookmark-outline' as const, route: '/saved' as const },
  { id: 'profile' as const, label: 'Vos', icon: 'person-outline' as const, route: '/profile' as const },
];

export function BottomNav({ active: activeOverride }: { active?: TabId }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const active = activeOverride ?? routeToTab(pathname);

  return (
    <View style={[styles.shell, { height: 64 + Math.max(insets.bottom, 5), paddingBottom: Math.max(insets.bottom, 5) }]}>
      {ITEMS.map(({ id, label, icon, route }) => {
        const selected = id === active;
        return (
          <Pressable
            key={id}
            onPress={() => router.replace(route)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}>
            <Ionicons name={icon} size={19} color={selected ? colors.gold : '#66615B'} />
            <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function routeToTab(pathname: string): TabId {
  if (pathname.startsWith('/atlas')) return 'atlas';
  if (pathname.startsWith('/saved')) return 'saved';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'explore';
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(10,10,10,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#241F1B',
    zIndex: 50,
  },
  item: { width: 76, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { color: '#66615B', fontFamily: fonts.body, fontSize: 9.5 },
  labelActive: { color: colors.gold, fontFamily: fonts.bodyMedium },
});
