import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type * as GeoJSON from 'geojson';
import { supabase } from '@/shared/services/supabase';
import { Input } from '@/components/ui/input';
import { Box, Expand, Loader2, MapIcon, Minus, Plus, Search, SearchIcon, TriangleAlert, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAP_CENTER: [number, number] = [108.5325038591979, -7.369617983909407];
const MAPTILER_KEY = 'a7j0hgsQIyRNxPavCq8I';
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`;
const TERRAIN_SOURCE_URL = `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${MAPTILER_KEY}`;
const TERRAIN_SOURCE_ID = 'jalan-terrain';
const SKY_LAYER_ID = 'jalan-sky';

const MAP_BOUNDS: maplibregl.LngLatBoundsLike = [
  [108.50333395341329, -7.384947285610721], // Southwest (minLng, minLat)
  [108.56235933275224, -7.356833238613973], // Northeast (maxLng, maxLat)
];

const RECENT_SEARCH_KEY = 'jalan_recent_roads';

type RoadRow = {
  id: string;
  geom: GeoJSON.LineString | GeoJSON.MultiLineString;
  highway: string | null;
  name: string | null;
  props: any | null; // diasumsikan berisi field OSM seperti "class", "unpaved", dll
  osm_id: string | null;
  kota: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  rt: number | null;
  rw: number | null;
  lingkungan: string | null;
  condition: string | null;
  status: string | null;
  length: number | null;
  width: number | null
};

type ReportRow = {
  id: number;
  user_id: number | null;
  latitude: number | null;
  longitude: number | null;
  kerusakan_level: string | null;
  deskripsi: string | null;
  status: string | null;
  foto: string | null;
  kontak_pelapor: string | null;
  created_at: string | null;
  updated_at: string | null;
  road_id: string | null;
};

const normalizeId = (id: string | number) => String(id);

const REPORT_STATUS_META: Record<string, { label: string; className: string }> = {
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
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  default: {
    label: 'Unknown',
    className: 'border-gray-200 bg-gray-50 text-gray-700',
  },
};

const KERUSAKAN_LEVEL_LABEL: Record<string, string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  berat: 'Berat',
};

const formatReportCode = (id: number | string) =>
  `RPT-${String(id).padStart(4, '0')}`;

const formatReportDate = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatKerusakanLevel = (level: string | null) => {
  if (!level) return '-';
  const lower = level.toLowerCase();
  return KERUSAKAN_LEVEL_LABEL[lower] ?? level;
};

const parseBoolean = (value: any): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (['yes', 'true', '1'].includes(lowered)) return true;
    if (['no', 'false', '0'].includes(lowered)) return false;
  }
  return null;
};

const formatMaxSpeed = (value: any): string => {
  if (value === null || value === undefined) return 'Tidak diketahui';
  if (typeof value === 'number') return `${value} km/jam`;
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[^\d.]/g, ''));
    if (!Number.isNaN(numeric)) return `${numeric} km/jam`;
    return value;
  }
  return 'Tidak diketahui';
};

const parseNumericValue = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  const parsed =
    typeof value === 'string'
      ? Number(value.replace(/[^\d.-]/g, ''))
      : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDistance = (meters: number | null | undefined): string => {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return '-';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const accumulateLineLength = (line: GeoJSON.Position[]): number => {
  let total = 0;
  for (let i = 1; i < line.length; i += 1) {
    const prev = line[i - 1];
    const curr = line[i];
    if (!prev || !curr || prev.length < 2 || curr.length < 2) continue;
    const from = new maplibregl.LngLat(prev[0], prev[1]);
    const to = new maplibregl.LngLat(curr[0], curr[1]);
    total += from.distanceTo(to);
  }
  return total;
};

const calculateRoadLength = (
  geom: GeoJSON.LineString | GeoJSON.MultiLineString | null | undefined
): number | null => {
  if (!geom) return null;
  if (geom.type === 'LineString') {
    return accumulateLineLength(geom.coordinates as GeoJSON.Position[]);
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates.reduce(
      (total, line) => total + accumulateLineLength(line as GeoJSON.Position[]),
      0
    );
  }
  return null;
};

const pickFirstValue = (
  source: Record<string, any>,
  keys: string[]
): string | null => {
  for (const key of keys) {
    if (!(key in source)) continue;
    const value = source[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
};

/**
 * Ekspresi line-width yang disamakan dengan layer "Minor road" MapTiler
 */
const ROAD_LINE_WIDTH: any = [
  'interpolate',
  ['linear', 2],
  ['zoom'],
  5,
  [
    '*',
    0.5,
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  10,
  [
    '*',
    1,
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  12,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      ['secondary', 'tertiary'],
      1.5,
      ['minor', 'track'],
      1.2,
      1,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  14,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      4,
      'tertiary',
      3,
      ['minor', 'track'],
      2,
      2,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['service', 'track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  16,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      8,
      'tertiary',
      6,
      ['minor', 'track'],
      4,
      4,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['service', 'track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  18,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      24,
      'tertiary',
      24,
      ['minor', 'track'],
      16,
      16,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
  22,
  [
    '*',
    [
      'match',
      ['get', 'class'],
      'secondary',
      80,
      'tertiary',
      60,
      ['minor', 'track'],
      50,
      40,
    ],
    [
      'case',
      [
        'all',
        [
          'in',
          ['get', 'class'],
          ['literal', ['track']],
        ],
        ['boolean', ['get', 'unpaved'], false],
      ],
      0.65,
      1,
    ],
  ],
];

const buildFeatureCollection = (roads: RoadRow[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: roads
    .filter((r) => r.geom)
    .map((r) => {
      const featureId = normalizeId(r.id);
      return {
        type: 'Feature',
        id: featureId,
        geometry: r.geom,
        properties: {
          id: featureId, // dipakai buat filter highlight
          highway: r.highway,
          name: r.name,
          ...((r.props ?? {}) as Record<string, any>),
        },
      };
    }),
});

const Maps = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const hoveredRoadIdRef = useRef<string | null>(null);
  const selectedRoadIdRef = useRef<string | null>(null);
  const roadsDataRef = useRef<RoadRow[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTermRef = useRef('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<RoadRow[]>([]);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<
    { id: string; label: string; secondary: string }[]
  >([]);
  const [activeRoad, setActiveRoad] = useState<RoadRow | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
  const [mapReady, setMapReady] = useState(false);

  const findRoadById = (id: string) =>
    roadsDataRef.current.find((item) => normalizeId(item.id) === id) ?? null;

  const enable3DMode = (map: Map) => {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: 'raster-dem',
        url: TERRAIN_SOURCE_URL,
        tileSize: 256,
        maxzoom: 12,
      });
    }

    map.setTerrain({
      source: TERRAIN_SOURCE_ID,
      exaggeration: 1.1,
    });

    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
    map.easeTo({ pitch: 60, bearing: 36, duration: 500 });
  };

  const disable3DMode = (map: Map) => {
    map.setTerrain(null);
    if (map.getLayer(SKY_LAYER_ID)) {
      map.removeLayer(SKY_LAYER_ID);
    }

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.easeTo({ pitch: 0, bearing: 0, duration: 400 });
  };

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setSearchResults([]);
      searchTermRef.current = '';
      return;
    }

    searchTermRef.current = term;
    const results = roadsDataRef.current
      .filter((road) => {
        const name = (road.name ?? '').toLowerCase();
        const highway = (road.highway ?? '').toLowerCase();
        return name.includes(term) || highway.includes(term);
      })
      .slice(0, 8);

    setSearchResults(results);
  }, [searchTerm]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { id: string; label: string; secondary: string }[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 3));
      }
    } catch (err) {
      console.warn('Gagal parse recent search:', err);
    }
  }, []);

  useEffect(() => {
    if (!searchDialogOpen) return undefined;

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [searchDialogOpen]);

  useEffect(() => {
    const roadId = activeRoad?.id ? normalizeId(activeRoad.id) : null;

    // Hanya load laporan jika jalan sudah dipilih (bukan sekadar hover).
    if (!roadId || selectedRoadIdRef.current !== roadId) {
      setReports([]);
      setReportsError(null);
      setReportsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadReports = async () => {
      setReportsLoading(true);
      setReportsError(null);

      const { data, error } = await supabase
        .from('reports')
        .select('id, user_id, kerusakan_level, deskripsi, status, foto, kontak_pelapor, created_at, updated_at, road_id, latitude, longitude')
        .eq('road_id', roadId)
        .order('created_at', { ascending: false });

      if (isCancelled) return;

      if (error) {
        console.error('Error fetch reports:', error);
        setReportsError('Gagal memuat laporan aktif.');
        setReports([]);
      } else {
        const activeReports = ((data ?? []) as ReportRow[]).filter(
          (report) => (report.status ?? 'pending') !== 'done'
        );
        setReports(activeReports);
      }

      setReportsLoading(false);
    };

    loadReports();

    return () => {
      isCancelled = true;
    };
  }, [activeRoad?.id]);

  const focusRoad = (road: RoadRow) => {
    const map = mapRef.current;
    if (!map || !road.geom) return;

    const coords: [number, number][] = [];
    if (road.geom.type === 'LineString') {
      coords.push(...(road.geom.coordinates as [number, number][]));
    } else if (road.geom.type === 'MultiLineString') {
      for (const line of road.geom.coordinates) {
        coords.push(...(line as [number, number][]));
      }
    }

    if (!coords.length) return;

    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new maplibregl.LngLatBounds(coords[0], coords[0])
    );

    map.fitBounds(bounds, { padding: 64, maxZoom: 18, duration: 500 });

    const id = normalizeId(road.id);
    hoveredRoadIdRef.current = id;
    selectedRoadIdRef.current = id;
    setActiveRoad(road);
    if (map.getLayer('roads-highlight')) {
      map.setFilter('roads-highlight', ['==', ['get', 'id'], id]);
    }
  };

  const updateRecentSearches = (road: RoadRow) => {
    const entry = {
      id: normalizeId(road.id),
      label: road.name ?? road.highway ?? `Ruas ${road.id}`,
      secondary: road.highway ?? road.kecamatan ?? road.kota ?? '-',
    };

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.id !== entry.id);
      const next = [entry, ...filtered].slice(0, 3);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
        } catch (err) {
          console.warn('Gagal simpan recent search:', err);
        }
      }
      return next;
    });
  };

  const handleSelectRoad = (road: RoadRow) => {
    focusRoad(road);
    const nextValue = road.name ?? '';
    setSearchTerm(nextValue);
    searchTermRef.current = nextValue;
    setSearchResults([]);
    updateRecentSearches(road);
    setSearchDialogOpen(false);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const map = mapRef.current;
    if (!map) return;

    if (direction === 'in') {
      map.zoomIn();
    } else {
      map.zoomOut();
    }
  };

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({
      center: MAP_CENTER,
      zoom: 13,
      pitch: 0,
      bearing: 0,
      duration: 600,
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: 13,
      maxBounds: MAP_BOUNDS,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', async () => {
      // 1) AMBIL DATA JALAN DARI SUPABASE
      const { data, error } = await supabase
        .from('roads')
        .select('id, geom, highway, name, props, kota, kecamatan, kelurahan, lingkungan, rt, rw, condition, status, length, width, osm_id');

      if (error) {
        console.error('Error fetch roads:', error);
        setMapReady(true);
        return;
      }

      const roads = (data || []) as RoadRow[];

      roadsDataRef.current = roads;

      if (!roads.length) {
        console.warn('Tidak ada data roads di Supabase');
      }

      // 2) KONVERSI KE GEOJSON FEATURECOLLECTION
      const featureCollection = buildFeatureCollection(roadsDataRef.current);

      // 3) ADD SOURCE KE MAPLIBRE
      if (map.getSource('roads')) {
        (map.getSource('roads') as maplibregl.GeoJSONSource).setData(
          featureCollection
        );
      } else {
        map.addSource('roads', {
          type: 'geojson',
          data: featureCollection,
          promoteId: 'id',
        });
      }

      // 4) LAYER UTAMA JALAN (BISA JADI HANYA UNTUK HITTEST)
      if (!map.getLayer('roads-line')) {
        map.addLayer({
          id: 'roads-line',
          type: 'line',
          source: 'roads',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#4b7e5f',
            'line-opacity': 0.3,
            'line-width': ROAD_LINE_WIDTH,
          } as any,
        });
      }

      // 5) LAYER HITBOX LEBAR UNTUK HOVER (tidak terlihat)
      if (!map.getLayer('roads-hit')) {
        map.addLayer({
          id: 'roads-hit',
          type: 'line',
          source: 'roads',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#000000',
            'line-opacity': 0.001,
            'line-width': 24,
          },
        });
      }

      // 6) LAYER HIGHLIGHT JALAN YANG DI-HOVER
      if (!map.getLayer('roads-highlight')) {
        map.addLayer({
          id: 'roads-highlight',
          type: 'line',
          source: 'roads',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#4b7e5f',
            'line-opacity': 0.7,
            'line-width': ROAD_LINE_WIDTH,
          } as any,
          filter: ['==', ['get', 'id'], ''],
        });
      }

      // OPTIONAL: FIT BOUNDS KE SEMUA JALAN
      try {
        const coords: [number, number][] = [];
        for (const r of roads) {
          if (!r.geom) continue;
          if (r.geom.type === 'LineString') {
            coords.push(...(r.geom.coordinates as [number, number][]));
          } else if (r.geom.type === 'MultiLineString') {
            for (const line of r.geom.coordinates) {
              coords.push(...(line as [number, number][]));
            }
          }
        }

        if (coords.length) {
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new maplibregl.LngLatBounds(coords[0], coords[0])
          );
          map.fitBounds(bounds, { padding: 40 });
        }
      } catch (err) {
        console.warn('Gagal hitung bounds roads:', err);
      }

      const resetHoverState = () => {
        // Jangan hilangkan highlight jika ada pilihan (selected) atau input masih terisi
        if (!searchTermRef.current.trim() && !selectedRoadIdRef.current) {
          hoveredRoadIdRef.current = null;
          setActiveRoad(null);
          if (map.getLayer('roads-highlight')) {
            map.setFilter('roads-highlight', ['==', ['get', 'id'], '']);
          }
        } else if (selectedRoadIdRef.current && map.getLayer('roads-highlight')) {
          map.setFilter('roads-highlight', [
            '==',
            ['get', 'id'],
            selectedRoadIdRef.current,
          ]);
        }
        map.getCanvas().style.cursor = '';
      };

      // 🔥 EVENT HOVER DI 'roads-hit' (hitbox besar)
      map.on('mousemove', 'roads-hit', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        // Jika ada pilihan terpilih, jangan ganti highlight saat hover jalan lain
        if (selectedRoadIdRef.current) {
          if (map.getLayer('roads-highlight')) {
            map.setFilter('roads-highlight', [
              '==',
              ['get', 'id'],
              selectedRoadIdRef.current,
            ]);
          }
          map.getCanvas().style.cursor = 'pointer';
          return;
        }

        const rawId =
          feature.id ??
          (feature.properties?.id as string | number | undefined);
        if (rawId === undefined || rawId === null) return;

        const featureId = normalizeId(rawId);

        if (hoveredRoadIdRef.current !== featureId) {
          hoveredRoadIdRef.current = featureId;

          map.setFilter('roads-highlight', [
            '==',
            ['get', 'id'],
            featureId,
          ]);
        }

        map.getCanvas().style.cursor = 'pointer';
      });

      // Klik jalan: isi input dengan nama/tipenya dan kunci highlight ke jalan itu
      map.on('click', 'roads-hit', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const rawId =
          feature.id ??
          (feature.properties?.id as string | number | undefined);
        if (rawId === undefined || rawId === null) return;

        const featureId = normalizeId(rawId);
        const name = (feature.properties?.name as string) || '';
        const highway = (feature.properties?.highway as string) || '';
        const nextValue = name || highway || featureId;

        const road = findRoadById(featureId);
        selectedRoadIdRef.current = featureId;
        hoveredRoadIdRef.current = featureId;
        searchTermRef.current = nextValue;
        setSearchTerm(nextValue);
        setSearchResults([]);
        if (road) setActiveRoad(road);

        if (map.getLayer('roads-highlight')) {
          map.setFilter('roads-highlight', [
            '==',
            ['get', 'id'],
            featureId,
          ]);
        }
      });

      map.on('mouseleave', 'roads-hit', () => {
        resetHoverState();
      });

      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (mapMode === '3d') {
      enable3DMode(map);
    } else {
      disable3DMode(map);
    }
  }, [mapMode, mapReady]);

  const activeProps = (activeRoad?.props ?? {}) as Record<string, any>;
  const isRoadSelected =
    !!activeRoad && selectedRoadIdRef.current === normalizeId(activeRoad.id);
  const showDetailPanel = !!(activeRoad && isRoadSelected);
  const detailPanelClass = showDetailPanel
    ? 'translate-x-0 pointer-events-auto'
    : '-translate-x-full pointer-events-none';
  const detailWrapperClass = showDetailPanel
    ? 'pointer-events-auto'
    : 'pointer-events-none';
  const roadClassLabel =
    activeProps.class && String(activeProps.class).trim()
      ? String(activeProps.class)
      : activeRoad?.highway ?? '-';
  const unpaved = parseBoolean(activeProps.unpaved);
  const surfaceLabel = activeProps.surface
    ? String(activeProps.surface)
    : unpaved === true
      ? 'Tidak beraspal'
      : 'Asphalt';
  const conditionLabel = activeRoad?.condition ?? '-';
  const onewayFlag = parseBoolean(activeProps.oneway);
  const onewayLabel =
    onewayFlag === null ? 'Tidak diketahui' : onewayFlag ? 'Satu arah' : 'Dua arah';
  const maxSpeedLabel = formatMaxSpeed(activeProps.maxspeed);
  const refLabel = activeRoad?.osm_id ? String(activeRoad.osm_id) : null;
  const lanesLabel = activeProps.lanes ? String(activeProps.lanes) : null;
  const bridgeFlag = parseBoolean(activeProps.bridge);
  const tunnelFlag = parseBoolean(activeProps.tunnel);
  const lengthFromGeometry = calculateRoadLength(activeRoad?.geom ?? null);
  const lengthLabel = formatDistance(activeRoad?.length ?? lengthFromGeometry);
  const widthValue = parseNumericValue(activeRoad?.width);
  const widthLabel = widthValue !== null ? `${widthValue} m` : '-';
  const constructionLabel = surfaceLabel;
  const cityLabel =
    activeRoad?.kota ?? '-';
  const districtLabel =
    activeRoad?.kecamatan ??
    '-';
  const subDistrictLabel =
    activeRoad?.kelurahan ?? '-';
  const neighbourhoodLabel =
    activeRoad?.lingkungan ?? '-';
  const rtValue = activeRoad?.rt ?? '-';
  const rwValue = activeRoad?.rw ?? '-';

  const trafficBadgeLabel =
    [
      lanesLabel ? `${lanesLabel} lajur` : onewayLabel,
      maxSpeedLabel,
      bridgeFlag === true ? 'Jembatan' : null,
      tunnelFlag === true ? 'Terowongan' : null,
    ]
      .filter((item) => item && String(item).trim())
      .join(' • ') || '-';

  const handleSearch = () => {
    setSearchDialogOpen(true);
  };

  return (
    <div className="relative w-full h-[calc(100vh-53px)]">
      <div ref={mapContainerRef} className="w-full h-full overflow-hidden" />

      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent hideClose className="w-full max-h-[75vh] overflow-y-auto max-w-2xl gap-0 p-0 pb-2 border bg-background shadow-2xl sm:rounded-lg">
          <div className="sticky top-0 z-10 bg-white flex items-center border-b border-gray-200 px-3">
            <SearchIcon strokeWidth={2.5} className="w-4 h-4 text-gray-500" />
            <Input
              ref={searchInputRef}
              placeholder="Search road name, address, or OSM ID ..."
              className="py-7 pr-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchDialogOpen(false);
                  return;
                }
                if (e.key === 'Enter' && searchResults[0]) {
                  handleSelectRoad(searchResults[0]);
                }
              }}
            />
            <span className="text-sm border border-gray-200 px-2 py-1 rounded-sm text-gray-500">
              esc
            </span>
          </div>
          <div className="flex flex-col overflow-y-auto flex-1 min-h-0 bg-white w-full p-4 space-y-2">
            {!searchTerm.trim() ? (
              recentSearches.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Ketik nama jalan, alamat, atau OSM ID untuk mencari ruas.
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Recent
                  </p>
                  {recentSearches.map((item) => {
                    const road = findRoadById(item.id);
                    const label = road?.name ?? road?.highway ?? item.label;
                    const secondary =
                      road?.highway ??
                      road?.kecamatan ??
                      road?.kota ??
                      item.secondary;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-start justify-between gap-2 rounded-md border border-transparent px-3 py-2 text-left hover:border-gray-200 hover:bg-gray-50 focus:outline-none disabled:opacity-60"
                        onClick={() => road && handleSelectRoad(road)}
                        disabled={!road}
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {label}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {secondary}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs text-gray-700">
                          Recent
                        </Badge>
                      </button>
                    );
                  })}
                </>
              )
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada hasil ditemukan.</p>
            ) : (
              searchResults.map((road) => {
                const label = road.name ?? road.highway ?? `Ruas ${road.id}`;
                const secondary = road.highway ?? road.kecamatan ?? '-';
                return (
                  <button
                    key={road.id}
                    type="button"
                    className="flex w-full items-start justify-between gap-2 rounded-md border border-transparent px-3 py-2 text-left hover:border-gray-200 hover:bg-gray-50 focus:outline-none"
                    onClick={() => handleSelectRoad(road)}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {secondary}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-700 uppercase">
                      {road.osm_id ? `${road.osm_id}` : 'OSM unknown'}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div
        className={`absolute p-0 top-0 left-0 z-30 w-sm h-full flex flex-col transform transition-all duration-300 ease-in-out ${detailPanelClass}`}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto w-full shadow-lg">
          {showDetailPanel ? (
            <div className="flex flex-col overflow-y-auto flex-1 min-h-0 bg-white w-full p-4 space-y-4">
              <header className="flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <div className='flex justify-between'>
                    <h2 className="font-medium text-gray-500 uppercase">
                      {refLabel}
                    </h2>
                    <button
                      className='text-gray-600 hover:text-gray-800 hover:border-gray-300 border border-gray-200 rounded-full p-1'
                    >
                      <span className="sr-only">Close</span>
                      <X
                        className="h-4 w-4"
                        aria-hidden="true"
                        onClick={() => {
                          selectedRoadIdRef.current = null;
                          setActiveRoad(null);
                        }}
                      />
                    </button>
                  </div>
                  <h3 className='max-w-64 leading-6 text-lg font-medium text-gray-800'>
                    {activeRoad.name ?? activeRoad.highway ?? '-'}
                  </h3>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className='text-gray-700 font-medium py-1 px-2 gap-2'>
                      {roadClassLabel}
                    </Badge>
                    <Badge variant="outline" className='text-gray-700 font-medium py-1 px-2 gap-2 capitalize'>
                    <span
                      className={`h-2 w-2 rounded-full inline-block ${
                        conditionLabel === 'good' ? 'bg-brand-500' : 'bg-red-500'
                      }`}
                    />
                      {conditionLabel} condition
                    </Badge>
                  </div>
                </div>
              </header>
              <div className='flex flex-col my-3 space-y-2'>
                <div className='flex flex-row rounded-md border border-gray-200 p-4'>
                  <div className='flex text-center gap-1 flex-col w-full'>
                    <span className='text-sm text-gray-500 font-medium'>Length</span>
                    <span className='text-sm text-gray-800 font-medium'>{lengthLabel}</span>
                  </div>
                  <div className='flex text-center gap-1 flex-col w-full'>
                    <span className='text-sm text-gray-500 font-medium'>Width</span>
                    <span className='text-sm text-gray-800 font-medium'>{widthLabel}</span>
                  </div>
                  <div className='flex text-center gap-1 flex-col w-full'>
                    <span className='text-sm text-gray-500 font-medium'>Surface</span>
                    <span className='text-sm text-gray-800 font-medium'>{constructionLabel}</span>
                  </div>
                </div>
                <div className='flex flex-col rounded-md border border-gray-200 gap-3 p-4'>
                  <div className='flex items-center w-full justify-between'>
                    <span className='text-sm font-medium text-gray-500'>Kota</span>
                    <span className='text-sm font-medium text-gray-800 capitalize'>{cityLabel}</span>
                  </div>
                  <div className='flex items-center w-full justify-between'>
                    <span className='text-sm font-medium text-gray-500'>Kecamatan</span>
                    <span className='text-sm font-medium text-gray-800 capitalize'>{districtLabel}</span>
                  </div>
                  <div className='flex items-center w-full justify-between'>
                    <span className='text-sm font-medium text-gray-500'>Kelurahan</span>
                    <span className='text-sm font-medium text-gray-800 capitalize'>{subDistrictLabel}</span>
                  </div>
                  <div className='flex items-center w-full justify-between'>
                    <span className='text-sm font-medium text-gray-500'>Lingkungan</span>
                    <span className='text-sm font-medium text-gray-800 capitalize'>{neighbourhoodLabel}</span>
                  </div>
                  <div className='flex items-center w-full justify-between'>
                    <span className='text-sm font-medium text-gray-500'>RT/RW</span>
                    <span className='text-sm font-medium text-gray-800 capitalize'>{rtValue} / {rwValue}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className='text-sm text-gray-400 font-medium'>ACTIVE REPORTS</h3>
                <div className="mt-2 overflow-x-auto">
                  {!isRoadSelected ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Pilih jalan untuk melihat laporan aktif.
                    </div>
                  ) : reportsLoading ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      Memuat laporan aktif untuk ruas ini...
                    </div>
                  ) : reportsError ? (
                    <div className="px-3 py-2 text-sm text-red-600">
                      {reportsError}
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="px-3 py-2 border border-dashed border-gray-200 rounded-md text-sm text-gray-500">
                      <span>Belum ada laporan aktif untuk ruas ini.</span>
                    </div>
                  ) : (
                    <div className="flex flex-row gap-2 w-max snap-x snap-mandatory">
                      {reports.map((report) => {
                        const statusKey = (report.status ?? 'pending').toLowerCase();
                        const statusMeta =
                          REPORT_STATUS_META[statusKey] ?? REPORT_STATUS_META.default;
                        const reporter =
                          report.kontak_pelapor ||
                          (report.user_id ? `User-${report.user_id}` : '-');

                        return (
                          <Card key={report.id} className="max-w-xs bg-geist-50 shadow-none snap-start border border-gray-200">
                            <CardHeader className='flex flex-row items-center justify-between p-3 gap-3'>
                              <div className='flex flex-row items-center gap-2'>
                                <span className='p-1 border border-red-300 bg-red-100 rounded-sm'>
                                  <TriangleAlert className='h-4 w-4 text-red-500' />
                                </span>
                                <CardTitle className='text-sm text-gray-800'>
                                  {formatReportCode(report.id)}
                                </CardTitle>
                              </div>
                              <Badge variant="outline" className={`py-1 px-2 text-xs font-medium ${statusMeta.className}`}>
                                {statusMeta.label}
                              </Badge>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-3 space-y-3">
                              <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Pelapor</span>
                                  <span className="text-sm font-medium text-gray-800 truncate max-w-[120px] text-right">
                                    {reporter}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Level kerusakan</span>
                                  <div className="flex items-center gap-2 font-medium text-gray-800 capitalize">
                                    {formatKerusakanLevel(report.kerusakan_level)}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Status</span>
                                  <span className="text-sm font-medium text-gray-800 capitalize">
                                    {statusMeta.label}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Tanggal laporan</span>
                                  <span className="text-sm font-medium text-gray-800">
                                    {formatReportDate(report.created_at)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="px-3 pb-3 pt-0">
                              <p className="text-xs text-gray-500">
                                {report.deskripsi || 'Tidak ada deskripsi tambahan.'}
                              </p>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-row gap-2">
                <div className='w-full'>
                  <Button
                    variant="outline"
                    className="w-full text-gray-700"
                    onClick={() => {
                      const map = mapRef.current;
                      if (map?.getLayer('roads-highlight')) {
                        map.setFilter('roads-highlight', ['==', ['get', 'id'], '']);
                      }
                    }}  
                  >
                    Edit Data
                  </Button>
                </div>
                <div className='w-full'>
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      const map = mapRef.current;
                      if (map?.getLayer('roads-highlight')) {
                        map.setFilter('roads-highlight', ['==', ['get', 'id'], '']);
                      }
                    }}  
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-white border border-dashed border-gray-200 rounded-md h-full min-h-[200px] text-gray-500 text-sm">
              Pilih jalan untuk melihat detail.
            </div>
          )}
        </div>
      </div>

      <div className='absolute flex flex-col gap-2 p-2 top-0 right-0 z-30'>
          <div className='flex flex-col p-1 bg-white rounded-sm shadow-md'>
            <button
              className="flex items-center justify-center py-2 rounded-sm text-gray-900 hover:bg-white"
              onClick={handleSearch}
              aria-label="Kembali ke titik awal"
              disabled={!mapReady}
            >
              <Search strokeWidth={2.5} className='h-4 w-4' />
            </button>
          </div>
          <div className='flex flex-col p-1 bg-white rounded-sm shadow-md'>
            <button
              className={`rounded-xs p-2 ${mapMode === '3d' ? 'bg-geist-100 text-indigo-700' : 'hover:bg-white text-gray-300 hover:text-gray-900 cursor-pointer'}`}
              onClick={() => setMapMode('3d')}
              aria-pressed={mapMode === '3d'}
              aria-label="Aktifkan mode peta 3D"
            >
              <Box className='h-4.5 w-4.5' />
            </button>
            <button
              className={`rounded-xs p-2 ${mapMode === '2d' ? 'bg-geist-100 text-indigo-700' : 'hover:bg-white text-gray-300 hover:text-gray-900 cursor-pointer'}`}
              onClick={() => setMapMode('2d')}
              aria-pressed={mapMode === '2d'}
              aria-label="Aktifkan mode peta 2D"
            >
              <MapIcon className='h-4.5 w-4.5' />
            </button>
          </div>
      </div>

      <div className='absolute p-2 bottom-0 right-0 z-30 space-y-2'>
          <div className='flex flex-col bg-white rounded-sm shadow-md'>
              <Button
                variant="ghost"
                className="rounded-sm text-gray-900 hover:bg-white"
                onClick={() => handleZoom('in')}
                aria-label="Perbesar peta"
                disabled={!mapReady}
              >
                <Plus strokeWidth={2.5} className='h-4.5 w-4.5' />
              </Button>
              <Button
                variant="ghost"
                className="rounded-sm text-gray-900 hover:bg-white"
                onClick={() => handleZoom('out')}
                aria-label="Perkecil peta"
                disabled={!mapReady}
              >
                <Minus strokeWidth={2.5} className='h-4.5 w-4.5' />
              </Button>
          </div>
          <div className='flex flex-col p-1 bg-white rounded-sm shadow-md'>
            <button
              className="flex items-center justify-center py-2 rounded-sm text-gray-900 hover:bg-white"
              onClick={handleResetView}
              aria-label="Kembali ke titik awal"
              disabled={!mapReady}
            >
              <Expand strokeWidth={2.5} className='h-4 w-4' />
            </button>
          </div>
      </div>
    </div>
  );
};

export default Maps;
