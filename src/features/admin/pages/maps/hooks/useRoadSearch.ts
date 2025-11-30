import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../mapConfig';
import {
  getRoadPrimaryLabel,
  getRoadSecondaryLabel,
  loadRecentSearches,
  normalizeId,
  persistRecentSearches,
} from '../mapHelpers';
import type { RecentSearchItem, RoadRow } from '../types';

export const useRoadSearch = (roads: RoadRow[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RoadRow[]>([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(
    () => loadRecentSearches()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) {
      setSearchResults([]);
      return;
    }

    const results = roads
      .filter((road) => {
        const name = (road.name ?? '').toLowerCase();
        const highway = (road.highway ?? '').toLowerCase();
        return name.includes(term) || highway.includes(term);
      })
      .slice(0, 8);

    setSearchResults(results);
  }, [debouncedSearchTerm, roads]);

  const addRecentSearch = (road: RoadRow) => {
    const entry: RecentSearchItem = {
      id: normalizeId(road.id),
      label: getRoadPrimaryLabel(road),
      secondary: getRoadSecondaryLabel(road),
    };

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.id !== entry.id);
      const next = [entry, ...filtered].slice(0, 3);
      persistRecentSearches(next);
      return next;
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    searchResults,
    searchDialogOpen,
    setSearchDialogOpen,
    recentSearches,
    addRecentSearch,
  };
};
