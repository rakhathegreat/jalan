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
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/Card';
import { cn } from '@shared/lib/cn';
import type { TooltipPayload } from 'recharts/types/state/tooltipSlice';

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

const summaryMetrics: SummaryMetric[] = [
  {
    title: 'Active Users',
    value: '12.842',
    change: '+5.4%',
    caption: 'vs last 30 days',
    trend: 'up',
    icon: Users,
    accent: 'bg-brand-100 text-brand-700',
  },
  {
    title: 'QR Points',
    value: '31.220',
    change: '+1.3%',
    caption: 'new QR placements',
    trend: 'up',
    icon: Leaf,
    accent: 'bg-brand-100 text-brand-700',
  },
  {
    title: 'Scans',
    value: '86.904',
    change: '+18%',
    caption: 'school campaign spike',
    trend: 'up',
    icon: Scan,
    accent: 'bg-brand-100 text-brand-700',
  },
  {
    title: 'Alerts',
    value: '16 cases',
    change: '-22%',
    caption: 'drop in moderation reports',
    trend: 'down',
    icon: ShieldCheck,
    accent: 'bg-brand-100 text-brand-700',
  },
];

const regionStats = [
  { region: 'Faculty of Engineering', trees: '8.420', scans: '24.110', completion: 94, status: 'stable' },
  { region: 'Faculty of Economics & Business', trees: '4.108', scans: '12.405', completion: 88, status: 'monitor' },
  { region: 'Faculty of Social & Political Sciences', trees: '3.790', scans: '9.842', completion: 76, status: 'needs action' },
  { region: 'Faculty of Health Sciences', trees: '2.150', scans: '6.941', completion: 79, status: 'stable' },
];

const regionPerformanceData: Record<
  string,
  Array<{ month: string; scans: number; completion: number }>
> = {
  'Faculty of Engineering': [
    { month: 'Jan', scans: 3420, completion: 85 },
    { month: 'Feb', scans: 3811, completion: 88 },
    { month: 'Mar', scans: 4120, completion: 91 },
    { month: 'Apr', scans: 4364, completion: 93 },
    { month: 'May', scans: 4198, completion: 92 },
    { month: 'Jun', scans: 4521, completion: 94 },
  ],
  'Faculty of Economics & Business': [
    { month: 'Jan', scans: 2280, completion: 78 },
    { month: 'Feb', scans: 2388, completion: 80 },
    { month: 'Mar', scans: 2501, completion: 84 },
    { month: 'Apr', scans: 2670, completion: 87 },
    { month: 'May', scans: 2610, completion: 86 },
    { month: 'Jun', scans: 2754, completion: 88 },
  ],
  'Faculty of Social & Political Sciences': [
    { month: 'Jan', scans: 1560, completion: 68 },
    { month: 'Feb', scans: 1654, completion: 70 },
    { month: 'Mar', scans: 1720, completion: 72 },
    { month: 'Apr', scans: 1905, completion: 74 },
    { month: 'May', scans: 2015, completion: 75 },
    { month: 'Jun', scans: 2142, completion: 76 },
  ],
  'Faculty of Health Sciences': [
    { month: 'Jan', scans: 1402, completion: 71 },
    { month: 'Feb', scans: 1494, completion: 73 },
    { month: 'Mar', scans: 1522, completion: 75 },
    { month: 'Apr', scans: 1605, completion: 76 },
    { month: 'May', scans: 1711, completion: 78 },
    { month: 'Jun', scans: 1823, completion: 79 },
  ],
};

const regionOptions = regionStats.map((region) => region.region);

const formatScanTick = (value: number) => {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return value.toString();
};

const defaultRegion = regionOptions[0] ?? 'Faculty of Engineering';

type RegionTooltipPayload = TooltipPayload & { dataKey?: string };

const RegionTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  const completionEntry = payload.find(
    (item): item is RegionTooltipPayload => item.dataKey === 'completion'
  );
  const scansEntry = payload.find(
    (item): item is RegionTooltipPayload => item.dataKey === 'scans'
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-2 flex flex-col gap-2 text-sm text-gray-600">
        {completionEntry && typeof completionEntry.values === 'number' && (
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span>Completion rate</span>
            <span className="ml-auto font-semibold text-gray-900">
              {completionEntry.values().toString()}%
            </span>
          </div>
        )}
        {scansEntry && typeof scansEntry.values === 'number' && (
          <div className="flex flex-col gap-1">
            <div className='flex items-center gap-3'>
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                <span>Weekly scans</span>
            </div>
            <span className="font-medium text-gray-900">
              {scansEntry.values.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const incidents = [
  {
    title: 'Mass scan anomaly',
    description: '20 scans in 3 minutes on a non-public QR',
    time: '12 minutes ago',
    severity: 'critical',
  },
  {
    title: 'Damaged QR report',
    description: 'Point #QP-883 in Bandung cannot be scanned',
    time: '45 minutes ago',
    severity: 'warning',
  },
  {
    title: 'Bulk data access request',
    description: 'Submitted by Bogor research team',
    time: '3 hours ago',
    severity: 'info',
  },
];

const OverviewTab = () => {
  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement | null>(null);

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

  const chartData = regionPerformanceData[selectedRegion] ?? [];

  const handleSelectRegion = (region: string) => {
    setSelectedRegion(region);
    setRegionMenuOpen(false);
  };

  return (
    <div className="space-y-4">
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
                    <p className="text-xs text-gray-500">Statistics for 24 hours</p>
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
                        <th className="px-4 py-3 font-normal">Incidents</th>
                        <th className="px-4 py-3 font-normal">Time</th>
                        <th className="px-4 py-3 font-normal">Severity</th>
                    </tr>
                </thead>
                <tbody>
                    {incidents.map((incident) => (
                        <tr className="border-t border-gray-300" key={incident.title}>
                            <td className="p-4 text-xs text-gray-800">{incident.description}</td>
                            <td className="p-4 text-xs text-gray-800">{incident.time}</td>
                            <td className="p-4 text-xs text-gray-800">{incident.severity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      <section>
        <Card variant="ghost">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className='space-y-2'>
              <CardTitle>Regional performance</CardTitle>
              <CardDescription>Key planting sites and their mission completion rate.</CardDescription>
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
                  {regionOptions.map((region) => (
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
                  <Tooltip cursor={{ stroke: '#c7d2fe', strokeWidth: 1.5 }} content={<RegionTooltip active={false} payload={[]} coordinate={undefined} accessibilityLayer={false} activeIndex={undefined} />} />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="scans"
                    stroke="#4b7e5f"
                    fill="url(#scanGradient)"
                    strokeWidth={2}
                    name="scans"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default OverviewTab;
