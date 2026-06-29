import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) =>
        failureCount < 2 && (!(error instanceof ApiError) || error.retryable),
      retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 4_000),
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'korantis-public-query-cache-v1',
  throttleTime: 1_000,
});
