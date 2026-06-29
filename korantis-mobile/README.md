# Korantis Mobile

Native Android/iOS client for Korantis, built with Expo SDK 56, React Native and Expo Router.

## Run locally

```bash
cp .env.example .env
npm install
npm start
```

`npm start` also launches a loopback-only API proxy on `127.0.0.1:8787`. Expo Web uses it to avoid browser CORS restrictions; Android and iOS continue calling `EXPO_PUBLIC_API_BASE_URL` directly. If Metro was already running when the proxy was added, stop it with `Ctrl+C` and restart `npm start`.

For the Android development build (required once Mapbox/native auth are added):

```bash
npm run android
```

This command requires a local Android SDK (`ANDROID_HOME` or `android/local.properties`). This workstation currently has Java 21 but no Android SDK. The alternative is to link the app to an Expo account and run:

```bash
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

`eas init` creates/links an external Expo project and therefore is intentionally left for the product owner account.

## Quality gates

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

The app reads the production-compatible `/api/venues` endpoint, validates the payload with Zod, infers canonical city from coordinates, persists the public query cache for weak networks, and implements Explore, venue detail, Atlas, Guardados and Vos. Venue order uses the same circadian inputs as the web app: local hour, quality, saved-memory resonance and the persisted 8D taste vector.

## Atlas and bottom navigation

Explore, Atlas, Guardados and Vos are real Expo Router routes. Guardados share one persisted provider across every screen. Atlas uses `@rnmapbox/maps` with clustering on Android/iOS and requires:

```text
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk...
```

Because Mapbox is a native module, an older development client cannot load Atlas. Rebuild it after installing the dependency:

```bash
# With a local Android SDK
npm run android

# Or using EAS
npx eas-cli@latest build --platform android --profile development
```

Web uses Mapbox GL and Android/iOS use the native Mapbox renderer. Atlas includes clusters, a synchronized venue carousel, current-location centering and animated selected markers. Location permission is requested only when the user taps the locate control.

## Google authentication and cloud sync

Add the public Supabase project values to `.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

Then add this redirect URL to the Supabase Auth allow list:

```text
korantis://auth/callback
```

Google OAuth uses PKCE. Native sessions are persisted in SecureStore. When a user signs in, local and remote `venue_interactions` with status `saved` are merged, pending local saves are uploaded, and the taste vector is hydrated from `profiles`.
