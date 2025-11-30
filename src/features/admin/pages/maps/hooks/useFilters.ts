import { useMemo, useState } from 'react';
import type { RoadRow } from '../types';

export type RoadFilters = {
  condition: string[];
  status: string[];
  kelurahan: string[];
  jenisJalan: string[];
  tipeJalan: string[];
  rt: string[];
  rw: string[];
};

export type FilterOption = { value: string; label: string };
export type FilterOptions = {
  condition: FilterOption[];
  status: FilterOption[];
  kelurahan: FilterOption[];
  jenisJalan: FilterOption[];
  tipeJalan: FilterOption[];
};

const ROAD_TYPE_OPTIONS: FilterOption[] = [
  { value: 'nasional', label: 'Nasional' },
  { value: 'provinsi', label: 'Provinsi' },
  { value: 'kabupaten', label: 'Kabupaten' },
  { value: 'kota', label: 'Kota' },
  { value: 'desa', label: 'Desa' },
];

const CONDITION_OPTIONS: FilterOption[] = [
  { value: 'good', label: 'Good' },
  { value: 'minor damage', label: 'Minor damage' },
  { value: 'severe damage', label: 'Severe damage' },
];

const CONDITION_VALUES = new Set(CONDITION_OPTIONS.map((option) => option.value));

const KELURAHAN_OPTIONS: FilterOption[] = [{ value: 'banjar', label: 'Banjar' }];

const createInitialFilters = (): RoadFilters => ({
  condition: [],
  status: [],
  kelurahan: [],
  jenisJalan: [],
  tipeJalan: [],
  rt: [],
  rw: [],
});

const normalizeFilterValue = (value?: string | number | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const buildOptions = (
  roads: RoadRow[],
  picker: (road: RoadRow) => string | number | null
): FilterOption[] => {
  const map = new Map<string, string>();
  roads.forEach((road) => {
    const raw = picker(road);
    if (raw === undefined || raw === null) return;
    const label = String(raw);
    const normalized = normalizeFilterValue(label);
    if (!normalized) return;
    if (!map.has(normalized)) {
      map.set(normalized, label);
    }
  });

  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' }));
};

const matchesSelected = (selected: string[], candidate: string | null) => {
  if (!selected.length) return true;
  if (!candidate) return false;
  return selected.includes(candidate);
};

const normalizeCandidate = (candidate: string | number | null | undefined) => {
  const normalized = normalizeFilterValue(candidate);
  return normalized || null;
};

const normalizeConditionValue = (value: string | number | null | undefined) => {
  const normalized = normalizeCandidate(value);
  if (!normalized) return null;

  const cleaned = normalized.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (CONDITION_VALUES.has(cleaned)) return cleaned;

  return normalized;
};

const getRoadType = (road: RoadRow) =>
  road.tipe_jalan ??
  (road.props && typeof road.props === 'object'
    ? (road.props as any).tipe_jalan ?? (road.props as any).road_type ?? null
    : null);

export const useFilters = (roads: RoadRow[]) => {
  const [filters, setFilters] = useState<RoadFilters>(() => createInitialFilters());

  const filterOptions = useMemo<FilterOptions>(
    () => ({
      condition: CONDITION_OPTIONS,
      status: buildOptions(roads, (road) => road.status),
      kelurahan: KELURAHAN_OPTIONS,
      jenisJalan: buildOptions(roads, (road) => road.highway),
      tipeJalan: ROAD_TYPE_OPTIONS,
    }),
    [roads]
  );

  const normalizedRoads = useMemo(
    () =>
      roads.map((road) => ({
        road,
        condition: normalizeConditionValue(road.condition),
        status: normalizeCandidate(road.status),
        kelurahan: normalizeCandidate(road.kelurahan),
        jenisJalan: normalizeCandidate(road.highway),
        tipeJalan: normalizeCandidate(getRoadType(road)),
        rt: normalizeCandidate(
          road.rt === null || road.rt === undefined ? null : String(road.rt)
        ),
        rw: normalizeCandidate(
          road.rw === null || road.rw === undefined ? null : String(road.rw)
        ),
      })),
    [roads]
  );

  const filteredRoads = useMemo(
    () =>
      normalizedRoads
        .filter(
          ({ condition, status, kelurahan, jenisJalan, tipeJalan, rt, rw }) =>
            matchesSelected(filters.condition, condition) &&
            matchesSelected(filters.status, status) &&
            matchesSelected(filters.kelurahan, kelurahan) &&
            matchesSelected(filters.jenisJalan, jenisJalan) &&
            matchesSelected(filters.tipeJalan, tipeJalan) &&
            matchesSelected(filters.rt, rt) &&
            matchesSelected(filters.rw, rw)
        )
        .map(({ road }) => road),
    [filters, normalizedRoads]
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((items) => items.length > 0),
    [filters]
  );

  const toggleFilterValue = (key: keyof RoadFilters, value: string) => {
    setFilters((prev) => {
      const current = new Set(prev[key]);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return { ...prev, [key]: Array.from(current) };
    });
  };

  const setFilterValue = (key: keyof RoadFilters, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value ? [value] : [],
    }));
  };

  const resetFilters = () => setFilters(createInitialFilters());

  return {
    filters,
    filteredRoads,
    filterOptions,
    hasActiveFilters,
    toggleFilterValue,
    setFilterValue,
    resetFilters,
    setFilters,
  };
};
