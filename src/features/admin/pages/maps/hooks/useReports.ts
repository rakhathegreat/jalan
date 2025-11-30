import { useEffect, useState } from 'react';
import { supabase } from '@/shared/services/supabase';
import type { ReportRow } from '../types';

export const useReports = (roadId: string | null, enabled: boolean) => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  useEffect(() => {
    if (!roadId || !enabled) {
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
        .select('id, user_id, kerusakan_level, deskripsi, status, kontak_pelapor, created_at, updated_at, road_id, latitude, longitude')
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

    void loadReports();

    return () => {
      isCancelled = true;
    };
  }, [roadId, enabled]);

  return { reports, reportsLoading, reportsError };
};
