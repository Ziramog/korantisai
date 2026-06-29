export type CityCode = 'BUE' | 'COR' | 'NYC' | 'DXB';

export type CityOption = {
  code: CityCode;
  name: string;
  eyebrow: string;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
};

export const CITIES: readonly CityOption[] = [
  { code: 'BUE', name: 'Buenos Aires', eyebrow: 'BUE', bounds: { minLat: -34.8, maxLat: -34.4, minLng: -58.65, maxLng: -58.2 } },
  { code: 'COR', name: 'Córdoba', eyebrow: 'COR', bounds: { minLat: -31.55, maxLat: -31.25, minLng: -64.35, maxLng: -64.05 } },
  { code: 'NYC', name: 'New York', eyebrow: 'NYC', bounds: { minLat: 40.45, maxLat: 40.95, minLng: -74.3, maxLng: -73.65 } },
  { code: 'DXB', name: 'Dubai', eyebrow: 'DXB', bounds: { minLat: 24.75, maxLat: 25.45, minLng: 54.85, maxLng: 55.65 } },
] as const;

export function cityForCoordinates(lat: number, lng: number): CityCode | null {
  const match = CITIES.find(({ bounds }) =>
    lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng,
  );
  return match?.code ?? null;
}
