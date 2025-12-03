import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Leaf,
  Scan,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/Card';
import { cn } from '@shared/lib/cn';
import type { AnalyticsDataState } from '@/features/admin/pages/analytics/hooks/useAnalyticsData';

type Trend = 'up' | 'down';

type SummaryMetric = {
  title: string;
  value: string;
  change: string;
  caption: string;
  trend: Trend;
  icon: LucideIcon;
  accent: string;
};

const formatScanTick = (value: number) => {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return value.toString();
};

const defaultRegion = 'Semua wilayah';

const RegionTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const completionEntry = payload.find((item) => (item?.dataKey ?? '') === 'completion');
  const scansEntry = payload.find((item) => (item?.dataKey ?? '') === 'scans');

  const completionValue =
    typeof completionEntry?.value === 'number' ? completionEntry.value : null;
  const scansValue = typeof scansEntry?.value === 'number' ? scansEntry.value : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-2 flex flex-col gap-2 text-sm text-gray-600">
        {completionValue !== null && (
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span>Tingkat selesai</span>
            <span className="ml-auto font-semibold text-gray-900">
              {completionValue.toFixed(0)}%
            </span>
          </div>
        )}
        {scansValue !== null && (
          <div className="flex flex-col gap-1">
            <div className='flex items-center gap-3'>
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                <span>Total laporan</span>
            </div>
            <span className="font-medium text-gray-900">
              {scansValue.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const numberFormatter = new Intl.NumberFormat('id-ID');

const formatValue = (value: number, loading: boolean) => (loading ? '...' : numberFormatter.format(value));

const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  const delta = ((current - previous) / previous) * 100;
  return Number.isFinite(delta) ? delta : 0;
};

const formatChange = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const trendFromChange = (value: number): Trend => (value >= 0 ? 'up' : 'down');

type OverviewTabProps = {
  data: AnalyticsDataState;
};

const OverviewTab = ({ data }: OverviewTabProps) => {
  const { summary, incidents, regionSeries, regionOrder, loading, error } = data;

  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!regionOrder.length) return;
    setSelectedRegion((prev) => (regionOrder.includes(prev) ? prev : regionOrder[0]));
  }, [regionOrder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        regionDropdownRef.current &&
        !regionDropdownRef.current.contains(event.target as Node)
      ) {
        setRegionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chartData = regionSeries[selectedRegion] ?? [];

  const handleSelectRegion = (region: string) => {
    setSelectedRegion(region);
    setRegionMenuOpen(false);
  };

  const reportChange = calculateChange(summary.reportsLast30, summary.reportsPrev30);
  const resolvedChange = calculateChange(summary.resolvedLast30, summary.resolvedPrev30);
  const scanChange = calculateChange(summary.scansLast30, summary.scansPrev30);
  const backlogChange = calculateChange(
    summary.reportsLast30 - summary.resolvedLast30,
    summary.reportsPrev30 - summary.resolvedPrev30
  );

  const summaryMetrics: SummaryMetric[] = [
    {
      title: 'Laporan baru',
      value: formatValue(summary.reportsLast30, loading),
      change: loading ? '...' : formatChange(reportChange),
      caption: 'Masuk 30 hari terakhir',
      trend: loading ? 'up' : trendFromChange(reportChange),
      icon: Scan,
      accent: 'bg-brand-100 text-brand-700',
    },
    {
      title: 'Laporan aktif',
      value: formatValue(summary.activeReports, loading),
      change: loading ? '...' : formatChange(backlogChange),
      caption: 'Pending & in progress',
      trend: loading ? 'up' : trendFromChange(backlogChange),
      icon: Users,
      accent: 'bg-brand-100 text-brand-700',
    },
    {
      title: 'Laporan selesai',
      value: formatValue(summary.resolvedLast30, loading),
      change: loading ? '...' : formatChange(resolvedChange),
      caption: 'Ditandai selesai (30 hari)',
      trend: loading ? 'up' : trendFromChange(resolvedChange),
      icon: ShieldCheck,
      accent: 'bg-brand-100 text-brand-700',
    },
    {
      title: 'Scan QR',
      value: formatValue(summary.scansLast30, loading),
      change: loading ? '...' : formatChange(scanChange),
      caption: 'Aktivitas scan (30 hari)',
      trend: loading ? 'up' : trendFromChange(scanChange),
      icon: Leaf,
      accent: 'bg-brand-100 text-brand-700',
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map(({ icon: Icon, ...metric }) => {
          const isTrendUp = metric.trend === 'up';
          const TrendIcon = isTrendUp ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={metric.title} variant="ghost" className="h-full bg-transparent">
              <CardHeader className="flex flex-col items-start justify-between space-y-2">
                <div className='flex flex-row items-center gap-3'>
                    <div className={cn('rounded-md p-2', metric.accent)}>
                        <Icon className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                    <p className="text-md font-medium tracking-tight text-gray-800">{metric.title}</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0">
                <div className='flex flex-col space-y-1'>
                    <p className="text-xs text-gray-500">{metric.caption}</p>
                    <p className="text-2xl font-semibold tracking-tight text-gray-900">{metric.value}</p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center text-sm font-medium',
                    isTrendUp ? 'text-brand-600' : 'text-red-600'
                  )}
                >
                  <TrendIcon className="mr-1.5 h-4 w-4" />
                  {metric.change}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="font-mono ">
        <div className='border border-gray-300 rounded-lg'>
            <table className='w-full font-mono'>
                <thead className='border-b border-gray-300'>
                    <tr className="text-xs text-left uppercase text-gray-500">
                        <th className="px-4 py-3 font-normal">Laporan</th>
                        <th className="px-4 py-3 font-normal">Waktu</th>
                        <th className="px-4 py-3 font-normal">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                      <tr className="border-t border-gray-300">
                        <td className="p-4 text-xs text-gray-800" colSpan={3}>Memuat laporan terbaru...</td>
                      </tr>
                    ) : incidents.length ? (
                      incidents.map((incident) => (
                        <tr className="border-t border-gray-300" key={incident.id}>
                          <td className="p-4 text-xs text-gray-800">{incident.description}</td>
                          <td className="p-4 text-xs text-gray-800">{incident.time}</td>
                          <td className="p-4 text-xs text-gray-800">{incident.severity}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-gray-300">
                        <td className="p-4 text-xs text-gray-800" colSpan={3}>Belum ada laporan pada periode ini.</td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </section>

      <section>
        <Card variant="ghost">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className='space-y-2'>
              <CardTitle>Performa per wilayah</CardTitle>
              <CardDescription>Data laporan dan penyelesaian yang diambil dari Supabase.</CardDescription>
            </div>
            <div className="relative" ref={regionDropdownRef}>
              <button
                type="button"
                onClick={() => setRegionMenuOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={regionMenuOpen}
                className='flex items-center w-full justify-center text-sm sm:text-xs border border-gray-300 rounded-lg px-4 py-2 gap-2 hover:bg-gray-100 text-gray-700'
              >
                {selectedRegion}
                <ChevronDown className={cn('h-4 w-4 transition-transform', regionMenuOpen && 'rotate-180')} strokeWidth={2.5} />
              </button>
              {regionMenuOpen && (
                <div className="absolute right-0 top-12 z-30 w-60 rounded-xl border border-gray-200 bg-white p-1 shadow-2xl">
                  {regionOrder.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => handleSelectRegion(region)}
                      className='flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100'
                    >
                      <span className="text-left">{region}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-64 w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-gray-500">
                  {loading ? 'Memuat data wilayah...' : 'Belum ada data wilayah pada periode ini.'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4b7e5f" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4b7e5f" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      padding={{ left: 20, right: 0 }}
                      scale="point"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatScanTick(Number(value))}
                    />
                    <Tooltip
                      cursor={{ stroke: '#c7d2fe', strokeWidth: 1.5 }}
                      content={<RegionTooltip active={false} payload={[]} coordinate={undefined} accessibilityLayer={false} />}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="scans"
                      stroke="#4b7e5f"
                      fill="url(#scanGradient)"
                      strokeWidth={2}
                      name="Laporan"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="completion"
                      stroke="#111827"
                      fillOpacity={0}
                      strokeWidth={2}
                      name="Selesai (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default OverviewTab;
