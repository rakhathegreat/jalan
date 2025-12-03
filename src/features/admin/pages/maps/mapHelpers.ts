import type * as GeoJSON from 'geojson';
import { RECENT_SEARCH_KEY } from './mapConfig';
import type { RecentSearchItem, RoadRow } from './types';

export const normalizeId = (id: string | number) => String(id);

const KERUSAKAN_LEVEL_LABEL: Record<string, string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
};

export const REPORT_STATUS_META: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  verified: {
    label: 'Verified',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  in_progress: {
    label: 'In progress',
    className: 'border-purple-200 bg-purple-50 text-purple-700',
  },
  done: {
    label: 'Done',
    className: 'border-brand-200 bg-brand-50 text-brand-700',
  },
  default: {
    label: 'Unknown',
    className: 'border-gray-200 bg-gray-50 text-gray-700',
  },
};

export const getRoadPrimaryLabel = (road: RoadRow) =>
  road.name ?? road.highway ?? `Ruas ${road.id}`;

export const getRoadSecondaryLabel = (road: RoadRow) =>
  road.highway ?? road.kecamatan ?? road.kota ?? '-';

export const extractCoordinates = (
  geom: GeoJSON.LineString | GeoJSON.MultiLineString | null | undefined
): [number, number][] => {
  if (!geom) return [];
  if (geom.type === 'LineString') {
    return (geom.coordinates as [number, number][]).filter(Boolean);
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates.flat().filter(Boolean) as [number, number][];
  }
  return [];
};

export const loadRecentSearches = (): RecentSearchItem[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RecentSearchItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch (err) {
    console.warn('Gagal parse recent search:', err);
    return [];
  }
};

export const persistRecentSearches = (items: RecentSearchItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Gagal simpan recent search:', err);
  }
};

export const formatReportCode = (id: number | string) =>
  `RPT-${String(id).padStart(4, '0')}`;

export const formatReportDate = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatKerusakanLevel = (level: string | null) => {
  if (!level) return '-';
  const lower = level.toLowerCase();
  return KERUSAKAN_LEVEL_LABEL[lower] ?? level;
};

export const parseBoolean = (value: any): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (['yes', 'true', '1'].includes(lowered)) return true;
    if (['no', 'false', '0'].includes(lowered)) return false;
  }
  return null;
};

export const formatMaxSpeed = (value: any): string => {
  if (value === null || value === undefined) return 'Tidak diketahui';
  if (typeof value === 'number') return `${value} km/jam`;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.]/g, ''));
    if (!Number.isNaN(numeric)) return `${numeric} km/jam`;
    return value;
  }
  return 'Tidak diketahui';
};

export const parseNumericValue = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  const parsed =
    typeof value === 'string'
      ? Number(value.replace(/[^\d.-]/g, ''))
      : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatDistance = (meters: number | null | undefined): string => {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return '-';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};
