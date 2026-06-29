# Korantis Mobile

Native Android/iOS client for Korantis, built with Expo SDK 56, React Native and Expo Router. The current mobile build is Expo Go compatible.

## Run locally

```bash
cp .env.example .env
npm install
npm start
```

`npm start` also launches a loopback-only API proxy on `127.0.0.1:8787`. Expo Web uses it to avoid browser CORS restrictions; Android and iOS continue calling `EXPO_PUBLIC_API_BASE_URL` directly. If Metro was already running when the proxy was added, stop it with `Ctrl+C` and restart `npm start`.

For a local Android development build:

```bash
npm run android
```

This command requires `JAVA_HOME` plus a local Android SDK (`ANDROID_HOME` or `android/local.properties`). Expo Go remains the fastest local path when local Android tooling is not installed.

## Installable builds

The project already has `eas.json` profiles for installable Android builds:

- `development`: internal development APK with Expo Dev Client.
- `preview`: internal APK for installing on a device without the Play Store.
- `production`: store-oriented production build.

Log in with the product Expo account, then run:

```bash
npx eas-cli@latest login
npm run build:android:preview
```

For a production Android build:

```bash
npm run build:android:production
```

This repository is already linked to an EAS project in `app.config.ts`. If building from a fresh checkout, confirm `eas whoami` returns the expected Expo account before uploading credentials or generating release builds.

## Over-the-air updates

Installable builds include EAS Update support. Use OTA only for JavaScript, styling, copy, assets and API behavior that does not change the native runtime:

```bash
npm run update:preview -- --message "Fix mobile UI"
npm run update:production -- --message "Release mobile UI fix"
```

Any native dependency, permission, Expo SDK, icon/splash or `app.config.ts` runtime change requires a new build instead of OTA.

## Quality gates

```bash
npm run typecheck
npm run lint
npm test
npx expo export --platform web
```

The app reads the production-compatible `/api/venues` endpoint, validates the payload with Zod, infers canonical city from coordinates, persists the public query cache for weak networks, and implements Explore, venue detail, Atlas, Guardados and Vos. Venue order uses the same circadian inputs as the web app: local hour, quality, saved-memory resonance and the persisted 8D taste vector.

## Atlas and bottom navigation

Explore, Atlas, Guardados and Vos are real Expo Router routes. Guardados share one persisted provider across every screen. Android/iOS installable builds use `@rnmapbox/maps` for the native Atlas map with clustering, venue selection, current-location centering and animated selected markers.

Web uses Mapbox GL. Native and web maps require:

```text
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk...
```

Because Mapbox is a native module, changes to the native map dependency require a new build:

```bash
# With a local Android SDK
npm run android

# Or using EAS
npx eas-cli@latest build --platform android --profile development
```

Location permission is requested only when the user taps the locate control.

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
