import { useMemo } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import LogoutButton from '@features/user/components/LogoutButton';
import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { useReportHistory } from '@features/user/hooks/useReportHistory';
import {
  REPORT_STATUS_META,
  formatKerusakanLevel,
  formatReportCode,
  formatReportDate,
} from '@features/admin/pages/maps/mapHelpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ReportHistory = () => {
  const { user } = useAuthUser();
  const { reports, loading, error, reload } = useReportHistory(user?.id);

  const rows = useMemo(
    () =>
      reports.map((report) => {
        const statusKey = (report.status ?? 'pending').toLowerCase();
        const statusMeta = REPORT_STATUS_META[statusKey] ?? REPORT_STATUS_META.default;
        const location =
          [report.road?.kelurahan, report.road?.kecamatan, report.road?.kota].filter(Boolean).join(', ') ||
          'Lokasi belum tercatat';

        return {
          id: report.id,
          code: formatReportCode(report.id),
          severity: formatKerusakanLevel(report.severity) ?? 'Kerusakan',
          statusLabel: statusMeta.label,
          statusClass: statusMeta.className,
          location,
          createdAt: formatReportDate(report.createdAt),
          contact: report.contact || 'Tidak ada kontak',
          description: report.description?.trim() || 'Tidak ada catatan tambahan.',
        };
      }),
    [reports]
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Riwayat laporan</p>
            <h1 className="text-3xl font-semibold text-gray-900">Laporan Anda</h1>
            <p className="text-sm text-gray-600">Daftar seluruh laporan jalan yang pernah dikirim.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
            <Button asChild size="sm" className="flex-1 sm:flex-none">
              <Link to="/reports/new">
                <Plus className="mr-2 h-4 w-4" />
                Buat laporan
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => reload()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memuat...' : 'Segarkan'}
            </Button>
            <LogoutButton className="flex-1 sm:flex-none" />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Kode</TableHead>
                  <TableHead className="whitespace-nowrap">Kerusakan</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Lokasi</TableHead>
                  <TableHead className="whitespace-nowrap">Dibuat</TableHead>
                  <TableHead className="whitespace-nowrap">Kontak</TableHead>
                  <TableHead className="whitespace-nowrap">Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-600">
                      Memuat riwayat laporan...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-600">
                      Belum ada laporan tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((report) => (
                    <TableRow key={report.id} className="align-top">
                      <TableCell className="font-semibold text-gray-900">{report.code}</TableCell>
                      <TableCell className="text-sm text-gray-800">{report.severity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-medium ${report.statusClass}`}>
                          {report.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[180px] text-sm text-gray-700">{report.location}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-700 tabular-nums">
                        {report.createdAt}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{report.contact}</TableCell>
                      <TableCell className="min-w-[240px] text-sm text-gray-700">{report.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHistory;
