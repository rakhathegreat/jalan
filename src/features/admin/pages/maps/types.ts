import type * as GeoJSON from 'geojson';

export type RoadRow = {
  id: string;
  geom: GeoJSON.LineString | GeoJSON.MultiLineString | null;
  highway: string | null;
  name: string | null;
  props: any | null;
  osm_id: string | null;
  kota: string | null;
  kecamatan: string | null;
  kelurahan: string | null;
  tipe_jalan: string | null;
  rt: number | null;
  rw: number | null;
  lingkungan: string | null;
  condition: string | null;
  status: string | null;
  length: number | null;
  width: number | null;
};

export type ReportRow = {
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

export type RecentSearchItem = { id: string; label: string; secondary: string };

export type MapMode = '2d' | '3d';

export type LaporanRow = {
  id: number;
  latitude: number | null;
  longitude: number | null;
  kerusakan_level: string | null;
  deskripsi: string | null;
  status: string | null;
  kontak_pelapor: string | null;
  created_at: string | null;
  updated_at: string | null;
  road_id: string | null;
  user_id: string | null;
};
