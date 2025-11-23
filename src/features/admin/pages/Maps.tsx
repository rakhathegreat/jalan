import { useEffect, useRef } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type * as GeoJSON from 'geojson';
import { supabase } from '@/shared/services/supabase';

const MAP_CENTER: [number, number] = [108.5325038591979, -7.369617983909407];
const MAP_STYLE =
  'https://api.maptiler.com/maps/streets-v4/style.json?key=a7j0hgsQIyRNxPavCq8I';

const MAP_BOUNDS: maplibregl.LngLatBoundsLike = [
  [108.50333395341329, -7.384947285610721], // Southwest (minLng, minLat)
  [108.56235933275224, -7.356833238613973], // Northeast (maxLng, maxLat)
];

type RoadRow = {
  id: string;
  geom: GeoJSON.LineString | GeoJSON.MultiLineString;
  highway: string | null;
  name: string | null;
  props: any | null;
};

const Maps = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: 13,
      maxBounds: MAP_BOUNDS,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', async () => {
      // 1) AMBIL DATA JALAN DARI SUPABASE
      const { data, error } = await supabase
        .from('roads')
        .select<'id, geom, highway, name, props'>('id, geom, highway, name, props');

      if (error) {
        console.error('Error fetch roads:', error);
        return;
      }

      const roads = (data || []) as RoadRow[];

      if (!roads.length) {
        console.warn('Tidak ada data roads di Supabase');
      }

      // 2) KONVERSI KE GEOJSON FEATURECOLLECTION
      const featureCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: roads
          .filter((r) => r.geom) // pastikan geom tidak null
          .map((r) => ({
            type: 'Feature',
            id: r.id,
            geometry: r.geom,
            properties: {
              highway: r.highway,
              name: r.name,
              ...((r.props ?? {}) as Record<string, any>),
            },
          })),
      };

      // 3) ADD SOURCE KE MAPLIBRE
      if (map.getSource('roads')) {
        (map.getSource('roads') as maplibregl.GeoJSONSource).setData(
          featureCollection
        );
      } else {
        map.addSource('roads', {
          type: 'geojson',
          data: featureCollection,
        });
      }

      // 4) ADD LAYER UNTUK HIGHLIGHT SEMUA JALAN
      if (!map.getLayer('roads-line')) {
        map.addLayer({
          id: 'roads-line',
          type: 'line',
          source: 'roads',
          paint: {
            // warna & ketebalan bebas kamu ganti
            'line-color': '#ff4d4f',
            'line-width': [
              'case',
              ['==', ['get', 'highway'], 'primary'],
              3.5, // jalan besar
              1.5, // jalan lain
            ],
          },
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
          const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
          map.fitBounds(bounds, { padding: 40 });
        }
      } catch (err) {
        console.warn('Gagal hitung bounds roads:', err);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-[calc(100vh-72px)]">
      <div ref={mapContainerRef} className="w-full h-full overflow-hidden" />
    </div>
  );
};

export default Maps;