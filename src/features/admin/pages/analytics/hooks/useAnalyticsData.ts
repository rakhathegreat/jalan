import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/shared/services/supabase';
import { formatKerusakanLevel, formatReportCode } from '@/features/admin/pages/maps/mapHelpers';

type SummarySnapshot = {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  roads: number;
  scans: number;
  reportsLast30: number;
  reportsPrev30: number;
  resolvedLast30: number;
  resolvedPrev30: number;
  scansLast30: number;
  scansPrev30: number;
};

export type AnalyticsIncident = {
  id: number;
  description: string;
  time: string;
  severity: string;
};

export type RegionSeries = Record<string, Array<{ month: string; scans: number; completion: number }>>;
export type RegionLeader = { name: string; total: number; completion: number };
export type AnalyticsDataState = {
  summary: SummarySnapshot;
  incidents: AnalyticsIncident[];
  regionSeries: RegionSeries;
  regionOrder: string[];
  regionLeaders: RegionLeader[];
  loading: boolean;
  error: string | null;
};

const defaultSummary: SummarySnapshot = {
  totalReports: 0,
  activeReports: 0,
  resolvedReports: 0,
  roads: 0,
  scans: 0,
  reportsLast30: 0,
  reportsPrev30: 0,
  resolvedLast30: 0,
  resolvedPrev30: 0,
  scansLast30: 0,
  scansPrev30: 0,
};

type CountResult = { count?: number | null; error?: { message?: string } | null };

const extractCount = (
  result: PromiseSettledResult<CountResult>,
  errors: string[]
) => {
  if (result.status === 'fulfilled') {
    if (result.value.error) {
      errors.push(result.value.error.message ?? 'Gagal menghitung data.');
    }
    return typeof result.value.count === 'number' ? result.value.count : 0;
  }
  errors.push('Gagal mengambil data dari Supabase.');
  return 0;
};

const formatRelativeTime = (value: string | null) => {
  if (!value) return '-';
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return '-';

  const diff = Date.now() - timestamp.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Baru saja';
  if (diff < hour) return `${Math.round(diff / minute)} menit lalu`;
  if (diff < day) return `${Math.round(diff / hour)} jam lalu`;
  if (diff < 7 * day) return `${Math.round(diff / day)} hari lalu`;

  return timestamp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const addMonthBucket = (
  buckets: Map<string, Map<string, { label: string; total: number; done: number }>>,
  region: string,
  monthKey: string,
  monthLabel: string,
  isDone: boolean
) => {
  const regionBuckets = buckets.get(region) ?? new Map<string, { label: string; total: number; done: number }>();
  const current = regionBuckets.get(monthKey) ?? { label: monthLabel, total: 0, done: 0 };
  const updated = { ...current, total: current.total + 1, done: current.done + (isDone ? 1 : 0) };
  regionBuckets.set(monthKey, updated);
  buckets.set(region, regionBuckets);
};

export const useAnalyticsData = () => {
  const [summary, setSummary] = useState<SummarySnapshot>(defaultSummary);
  const [incidents, setIncidents] = useState<AnalyticsIncident[]>([]);
  const [regionSeries, setRegionSeries] = useState<RegionSeries>({});
  const [regionOrder, setRegionOrder] = useState<string[]>([]);
  const [regionLeaders, setRegionLeaders] = useState<RegionLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const errors: string[] = [];

    const now = new Date();
    const last30 = new Date(now);
    last30.setDate(last30.getDate() - 30);
    const prev30 = new Date(last30);
    prev30.setDate(prev30.getDate() - 30);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalReportsCount,
      activeReportsCount,
      resolvedReportsCount,
      roadsCount,
      scansCount,
      reportsCurrentRange,
      reportsPreviousRange,
      resolvedCurrentRange,
      resolvedPreviousRange,
      scansCurrentRange,
      scansPreviousRange,
    ] = await Promise.allSettled<CountResult | { data?: any[]; error?: { message?: string } | null }>([
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .or('status.is.null,status.neq.done'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'done'),
      supabase.from('roads').select('*', { count: 'exact', head: true }),
      supabase.from('scan').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', last30.toISOString()),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', last30.toISOString())
        .gte('created_at', prev30.toISOString()),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .gte('created_at', last30.toISOString()),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'done')
        .lt('created_at', last30.toISOString())
        .gte('created_at', prev30.toISOString()),
      supabase.from('scan').select('*', { count: 'exact', head: true }).gte('created_at', last30.toISOString()),
      supabase
        .from('scan')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', last30.toISOString())
        .gte('created_at', prev30.toISOString()),
    ]);

    setSummary({
      totalReports: extractCount(totalReportsCount, errors),
      activeReports: extractCount(activeReportsCount, errors),
      resolvedReports: extractCount(resolvedReportsCount, errors),
      roads: extractCount(roadsCount, errors),
      scans: extractCount(scansCount, errors),
      reportsLast30: extractCount(reportsCurrentRange, errors),
      reportsPrev30: extractCount(reportsPreviousRange, errors),
      resolvedLast30: extractCount(resolvedCurrentRange, errors),
      resolvedPrev30: extractCount(resolvedPreviousRange, errors),
      scansLast30: extractCount(scansCurrentRange, errors),
      scansPrev30: extractCount(scansPreviousRange, errors),
    });

    const { data: recentReports = [], error: reportsError } = await supabase
      .from('reports')
      .select('id, status, kerusakan_level, deskripsi, created_at, road:roads(kota)')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    if (reportsError) {
      errors.push(reportsError.message ?? 'Gagal memuat laporan terbaru.');
    }

    const normalizedReports = (recentReports ?? []) as Array<{
      id: number;
      status: string | null;
      kerusakan_level: string | null;
      deskripsi: string | null;
      created_at: string | null;
      road?: { kota?: string | null } | null;
    }>;

    const regionBuckets = new Map<string, Map<string, { label: string; total: number; done: number }>>();
    const regionTotals = new Map<string, number>();
    const regionDoneTotals = new Map<string, number>();

    normalizedReports.forEach((report) => {
      const createdAt = report.created_at ? new Date(report.created_at) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;

      const region = report.road?.kota ?? 'Tidak ada kota';
      const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
      const monthLabel = createdAt.toLocaleDateString('id-ID', { month: 'short' });
      const isDone = (report.status ?? '').toLowerCase() === 'done';

      addMonthBucket(regionBuckets, region, monthKey, monthLabel, isDone);
      addMonthBucket(regionBuckets, 'Semua wilayah', monthKey, monthLabel, isDone);

      regionTotals.set(region, (regionTotals.get(region) ?? 0) + 1);
      regionTotals.set('Semua wilayah', (regionTotals.get('Semua wilayah') ?? 0) + 1);
      if (isDone) {
        regionDoneTotals.set(region, (regionDoneTotals.get(region) ?? 0) + 1);
        regionDoneTotals.set('Semua wilayah', (regionDoneTotals.get('Semua wilayah') ?? 0) + 1);
      }
    });

    const builtSeries: RegionSeries = {};
    regionBuckets.forEach((months, region) => {
      const series = Array.from(months.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => ({
          month: value.label,
          scans: value.total,
          completion: value.total ? Math.round((value.done / value.total) * 100) : 0,
        }));
      builtSeries[region] = series;
    });

    const sortedRegions = Array.from(regionTotals.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([name]) => name);

    setRegionSeries(builtSeries);
    setRegionOrder(sortedRegions);
    setRegionLeaders(
      Array.from(regionTotals.entries())
        .map(([name, total]) => {
          const done = regionDoneTotals.get(name) ?? 0;
          const completion = total ? Math.round((done / total) * 100) : 0;
          return { name, total, completion };
        })
        .sort((a, b) => b.total - a.total)
    );

    setIncidents(
      normalizedReports.slice(0, 5).map((report) => ({
        id: report.id,
        description:
          report.deskripsi?.trim() ||
          `${formatReportCode(report.id)} di ${report.road?.kota ?? 'lokasi tidak diketahui'}`,
        time: formatRelativeTime(report.created_at),
        severity: formatKerusakanLevel(report.kerusakan_level) ?? 'Tidak diketahui',
      }))
    );

    setError(errors.length ? errors.join(' ') : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, incidents, regionSeries, regionOrder, regionLeaders, loading, error };
};

export default useAnalyticsData;
