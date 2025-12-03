import { useMemo } from 'react';
import { AlertTriangle, Clock3, MapPin, PlusCircle, Scan } from 'lucide-react';
import { Link } from 'react-router-dom';

import BottomNav from '@features/user/components/BottomNav';
import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { useReportHistory } from '@features/user/hooks/useReportHistory';
import { useScanStats } from '@features/user/hooks/useScanStats';
import { formatKerusakanLevel, formatReportCode, formatReportDate, REPORT_STATUS_META } from '@features/admin/pages/maps/mapHelpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ReportPreview = ({
  id,
  status,
  severity,
  createdAt,
  description,
  location,
}: {
  id: number;
  status: string | null;
  severity: string | null;
  createdAt: string | null;
  description: string | null;
  location: string;
}) => {
  const normalized = (status ?? 'pending').toLowerCase();
  const meta = REPORT_STATUS_META[normalized] ?? REPORT_STATUS_META.default;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{formatReportCode(id)}</p>
          <p className="text-base font-semibold text-gray-900">{formatKerusakanLevel(severity)}</p>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{description || 'Tanpa catatan tambahan.'}</p>
        </div>
        <Badge variant="outline" className={meta.className}>
          {meta.label}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {formatReportDate(createdAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </span>
      </div>
    </div>
  );
};

const Main = () => {
  const { user } = useAuthUser();
  const { totalCount: scanCount, loading: scansLoading } = useScanStats(user?.id);
  const { reports } = useReportHistory(user?.id, { limit: 3 });

  const displayName = useMemo(
    () =>
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.user_metadata?.display_name ??
      user?.email ??
      'Explorer',
    [user]
  );

  const firstName = useMemo(() => displayName.split(' ')[0] || 'Explorer', [displayName]);
  const locationLabel = useMemo(
    () =>
      reports[0]
        ? [reports[0].road?.kelurahan, reports[0].road?.kecamatan, reports[0].road?.kota]
            .filter(Boolean)
            .join(', ') || 'Lokasi belum tercatat'
        : 'Belum ada laporan',
    [reports]
  );

  return (
    <div className="min-h-screen bg-brand-50 pb-24">
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 px-5 pb-14 pt-12 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Selamat datang,</p>
            <h1 className="text-2xl font-semibold tracking-tight">{firstName}</h1>
          </div>
          <Badge className="bg-white/15 text-white">Mobile</Badge>
        </div>
        <p className="mt-3 text-sm text-white/80">Laporkan kondisi jalan di sekitar Anda dan pantau progresnya.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/80">Scan pohon</p>
            <p className="mt-1 text-2xl font-semibold">{scansLoading ? '...' : scanCount ?? 0}</p>
            <span className="text-xs text-white/80">total scan</span>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-white/80">Lokasi aktif</p>
            <p className="mt-1 text-sm font-semibold leading-tight">{locationLabel}</p>
            <span className="text-xs text-white/80">berdasar laporan terbaru</span>
          </div>
        </div>
      </div>

      <main className="-mt-8 space-y-5 px-4">
        <div className="grid gap-3">
          <Link
            to="/reports/new"
            className="group flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Buat laporan jalan</p>
              <p className="text-xs text-gray-600">Foto kondisi, isi detail kerusakan, dan kirim.</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-brand-700 opacity-70 transition group-hover:scale-110" />
          </Link>

          <Link
            to="/reports/history"
            className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Riwayat laporan</p>
              <p className="text-xs text-gray-600">Pantau status dan tindak lanjut dari tim.</p>
            </div>
            <Scan className="h-4 w-4 text-gray-500 opacity-70 transition group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Laporan terbaru</p>
              <h2 className="text-lg font-semibold text-gray-900">Ringkasan cepat</h2>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/reports/history">Lihat semua</Link>
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-gray-600">Belum ada laporan. Yuk kirim laporan pertama Anda.</p>
            ) : (
              reports.map((report) => {
                const location = [report.road?.kelurahan, report.road?.kecamatan, report.road?.kota]
                  .filter(Boolean)
                  .join(', ') || 'Lokasi belum tercatat';
                return (
                  <ReportPreview
                    key={report.id}
                    id={report.id}
                    status={report.status}
                    severity={report.severity}
                    createdAt={report.createdAt}
                    description={report.description}
                    location={location}
                  />
                );
              })
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Main;
