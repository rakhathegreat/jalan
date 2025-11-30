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

const matchesFilter = (selected: string[], candidate: string | number | null) => {
  if (!selected.length) return true;
  const normalized = normalizeFilterValue(candidate);
  if (!normalized) return false;
  return selected.includes(normalized);
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
      condition: buildOptions(roads, (road) => road.condition),
      status: buildOptions(roads, (road) => road.status),
      kelurahan: buildOptions(roads, (road) => road.kelurahan),
      jenisJalan: buildOptions(roads, (road) => road.highway),
      tipeJalan: ROAD_TYPE_OPTIONS,
    }),
    [roads]
  );

  const filteredRoads = useMemo(
    () =>
      roads.filter(
        (road) =>
          matchesFilter(filters.condition, road.condition) &&
          matchesFilter(filters.status, road.status) &&
          matchesFilter(filters.kelurahan, road.kelurahan) &&
          matchesFilter(filters.jenisJalan, road.highway) &&
          matchesFilter(filters.tipeJalan, getRoadType(road)) &&
          matchesFilter(
            filters.rt,
            road.rt === null || road.rt === undefined ? null : String(road.rt)
          ) &&
          matchesFilter(
            filters.rw,
            road.rw === null || road.rw === undefined ? null : String(road.rw)
          )
      ),
    [filters, roads]
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
