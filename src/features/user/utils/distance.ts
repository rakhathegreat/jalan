import type { NearbyTree } from '../types/dashboard';

const toRad = (value: number) => (value * Math.PI) / 180;

export const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000; // meters
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.round(R * c);
};

export const formatDistance = (meters?: number) => {
  if (meters === undefined) return '';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export const mapNearbyWithDistance = (
  origin: { lat: number; lng: number },
  trees: NearbyTree[],
  limit = 5
) =>
  trees
    .map((tree) => ({
      ...tree,
      distance_m: distanceMeters(origin, { lat: tree.lat, lng: tree.lng }),
    }))
    .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0))
    .slice(0, limit);
