import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Korantis',
  slug: 'korantis-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/korantis-logo.jpeg',
  scheme: 'korantis',
  userInterfaceStyle: 'dark',
  ios: {
    icon: './assets/images/korantis-logo.jpeg',
    bundleIdentifier: 'com.korantis.app',
    associatedDomains: ['applinks:www.korantis.com'],
    supportsTablet: false,
  },
  android: {
    package: 'com.korantis.app',
    versionCode: 1,
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      backgroundColor: '#0A0A0A',
      foregroundImage: './assets/images/korantis-logo.jpeg',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'www.korantis.com',
            pathPrefix: '/auth/mobile/callback',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Korantis usa tu ubicación para mostrarte atmósferas cercanas en el Atlas.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0A0A0A',
        image: './assets/images/korantis-logo.jpeg',
        imageWidth: 140,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: 'b91200f1-a21a-4279-a548-16428e629d58',
    },
  },
};

export default config;
