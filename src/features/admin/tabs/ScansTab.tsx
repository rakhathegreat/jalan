import {
  AlarmClock,
  AlertTriangle,
  Barcode,
  BatteryCharging,
  RadioTower,
  SatelliteDish,
  ScanFace,
  type LucideIcon,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/Card';
import Badge from '@shared/components/Badge';
import { cn } from '@shared/lib/cn';

type ScanMetric = {
  title: string;
  value: string;
  delta: string;
  desc: string;
  accent: string;
  icon: LucideIcon;
};

const scanMetrics: ScanMetric[] = [
  {
    title: 'Successful scans',
    value: '86.904',
    delta: '+18%',
    desc: 'vs last week',
    accent: 'bg-brand-50 text-brand-700 border border-brand-200',
    icon: Barcode,
  },
  {
    title: 'Average response time',
    value: '412 ms',
    delta: '-6%',
    desc: 'edge cache enabled',
    accent: 'bg-brand-50 text-brand-700 border border-brand-200',
    icon: AlarmClock,
  },
  {
    title: 'Duplicate detection',
    value: '0.42%',
    delta: '-12%',
    desc: 'heuristic fraud check',
    accent: 'bg-brand-100 text-brand-700 border border-brand-200',
    icon: ScanFace,
  },
  {
    title: 'Anomaly alerts',
    value: '29 cases',
    delta: '+4%',
    desc: 'sites need audit',
    accent: 'bg-brand-50 text-brand-700 border border-brand-200',
    icon: AlertTriangle,
  },
];

const edgeNodes = [
  { label: 'Main campus node', uptime: '99.2%', throughput: '41k req', load: 78 },
  { label: 'West Bandung node', uptime: '98.7%', throughput: '24k req', load: 64 },
  { label: 'Samarinda node', uptime: '97.4%', throughput: '11k req', load: 52 },
];

const fraudWatches = [
  {
    region: 'Engineering cluster',
    pattern: 'Rapid scans at night',
    action: 'Rate limit active',
    severity: 'Medium',
  },
  {
    region: 'City park',
    pattern: 'QR reprinted',
    action: 'PIC verifying on-site',
    severity: 'High',
  },
  {
    region: 'Public community',
    pattern: 'Offline scans > 30x',
    action: 'Audit log',
    severity: 'Watchlist',
  },
];

const energyStats = [
  { title: 'Solar gateway', value: '21 active', health: '88%', icon: BatteryCharging },
  { title: 'LoRa relay', value: '34 nodes', health: '92%', icon: RadioTower },
  { title: 'Backup satellite', value: '2 links', health: '99%', icon: SatelliteDish },
];

const ScansTab = () => {
  return (
    <div className="space-y-6">

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scanMetrics.map((metric) => (
          <Card key={metric.title} variant="ghost">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={cn('rounded-xl p-3', metric.accent)}>
                <metric.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
                <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.desc}</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Badge variant="outline" className="text-xs text-brand-700">
                {metric.delta}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card variant="ghost" className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Edge node status</CardTitle>
              <CardDescription>Capacity per scan distribution point.</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs text-brand-700">
              auto health check
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {edgeNodes.map((node) => (
              <div key={node.label} className="rounded-lg border border-gray-300 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{node.label}</p>
                    <p className="text-xs text-gray-500">{node.throughput} / 24h</p>
                  </div>
                  <Badge variant="success" className="text-xs">
                    Uptime {node.uptime}
                  </Badge>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${node.load}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardHeader>
            <CardTitle>Energy & telemetry</CardTitle>
            <CardDescription>Devices supporting offline scans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {energyStats.map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
                <div className="rounded-xl bg-gray-100 p-3">
                  <item.icon className="h-5 w-5 text-brand-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.value}</p>
                </div>
                <Badge variant="outline" className="text-xs text-brand-700">
                  {item.health}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card variant="ghost">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Fraud watch</CardTitle>
              <CardDescription>Regions monitored by the anti-cheat system.</CardDescription>
            </div>
            <Badge variant="destructive">fast response</Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-3 font-medium">Region</th>
                  <th className="pb-3 font-medium">Pattern</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {fraudWatches.map((row) => (
                  <tr key={row.region}>
                    <td className="py-3 font-semibold text-gray-900">{row.region}</td>
                    <td className="py-3">{row.pattern}</td>
                    <td className="py-3">{row.action}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          row.severity === 'High'
                            ? 'destructive'
                            : row.severity === 'Medium'
                              ? 'info'
                              : 'outline'
                        }
                      >
                        {row.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ScansTab;
