import maplibregl, { type Map } from 'maplibre-gl';
import type * as GeoJSON from 'geojson';

import { normalizeId } from './mapHelpers';
import type { RoadRow } from './types';

export const getBoundsFromCoordinates = (coords: [number, number][]) => {
  if (!coords.length) return null;
  return coords.slice(1).reduce(
    (bounds, coord) => bounds.extend(coord),
    new maplibregl.LngLatBounds(coords[0], coords[0])
  );
};

export const setHighlightFilter = (map: Map, roadId: string | null) => {
  if (!map.getLayer('roads-highlight')) return;
  map.setFilter('roads-highlight', ['==', ['get', 'id'], roadId ?? '']);
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

export const calculateRoadLength = (
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

const hasGeometry = (
  road: RoadRow
): road is RoadRow & { geom: NonNullable<RoadRow['geom']> } => !!road.geom;

export const buildFeatureCollection = (
  roads: RoadRow[]
): GeoJSON.FeatureCollection<GeoJSON.Geometry> => ({
  type: 'FeatureCollection',
  features: roads
    .filter(hasGeometry)
    .map((r) => {
      const featureId = normalizeId(r.id);
      return {
        type: 'Feature',
        id: featureId,
        geometry: r.geom as GeoJSON.Geometry,
        properties: {
          id: featureId,
          highway: r.highway,
          name: r.name,
          tipe_jalan: r.tipe_jalan,
          ...((r.props ?? {}) as Record<string, any>),
        },
      };
    }),
});
