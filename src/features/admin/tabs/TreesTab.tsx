import {
  Droplets,
  MapPin,
  ShieldCheck,
  Trees as TreesIcon,
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

type TreeMetric = {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  accent: string;
};

const treeMetrics: TreeMetric[] = [
  {
    title: 'Trees recorded',
    value: '31.220',
    caption: 'includes validated QR points',
    icon: TreesIcon,
    accent: 'bg-brand-50 text-brand-700 border border-brand-200',
  },
  {
    title: 'Canopy health',
    value: '87%',
    caption: 'Q2 aerial survey',
    icon: ShieldCheck,
    accent: 'bg-brand-100 text-brand-700 border border-brand-200',
  },
  {
    title: 'Soil moisture',
    value: '63%',
    caption: 'weekly average',
    icon: Droplets,
    accent: 'bg-brand-50 text-brand-700 border border-brand-200',
  },
  {
    title: 'Priority locations',
    value: '12',
    caption: 'needs field inspection',
    icon: MapPin,
    accent: 'bg-brand-100 text-brand-700 border border-brand-200',
  },
];

const habitatStatus = [
  { label: 'City parks', percentage: 82, status: 'Stable' },
  { label: 'Satellite campus', percentage: 74, status: 'Needs pruning' },
  { label: 'Central public area', percentage: 66, status: 'Needs action' },
  { label: 'Social forestry', percentage: 91, status: 'Optimal' },
];

const maintenanceSchedule = [
  { task: 'Branch trimming', pic: 'Green campus team', due: '15 Jan', priority: 'Medium' },
  { task: 'Soil moisture sensor batch #84', pic: 'City volunteers', due: '18 Jan', priority: 'High' },
  { task: 'Replace fading QR', pic: 'Documentation unit', due: '21 Jan', priority: 'Low' },
];

const speciesMix = [
  { species: 'Angsana', share: 32, climate: 'humid', heat: 'heat tolerant' },
  { species: 'Kiara payung', share: 24, climate: 'tropical', heat: 'thrives in shade' },
  { species: 'Mahoni', share: 18, climate: 'tropical', heat: 'needs monitoring' },
  { species: 'Trembesi', share: 12, climate: 'wet', heat: 'stable' },
];

const TreesTab = () => {
  return (
    <div className="space-y-6">

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {treeMetrics.map((metric) => (
          <Card key={metric.title} variant="ghost">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={cn('rounded-xl p-3', metric.accent)}>
                <metric.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
                <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.caption}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card variant="ghost" className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Habitat & maintenance</CardTitle>
              <CardDescription>Canopy density indicators across four main zones.</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs text-brand-700">
              auto update
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {habitatStatus.map((habitat) => (
              <div key={habitat.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold text-gray-900">{habitat.label}</p>
                  <span className="text-gray-500">{habitat.status}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={cn(
                      'h-2 rounded-full',
                      habitat.percentage >= 85
                        ? 'bg-brand-700'
                        : habitat.percentage >= 70
                          ? 'bg-brand-500'
                          : 'bg-brand-300'
                    )}
                    style={{ width: `${habitat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardHeader>
            <CardTitle>Field schedule</CardTitle>
            <CardDescription>Scheduled maintenance activities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceSchedule.map((task) => (
              <div key={task.task} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{task.task}</p>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {task.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">PIC: {task.pic}</p>
                <p className="text-xs text-gray-400">Jatuh tempo {task.due}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card variant="ghost">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Species mix</CardTitle>
              <CardDescription>Dominant species and weather adaptation needs.</CardDescription>
            </div>
            <Badge variant="success" className="text-xs">
              reforest target achieved 72%
            </Badge>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="pb-3 font-medium">Species</th>
                  <th className="pb-3 font-medium">Share</th>
                  <th className="pb-3 font-medium">Climate</th>
                  <th className="pb-3 font-medium">Heat resilience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {speciesMix.map((item) => (
                  <tr key={item.species}>
                    <td className="py-3 font-semibold text-gray-900">{item.species}</td>
                    <td className="py-3">{item.share}%</td>
                    <td className="py-3 capitalize">{item.climate}</td>
                    <td className="py-3 capitalize">{item.heat}</td>
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

export default TreesTab;
