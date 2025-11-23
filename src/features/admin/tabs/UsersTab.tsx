import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Users,
  UserPlus,
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

type Trend = 'up' | 'down';

type Metric = {
  title: string;
  value: string;
  change: string;
  trend: Trend;
  icon: LucideIcon;
  accent: string;
  caption: string;
};

const userMetrics: Metric[] = [
  {
    title: 'Daily active users',
    value: '4.210',
    change: '+8,1%',
    trend: 'up',
    icon: Users,
    accent: 'bg-brand-50 text-brand-700 border border-brand-200',
    caption: 'vs last week',
  },
  {
    title: 'New registrations',
    value: '812',
    change: '+3,4%',
    trend: 'up',
    icon: UserPlus,
    accent: 'bg-brand-100 text-brand-700 border border-brand-200',
    caption: 'past 24 hours',
  },
  {
    title: 'Akun tervalidasi',
    value: '92%',
    change: '+1,1%',
    trend: 'up',
    icon: ShieldCheck,
    accent: 'bg-brand-50 text-brand-700 border border-brand-200',
    caption: 'KYC & email',
  },
  {
    title: 'Moderation alerts',
    value: '47 tickets',
    change: '-12%',
    trend: 'down',
    icon: AlertCircle,
    accent: 'bg-brand-100 text-brand-700 border border-brand-200',
    caption: 'last 7 days',
  },
];

const cohortHighlights = [
  { label: 'Campus A students', retention: '86%', lift: '+9% vs average' },
  { label: 'Environmental volunteers', retention: '78%', lift: '+14% vs target' },
  { label: 'Public adoption program', retention: '63%', lift: '-5% needs follow-up' },
];

const supportLoad = [
  { channel: 'WhatsApp bot', open: 18, sla: '92% within 30m' },
  { channel: 'Email helpdesk', open: 42, sla: '88% within 2h' },
  { channel: 'Field PIC', open: 9, sla: '96% within 1h' },
];

const sentimentFeed = [
  {
    name: 'Anisa',
    role: 'Economics faculty PIC',
    status: 'Positive',
    summary: 'QR integration for practicum classes runs smoothly.',
    score: 4.7,
  },
  {
    name: 'Rikardo',
    role: 'Urban forest volunteer',
    status: 'Neutral',
    summary: 'Needs extra training for next week’s new volunteers.',
    score: 4.2,
  },
  {
    name: 'Shelly',
    role: 'Partner elementary teacher',
    status: 'Attention',
    summary: 'Some student accounts locked after device migration.',
    score: 3.5,
  },
];

const UsersTab = () => {
  return (
    <div className="space-y-6">

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {userMetrics.map(({ icon: Icon, ...metric }) => {
          const isTrendUp = metric.trend === 'up';
          const TrendIcon = isTrendUp ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={metric.title} variant="ghost">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={cn('rounded-xl p-3', metric.accent)}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
                  <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 pt-0">
                <span
                  className={cn(
                    'inline-flex items-center text-sm font-medium',
                    isTrendUp ? 'text-brand-700' : 'text-red-600'
                  )}
                >
                  <TrendIcon className="mr-1.5 h-4 w-4" />
                  {metric.change}
                </span>
                <p className="text-xs text-gray-500">{metric.caption}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card variant="ghost" className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Cohort highlights</CardTitle>
              <CardDescription>Key cohort retention and intervention needs.</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs text-brand-700">
              auto-sync cohort
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {cohortHighlights.map((cohort) => (
              <div
                key={cohort.label}
                className="rounded-lg border border-gray-200/80 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cohort.label}</p>
                    <p className="text-sm text-gray-500">{cohort.lift}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <ShieldCheck className="h-4 w-4" />
                    Retensi {cohort.retention}
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-brand-600"
                    style={{ width: cohort.retention }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardHeader>
            <CardTitle>Support load</CardTitle>
            <CardDescription>Support channel priorities and SLA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {supportLoad.map((item) => (
              <div key={item.channel} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{item.channel}</p>
                  <Badge variant="secondary" className="text-xs">
                    {item.open} open
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-gray-500">{item.sla}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card variant="ghost">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Onboarding alerts</CardTitle>
              <CardDescription>Registration steps that most often block users.</CardDescription>
            </div>
            <Badge variant="destructive">pantau</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Email confirmation', incidents: 34, impact: 'Form double submit' },
              { label: 'Campus verification', incidents: 18, impact: 'PIC approval pending' },
              { label: 'Initial password setup', incidents: 12, impact: 'Reset repeated >2x' },
            ].map((alert) => (
              <div key={alert.label} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{alert.label}</p>
                  <p className="text-xs text-gray-500">{alert.impact}</p>
                </div>
                <span className="text-sm font-semibold text-gray-800">{alert.incidents} reports</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="ghost">
          <CardHeader>
            <CardTitle>Field sentiment</CardTitle>
            <CardDescription>Latest feedback from PIC and volunteers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sentimentFeed.map((item) => (
              <div key={item.name} className="rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.role}</p>
                  </div>
                  <Badge
                    variant={
                      item.status === 'Positive'
                        ? 'success'
                        : item.status === 'Neutral'
                          ? 'info'
                          : 'destructive'
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-gray-600">{item.summary}</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-brand-700">
                  <Star className="h-4 w-4" />
                  Skor {item.score}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default UsersTab;
