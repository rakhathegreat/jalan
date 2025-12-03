import { TrendingUp } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/card';
import type { DashboardMetrics } from '../hooks/useDashboardData';

type SectionCardsProps = {
  metrics: DashboardMetrics;
  loading?: boolean;
};

const numberFormatter = new Intl.NumberFormat('id-ID');

const formatValue = (value: number, loading?: boolean) =>
  loading ? '...' : numberFormatter.format(value);

export function SectionCards({ metrics, loading }: SectionCardsProps) {
  const cards = [
    {
      title: 'Total Laporan Masuk',
      value: formatValue(metrics.totalReports, loading),
      helper: 'Semua laporan kerusakan yang tersimpan',
      footnote: 'Sinkron dengan Supabase',
    },
    {
      title: 'Laporan Aktif',
      value: formatValue(metrics.activeReports, loading),
      helper: 'Status pending & in progress',
      footnote: `${loading ? '...' : metrics.heavyReports} kerusakan berat terdeteksi`,
    },
    {
      title: 'Laporan Selesai',
      value: formatValue(metrics.resolvedReports, loading),
      helper: 'Sudah ditandai selesai',
      footnote: 'Memperbarui status secara real-time',
    },
    {
      title: 'Ruas Jalan Terdata',
      value: formatValue(metrics.roads, loading),
      helper: 'Segment jalan di basis data',
      footnote: 'Terhubung dengan layer peta & data',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} data-slot="card" className="@container/card flex h-full flex-col">
          <CardContent>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
            </CardHeader>
            <div className="mt-auto flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.helper} <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground">{card.footnote}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
