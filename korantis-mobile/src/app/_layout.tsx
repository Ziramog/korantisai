import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display/400Regular_Italic';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect } from 'react';

import { queryClient, queryPersister } from '@/shared/query/query-client';
import { SavedVenuesProvider } from '@/shared/hooks/use-saved-venues';
import { TasteProfileProvider } from '@/features/ranking/taste-profile-context';
import { AuthProvider } from '@/features/auth/auth-context';
import { colors } from '@/shared/theme/tokens';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000 }}>
      <AuthProvider>
        <TasteProfileProvider>
          <SavedVenuesProvider>
          <StatusBar style="light" />
          <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.black },
            headerStyle: { backgroundColor: colors.black },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: 'DMSans_500Medium' },
            headerShadowVisible: false,
            headerShown: false,
            animation: 'fade',
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="atlas" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="venue/[venueId]" />
          <Stack.Screen name="auth/callback" />
          </Stack>
          </SavedVenuesProvider>
        </TasteProfileProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
