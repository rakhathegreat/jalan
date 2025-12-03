import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@shared/services/supabase';

export type UserReport = {
  id: number;
  status: string | null;
  severity: string | null;
  description: string | null;
  contact: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  roadId: string | null;
  latitude: number | null;
  longitude: number | null;
  road?: {
    name?: string | null;
    kota?: string | null;
    kecamatan?: string | null;
    kelurahan?: string | null;
  } | null;
};

type Options = { limit?: number; enabled?: boolean };

export const useReportHistory = (userId?: string | null, options?: Options) => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = options?.limit ?? 50;
  const enabled = options?.enabled ?? true;

  const load = useCallback(async () => {
    if (!userId || !enabled) {
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('reports')
      .select(
        'id, user_id, kerusakan_level, deskripsi, status, kontak_pelapor, created_at, updated_at, road_id, latitude, longitude, road:roads(name, kota, kecamatan, kelurahan)'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message ?? 'Gagal memuat riwayat laporan.');
      setReports([]);
      setLoading(false);
      return;
    }

    setReports(
      (data ?? []).map((item) => ({
        id: item.id as number,
        status: item.status ?? 'pending',
        severity: item.kerusakan_level ?? null,
        description: item.deskripsi ?? null,
        contact: item.kontak_pelapor ?? null,
        createdAt: item.created_at ?? null,
        updatedAt: item.updated_at ?? null,
        roadId: item.road_id ?? null,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        road: item.road as any,
      }))
    );
    setLoading(false);
  }, [enabled, limit, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { reports, loading, error, reload: load };
};

export default useReportHistory;
