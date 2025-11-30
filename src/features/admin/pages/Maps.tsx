import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map, type MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type * as GeoJSON from 'geojson';
import { supabase } from '@/shared/services/supabase';
import { DetailPanel } from './maps/components/DetailPanel';
import { MapControls } from './maps/components/MapControls';
import { MapSearchDialog } from './maps/components/MapSearchDialog';
import { useRoadDetails } from './maps/hooks/useRoadDetails';
import { useReports } from './maps/hooks/useReports';
import { useFilters } from './maps/hooks/useFilters';
import { useRoadSearch } from './maps/hooks/useRoadSearch';
import triangleAlert from '@assets/warning.png';
import {
  MAP_BOUNDS,
  MAP_CENTER,
  MAP_STYLE,
  ROAD_LINE_WIDTH,
  SKY_LAYER_ID,
  TERRAIN_SOURCE_ID,
  TERRAIN_SOURCE_URL,
} from './maps/mapConfig';
import {
  buildFeatureCollection,
  extractCoordinates,
  getBoundsFromCoordinates,
  getRoadPrimaryLabel,
  normalizeId,
  setHighlightFilter,
} from './maps/mapHelpers';
import type { MapMode, RoadRow, LaporanRow, ReportRow } from './maps/types';

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

const ensureRoadLayers = (map: Map) => {
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
};

const syncRoadSource = (map: Map, featureCollection: GeoJSON.FeatureCollection) => {
  if (map.getSource('roads')) {
    (map.getSource('roads') as maplibregl.GeoJSONSource).setData(featureCollection);
  } else {
    map.addSource('roads', {
      type: 'geojson',
      data: featureCollection,
      promoteId: 'id',
    });
  }
};

const Maps = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const hoveredRoadIdRef = useRef<string | null>(null);
  const selectedRoadIdRef = useRef<string | null>(null);
  const roadsDataRef = useRef<RoadRow[]>([]);
  const hoverEnabledRef = useRef(false);
  const highlightSuppressedRef = useRef(false);
  const skipRoadClickRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTermRef = useRef('');
  const [roads, setRoads] = useState<RoadRow[]>([]);
  const [laporan, setLaporan] = useState<LaporanRow[]>([]);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  const [activeRoad, setActiveRoad] = useState<RoadRow | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('2d');
  const [mapReady, setMapReady] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    filters,
    filteredRoads,
    filterOptions,
    hasActiveFilters,
    setFilterValue,
    resetFilters,
  } = useFilters(roads);

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchDialogOpen,
    setSearchDialogOpen,
    recentSearches,
    addRecentSearch,
  } = useRoadSearch(filteredRoads);

  useEffect(() => {
    searchTermRef.current = searchTerm.trim();
  }, [searchTerm]);

  useEffect(() => {
    roadsDataRef.current = roads;
  }, [roads]);

  const findRoadById = (id: string) =>
    roadsDataRef.current.find((item) => normalizeId(item.id) === id) ?? null;

  const applyHighlight = (map: Map | null, roadId: string | null) => {
    if (!map) return;
    if (roadId && highlightSuppressedRef.current) return;
    setHighlightFilter(map, roadId);
  };

  const focusRoad = (road: RoadRow, options?: { highlight?: boolean }) => {
    const map = mapRef.current;
    if (!map || !road.geom) return;

    const coords = extractCoordinates(road.geom);
    if (!coords.length) return;

    const bounds = getBoundsFromCoordinates(coords);
    if (!bounds) return;

    map.fitBounds(bounds, { padding: 64, maxZoom: 18, duration: 500 });

    const id = normalizeId(road.id);
    hoveredRoadIdRef.current = id;
    selectedRoadIdRef.current = id;
    setActiveRoad(road);
    const shouldHighlight = options?.highlight !== false;
    highlightSuppressedRef.current = !shouldHighlight;
    applyHighlight(map, shouldHighlight ? id : null);
  };

  const focusRoadById = (
    roadId: string | number | null | undefined,
    options?: { updateSearch?: boolean; highlight?: boolean }
  ) => {
    if (roadId === null || roadId === undefined) return;
    const road = findRoadById(normalizeId(roadId));
    if (!road) return;

    focusRoad(road, { highlight: options?.highlight });

    if (options?.updateSearch !== false) {
      const nextValue = getRoadPrimaryLabel(road);
      setSearchTerm(nextValue);
      searchTermRef.current = nextValue;
    }
  };

  const handleSelectRoad = (road: RoadRow) => {
    setActiveReportId(null);
    focusRoad(road);
    const nextValue = getRoadPrimaryLabel(road);
    setSearchTerm(nextValue);
    searchTermRef.current = nextValue;
    addRecentSearch(road);
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

  const toggleHover = () => {
    const map = mapRef.current;
    setHoverEnabled((prev) => {
      const next = !prev;
      hoverEnabledRef.current = next;
      if (!next && map) {
        hoveredRoadIdRef.current = null;
        selectedRoadIdRef.current = null;
        setActiveReportId(null);
        setActiveRoad(null);
        highlightSuppressedRef.current = false;
        applyHighlight(map, null);
        map.getCanvas().style.cursor = '';
      }
      return next;
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
    let detachInteractions: (() => void) | null = null;
    let detachReportInteractions: (() => void) | null = null;
    let cancelled = false;

    const ensureLayerOrder = () => {
      const hasPoints = !!map.getLayer('points');
      const hasHighlight = !!map.getLayer('roads-highlight');

      if (hasPoints) {
        map.moveLayer('points');
      }

      if (hasHighlight && hasPoints) {
        map.moveLayer('roads-highlight', 'points');
      }
    };

    const attachRoadInteractions = () => {
      const resetHoverState = () => {
        if (!searchTermRef.current.trim() && !selectedRoadIdRef.current) {
          hoveredRoadIdRef.current = null;
          setActiveRoad(null);
          applyHighlight(map, null);
        } else if (selectedRoadIdRef.current && !highlightSuppressedRef.current) {
          applyHighlight(map, selectedRoadIdRef.current);
        }
        map.getCanvas().style.cursor = '';
      };

      const handleHover = (e: MapLayerMouseEvent) => {
        if (!hoverEnabledRef.current) {
          map.getCanvas().style.cursor = '';
          return;
        }
        const feature = e.features?.[0];
        if (!feature) return;

        if (selectedRoadIdRef.current && !highlightSuppressedRef.current) {
          applyHighlight(map, selectedRoadIdRef.current);
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
          applyHighlight(map, featureId);
        }

        map.getCanvas().style.cursor = 'pointer';
      };

      const handleClick = (e: MapLayerMouseEvent) => {
        if (skipRoadClickRef.current) {
          skipRoadClickRef.current = false;
          return;
        }

        if (!hoverEnabledRef.current) return;
        const feature = e.features?.[0];
        if (!feature) return;

        setActiveReportId(null);

        const rawId =
          feature.id ??
          (feature.properties?.id as string | number | undefined);
        if (rawId === undefined || rawId === null) return;

        const featureId = normalizeId(rawId);
        const name = (feature.properties?.name as string) || '';
        const highway = (feature.properties?.highway as string) || '';
        const nextValue = name || highway || featureId;

        const road = findRoadById(featureId);
        highlightSuppressedRef.current = false;
        selectedRoadIdRef.current = featureId;
        hoveredRoadIdRef.current = featureId;
        searchTermRef.current = nextValue;
        setSearchTerm(nextValue);
        if (road) setActiveRoad(road);

        applyHighlight(map, featureId);
      };

      map.on('mousemove', 'roads-hit', handleHover);
      map.on('click', 'roads-hit', handleClick);
      map.on('mouseleave', 'roads-hit', resetHoverState);

      return () => {
        map.off('mousemove', 'roads-hit', handleHover);
        map.off('click', 'roads-hit', handleClick);
        map.off('mouseleave', 'roads-hit', resetHoverState);
      };
    };

    const attachReportInteractions = () => {
      const handleReportClick = (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const roadId =
          feature?.properties?.road_id as string | number | null | undefined;
        const reportId = feature?.properties?.id as number | null | undefined;

        if (reportId !== null && reportId !== undefined) {
          setActiveReportId(reportId);
        }

        highlightSuppressedRef.current = true;
        applyHighlight(map, null);
        skipRoadClickRef.current = true;
        window.setTimeout(() => {
          skipRoadClickRef.current = false;
        }, 0);
        focusRoadById(roadId, { highlight: false });
      };

      const handleReportEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };

      const handleReportLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      map.on('click', 'points', handleReportClick);
      map.on('mouseenter', 'points', handleReportEnter);
      map.on('mouseleave', 'points', handleReportLeave);

      return () => {
        map.off('click', 'points', handleReportClick);
        map.off('mouseenter', 'points', handleReportEnter);
        map.off('mouseleave', 'points', handleReportLeave);
      };
    };

    const loadRoads = async () => {
      const { data, error } = await supabase
        .from('roads')
        .select('id, geom, highway, name, props, kota, kecamatan, kelurahan, tipe_jalan, lingkungan, rt, rw, condition, status, length, width, osm_id');

      if (cancelled) return;

      if (error) {
        console.error('Error fetch roads:', error);
        setMapReady(true);
        return;
      }

      const roadsList = (data || []) as RoadRow[];

      roadsDataRef.current = roadsList;
      setRoads(roadsList);

      if (!roadsList.length) {
        console.warn('Tidak ada data roads di Supabase');
      }

      const featureCollection = buildFeatureCollection(roadsList);
      syncRoadSource(map, featureCollection);
      ensureRoadLayers(map);
      ensureLayerOrder();

      try {
        const coords = roadsList.flatMap((r) => extractCoordinates(r.geom));
        const bounds = getBoundsFromCoordinates(coords);
        if (bounds) {
          map.fitBounds(bounds, { padding: 40 });
        }
      } catch (err) {
        console.warn('Gagal hitung bounds roads:', err);
      }

      detachInteractions = attachRoadInteractions();
      setMapReady(true);
    };

    const loadLaporan = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, latitude, longitude, kerusakan_level, deskripsi, status, kontak_pelapor, created_at, updated_at, road_id, user_id');
      if (cancelled) return;

      if (error) {
        console.error('Error fetch laporan:', error);
        setLaporan([]);
        return;
      }

      const laporanList = ((data || []) as LaporanRow[]).map((item) => ({
        ...item,
        longitude: item.longitude === null ? null : Number(item.longitude),
        latitude: item.latitude === null ? null : Number(item.latitude),
      }));
      setLaporan(laporanList);

      const reportsIcon = await map.loadImage(triangleAlert);
      map.addImage('reports-icon', reportsIcon.data);

      const reportFeatures: GeoJSON.Feature[] = laporanList
        .filter(
          (item) =>
            Number.isFinite(item.longitude) && Number.isFinite(item.latitude)
        )
        .map((item) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.longitude as number, item.latitude as number],
          },
          properties: {
            id: item.id,
            kerusakan_level: item.kerusakan_level,
            deskripsi: item.deskripsi,
            status: item.status,
            kontak_pelapor: item.kontak_pelapor,
            created_at: item.created_at,
            updated_at: item.updated_at,
            road_id: item.road_id,
            user_id: item.user_id
          },
        }));

      console.log(reportFeatures);

      map.addSource('point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: reportFeatures,
        },
      });
      ensureLayerOrder();
      map.addLayer({
        id: 'points',
        type: 'symbol',
        source: 'point',
        layout: {
          'icon-image': 'reports-icon',
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 0.03,
            16, 0.04,
            18, 0.05
          ],
        },
        paint: {
          'icon-opacity': 1
        }
      });
      ensureLayerOrder();
      detachReportInteractions?.();
      detachReportInteractions = attachReportInteractions();
    };



    const handleLoad = () => {
      void loadRoads();
      void loadLaporan();
    };

    map.once('load', handleLoad);

    return () => {
      cancelled = true;
      detachInteractions?.();
      detachReportInteractions?.();
      map.off('load', handleLoad);
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const featureCollection = buildFeatureCollection(filteredRoads);
    syncRoadSource(map, featureCollection);
    ensureRoadLayers(map);

    const selectedId = selectedRoadIdRef.current;
    if (selectedId) {
      const stillExists = filteredRoads.some(
        (road) => normalizeId(road.id) === selectedId
      );
      if (!stillExists) {
        selectedRoadIdRef.current = null;
        setActiveReportId(null);
        setActiveRoad(null);
        highlightSuppressedRef.current = false;
        applyHighlight(map, null);
      }
    }
  }, [filteredRoads, mapReady]);

  const activeRoadId = activeRoad ? normalizeId(activeRoad.id) : null;
  const isRoadSelected = !!activeRoadId && selectedRoadIdRef.current === activeRoadId;
  const roadDetails = useRoadDetails(activeRoad);
  const { reports, reportsLoading, reportsError } = useReports(
    activeRoadId,
    isRoadSelected
  );
  const activeReport = useMemo(
    () =>
      activeReportId === null
        ? null
        : reports.find((item) => item.id === activeReportId) ??
          laporan.find((item) => item.id === activeReportId) ??
          null,
    [activeReportId, laporan, reports]
  );

  useEffect(() => {
    if (activeReportId !== null && !activeReport) {
      setActiveReportId(null);
    }
  }, [activeReportId, activeReport]);

  useEffect(() => {
    if (!searchDialogOpen) return undefined;

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [searchDialogOpen]);

  const clearHighlight = () => {
    const map = mapRef.current;
    if (map) applyHighlight(map, null);
  };

  const handleCloseDetail = () => {
    highlightSuppressedRef.current = false;
    selectedRoadIdRef.current = null;
    setActiveReportId(null);
    setActiveRoad(null);
    clearHighlight();
  };

  const handleSelectReport = (report: ReportRow) => {
    setActiveReportId(report.id);
    focusRoadById(report.road_id, { highlight: false });
  };

  const handleCloseReportDetail = () => {
    setActiveReportId(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-53px)]">
      <div ref={mapContainerRef} className="w-full h-full overflow-hidden" />

      <MapSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        searchResults={searchResults}
        recentSearches={recentSearches}
        onSelectRoad={handleSelectRoad}
        findRoadById={findRoadById}
        ref={searchInputRef}
      />

      <DetailPanel
        show={!!(activeRoad && isRoadSelected)}
        activeRoad={activeRoad}
        roadDetails={roadDetails}
        isRoadSelected={isRoadSelected}
        reports={reports}
        reportsLoading={reportsLoading}
        reportsError={reportsError}
        onClose={handleCloseDetail}
        onClearHighlight={clearHighlight}
        onSelectReport={handleSelectReport}
        selectedReportId={activeReportId}
        activeReport={activeReport}
        onBackToReports={handleCloseReportDetail}
      />

      <MapControls
        mapMode={mapMode}
        onModeChange={setMapMode}
        mapReady={mapReady}
        onSearch={() => setSearchDialogOpen(true)}
        onZoomIn={() => handleZoom('in')}
        onZoomOut={() => handleZoom('out')}
        onReset={handleResetView}
        hoverEnabled={hoverEnabled}
        onToggleHover={toggleHover}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
        filters={filters}
        filterOptions={filterOptions}
        onSelectFilter={setFilterValue}
        onResetFilters={resetFilters}
        onApplyFilters={() => setFilterOpen(false)}
        onCancelFilters={() => setFilterOpen(false)}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
};

export default Maps;
