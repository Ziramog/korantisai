import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // The Expo import namespace rule currently trips the optional unrs native
      // resolver binding on this Windows setup before source linting starts.
      // TypeScript remains the source of truth for module resolution.
      'import/namespace': 'off',
      'import/no-duplicates': 'off',
      'import/no-unresolved': 'off',
    },
  },
]);
