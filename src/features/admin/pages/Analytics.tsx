import { useMemo, useState } from 'react';
import { cn } from '@shared/lib/cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/Card';

import OverviewTab from '../tabs/OverviewTab';
import useAnalyticsData, { type AnalyticsDataState } from './analytics/hooks/useAnalyticsData';

const numberFormatter = new Intl.NumberFormat('id-ID');

const formatValue = (value: number, loading: boolean) => (loading ? '...' : numberFormatter.format(value));

type SimpleMetricsProps = {
  data: AnalyticsDataState;
  items: Array<{ title: string; value: number; helper?: string }>;
};

const SimpleMetrics = ({ data, items }: SimpleMetricsProps) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <Card key={item.title} className="h-full bg-transparent" variant="ghost">
        <CardContent className="flex h-full flex-col justify-between space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">{item.title}</p>
            {item.helper && <p className="text-xs text-gray-500">{item.helper}</p>}
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {formatValue(item.value, data.loading)}
          </p>
        </CardContent>
      </Card>
    ))}
  </div>
);

const UsersTab = ({ data }: { data: AnalyticsDataState }) => (
  <div className="space-y-4">
    <SimpleMetrics
      data={data}
      items={[
        { title: 'Total laporan', value: data.summary.totalReports, helper: 'Semua laporan di Supabase' },
        { title: 'Laporan aktif', value: data.summary.activeReports, helper: 'Pending & in progress' },
        { title: 'Selesai', value: data.summary.resolvedReports, helper: 'Status ditandai selesai' },
        { title: 'Aktivitas scan', value: data.summary.scans, helper: 'Total rekaman scan' },
      ]}
    />
    <Card variant="ghost" className="bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Alur pengguna</CardTitle>
        <CardDescription>Pelapor & pemindai mengikuti data Supabase.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-gray-700">
        Tambahkan tabel user untuk melihat akun aktif, frekuensi laporan, dan distribusi scan per pengguna.
      </CardContent>
    </Card>
  </div>
);

const TreesTab = ({ data }: { data: AnalyticsDataState }) => (
  <div className="space-y-4">
    <SimpleMetrics
      data={data}
      items={[
        { title: 'Ruas jalan terdata', value: data.summary.roads, helper: 'Sinkron dengan layer peta' },
        { title: 'Laporan jalan', value: data.summary.totalReports, helper: 'Semua status' },
        { title: 'Laporan selesai', value: data.summary.resolvedReports, helper: 'Status done' },
      ]}
    />
    <Card variant="ghost" className="bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Detail data pohon</CardTitle>
        <CardDescription>Sinkron dengan ruas jalan dan laporan.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-gray-700">
        Hubungkan tabel pohon untuk menampilkan statistik pohon per ruas, jenis, dan kota. Gunakan data laporan untuk prioritas perawatan.
      </CardContent>
    </Card>
  </div>
);

const ScansTab = ({ data }: { data: AnalyticsDataState }) => {
  const scanChange = useMemo(() => {
    const prev = data.summary.scansPrev30 || 0;
    if (prev === 0) return data.summary.scansLast30 > 0 ? 100 : 0;
    return Math.round(((data.summary.scansLast30 - prev) / prev) * 100);
  }, [data.summary.scansLast30, data.summary.scansPrev30]);

  return (
    <div className="space-y-4">
      <SimpleMetrics
        data={data}
        items={[
          { title: 'Scan 30 hari', value: data.summary.scansLast30, helper: 'Aktivitas terakhir' },
          { title: 'Scan 30 hari sebelumnya', value: data.summary.scansPrev30 },
          { title: 'Total scan', value: data.summary.scans },
        ]}
      />
      <Card variant="ghost" className="bg-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Perubahan periode</CardTitle>
          <CardDescription>Perbandingan 30 hari terakhir.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          {data.loading ? 'Menghitung...' : `${scanChange >= 0 ? '+' : ''}${scanChange}% dibanding 30 hari sebelumnya.`}
        </CardContent>
      </Card>
      <Card variant="ghost" className="bg-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Peta aktivitas scan</CardTitle>
          <CardDescription>Siapkan visual lokasi scan.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          Gunakan tabel <code className="rounded bg-gray-100 px-1">scan</code> untuk distribusi pengguna dan lokasi. Sinkronkan ke peta untuk melihat hotspot.
        </CardContent>
      </Card>
    </div>
  );
};

const GeospatialTab = ({ data }: { data: AnalyticsDataState }) => (
  <div className="space-y-4">
    <SimpleMetrics
      data={data}
      items={[
        { title: 'Wilayah terpantau', value: data.regionOrder.length, helper: 'Berdasar kota pada laporan' },
        { title: 'Total laporan', value: data.summary.totalReports },
      ]}
    />
    <Card variant="ghost" className="bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Wilayah dengan laporan terbanyak</CardTitle>
        <CardDescription>Top kota berdasarkan laporan & penyelesaian.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.loading ? (
          <p className="text-xs text-gray-600">Memuat...</p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-700">
            {data.regionLeaders.slice(0, 5).map((region) => (
              <li key={region.name} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span>{region.name}</span>
                <span className="text-right text-gray-900">
                  {numberFormatter.format(region.total)} laporan · {region.completion}%
                </span>
              </li>
            ))}
            {!data.regionLeaders.length && <li className="text-xs text-gray-600">Belum ada data wilayah.</li>}
          </ul>
        )}
      </CardContent>
    </Card>
    <Card variant="ghost" className="bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Integrasi peta</CardTitle>
        <CardDescription>Gunakan data Supabase di layer peta.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-gray-700">
        Sinkronkan koordinat laporan ke peta untuk menyorot ruas jalan prioritas dan progres perbaikan.
      </CardContent>
    </Card>
  </div>
);

type ReportTab =
  | 'overview'
  | 'users'
  | 'trees'
  | 'scans'
  | 'geospatial'

const NAVBAR_HEIGHT = 70;

const tabOrder: ReportTab[] = [
  'overview',
  'users',
  'trees',
  'scans',
  'geospatial',
];

const tabLabels: Record<ReportTab, string> = {
  overview: 'Ringkasan',
  users: 'Pengguna',
  trees: 'Data pohon',
  scans: 'Scan',
  geospatial: 'Geospasial',
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const analyticsData = useAnalyticsData();

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={analyticsData} />;
      case 'users':
        return <UsersTab data={analyticsData} />;
      case 'trees':
        return <TreesTab data={analyticsData} />;
      case 'scans':
        return <ScansTab data={analyticsData} />;
      case 'geospatial':
        return <GeospatialTab data={analyticsData} />;
      default:
        return null;
    }
  }, [activeTab, analyticsData]);

  return (
    <div className="bg-geist-50" style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}>
      <div className="relative mx-auto w-full space-y-6">
        <header className="m-0 border-b border-gray-300">
          <div className="mx-auto flex px-6 lg:px-0 max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 py-7 md:py-10">
              <h1 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">Analytics Jalan</h1>
              <p className="text-sm text-gray-600">Pantau laporan lapangan, aktivitas scan, dan performa wilayah yang terhubung langsung ke Supabase.</p>
            </div>
          </div>
        </header>

        <section
          style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
          className="sticky top-0 z-20"
        >
          <div className="grid h-full grid-cols-4 ">
            <div className="sticky col-span-4 top-16 z-20 bg-geist-50 sm:hidden">
              <div className="flex flex-nowrap overflow-x-auto border-b border-gray-300 no-scrollbar">
                {tabOrder.map((tabKey) => {
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={cn(
                        'flex flex-none items-center px-4 py-3 text-left text-sm capitalize font-medium whitespace-nowrap border-b-2 transition',
                        isActive
                          ? 'border-brand-600 text-brand-700'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      )}
                    >
                      <span>{tabLabels[tabKey]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden sm:flex h-full flex-col overflow-y-auto border-r border-gray-300">

              <div className='border-b border-gray-300 px-8 py-4'>
                <h2 className="text-lg font-semibold text-gray-800">
                  Tabs
                </h2>
              </div>

              <div className=" overflow-y-auto px-4 py-3">
                {tabOrder.map((tabKey) => {
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveTab(tabKey)}
                      className={cn(
                        'flex w-full items-center rounded-md px-4 py-3 text-left transition capitalize font-medium',
                        isActive
                          ? 'border-brand-600 text-brand-700 bg-brand-100'
                          : 'border-transparent text-gray-500 hover:text-gray-800',
                      )}
                    >
                      <div className="space-y-1">
                        <p className="text-xs">{tabLabels[tabKey]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="col-span-4 sm:col-span-3 h-full sm:overflow-y-auto bg-geist-50 px-6 py-8">
              <div className="flex flex-wrap flex-col gap-4 pb-6">
                <div className=''>
                  <h2 className="text-2xl font-medium capitalize text-gray-900">{tabLabels[activeTab]}</h2>
                </div>
                <div>
                  {tabContent}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
