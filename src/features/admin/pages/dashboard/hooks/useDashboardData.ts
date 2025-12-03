import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/shared/services/supabase';
import {
  formatKerusakanLevel,
  formatReportCode,
  formatReportDate,
} from '../../maps/mapHelpers';

export type DashboardMetrics = {
  roads: number;
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  heavyReports: number;
};

export type DashboardChartPoint = {
  date: string;
  incoming: number;
  resolved: number;
};

export type DashboardTableRow = {
  id: number;
  kode: string;
  jalan: string;
  severity: string;
  status: string;
  lokasi: string;
  createdAt: string;
  kontak: string;
  deskripsi?: string | null;
};

const formatLocation = (road: any): string => {
  if (!road) return 'Lokasi belum tercatat';
  const parts = [road.kelurahan, road.kecamatan, road.kota].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Lokasi belum tercatat';
};

const buildChartData = (
  items: Array<{ created_at: string | null; status: string | null }>
): DashboardChartPoint[] => {
  const buckets = new Map<string, { incoming: number; resolved: number }>();

  items.forEach((item) => {
    if (!item.created_at) return;
    const date = new Date(item.created_at);
    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);
    const current = buckets.get(key) ?? { incoming: 0, resolved: 0 };
    current.incoming += 1;
    if ((item.status ?? '').toLowerCase() === 'done') {
      current.resolved += 1;
    }
    buckets.set(key, current);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, ...value }));
};

const defaultMetrics: DashboardMetrics = {
  roads: 0,
  totalReports: 0,
  activeReports: 0,
  resolvedReports: 0,
  heavyReports: 0,
};

export const useDashboardData = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([]);
  const [reports, setReports] = useState<DashboardTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  type CountResult = { count?: number | null; error?: { message?: string } | null };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const errors: string[] = [];

    const [
      roadsCount,
      totalReportsCount,
      activeReportsCount,
      resolvedReportsCount,
      heavyReportsCount,
    ] = await Promise.allSettled<CountResult>([
      supabase.from('roads').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.neq.done'),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done'),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .ilike('kerusakan_level', 'berat'),
    ]);

    const extractCount = (result: PromiseSettledResult<CountResult>) => {
      if (result.status === 'fulfilled') {
        if (result.value.error) {
          errors.push(result.value.error.message ?? 'Gagal menghitung data.');
        }
        return typeof result.value.count === 'number' ? result.value.count : 0;
      }
      errors.push('Gagal mengambil data dari Supabase.');
      return 0;
    };

    setMetrics({
      roads: extractCount(roadsCount),
      totalReports: extractCount(totalReportsCount),
      activeReports: extractCount(activeReportsCount),
      resolvedReports: extractCount(resolvedReportsCount),
      heavyReports: extractCount(heavyReportsCount),
    });

    const since = new Date();
    since.setDate(since.getDate() - 90);

    const { data: rawChart = [], error: chartError } = await supabase
      .from('reports')
      .select('id, created_at, status')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (chartError) {
      errors.push(chartError.message ?? 'Gagal memuat data grafik.');
    }

    setChartData(buildChartData(rawChart as any[]));

    const { data: recentReports = [], error: reportsError } = await supabase
      .from('reports')
      .select(
        'id, deskripsi, status, kerusakan_level, kontak_pelapor, created_at, road:roads(name, kelurahan, kecamatan, kota)'
      )
      .order('created_at', { ascending: false })
      .limit(20);

    if (reportsError) {
      errors.push(reportsError.message ?? 'Gagal memuat daftar laporan.');
    }

    setReports(
      (recentReports as any[]).map((report) => ({
        id: report.id,
        kode: formatReportCode(report.id),
        jalan: report.road?.name ?? 'Ruas belum diketahui',
        severity: formatKerusakanLevel(report.kerusakan_level) ?? 'Tidak diketahui',
        status: report.status ?? 'pending',
        lokasi: formatLocation(report.road),
        createdAt: formatReportDate(report.created_at),
        kontak: report.kontak_pelapor ?? 'Tidak ada kontak',
        deskripsi: report.deskripsi ?? '',
      }))
    );

    setError(errors.length ? errors.join(' ') : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markReportDone = useCallback(
    async (id: number) => {
      setMarkingId(id);
      try {
        const { error: updateError } = await supabase.from('reports').update({ status: 'done' }).eq('id', id);
        if (updateError) {
          setError(updateError.message ?? 'Gagal menandai laporan selesai.');
          return;
        }

        await load();
      } finally {
        setMarkingId(null);
      }
    },
    [load]
  );

  return { metrics, chartData, reports, loading, error, markReportDone, markingId };
};
