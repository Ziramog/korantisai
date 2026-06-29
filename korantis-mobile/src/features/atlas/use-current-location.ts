import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export function useCurrentLocation() {
  const [coordinate, setCoordinate] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Necesitamos permiso de ubicación para centrar el Atlas.');
        return null;
      }
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next: [number, number] = [result.coords.longitude, result.coords.latitude];
      setCoordinate(next);
      return next;
    } catch {
      setError('No pudimos obtener tu ubicación. Revisá el GPS e intentá otra vez.');
      return null;
    } finally {
      setLocating(false);
    }
  }, []);

  return { coordinate, locating, error, locate };
}
