import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, Loader2, MapPin, Phone, TriangleAlert, User, X } from 'lucide-react';
import { REPORT_STATUS_META, formatKerusakanLevel, formatReportCode, formatReportDate } from '../mapHelpers';
import type { LaporanRow, ReportRow, RoadRow } from '../types';
import type { RoadDetails } from '../hooks/useRoadDetails';

type DetailPanelProps = {
  show: boolean;
  activeRoad: RoadRow | null;
  roadDetails: RoadDetails;
  isRoadSelected: boolean;
  reports: ReportRow[];
  reportsLoading: boolean;
  reportsError: string | null;
  onClose: () => void;
  onClearHighlight: () => void;
  onSelectReport?: (report: ReportRow) => void;
  selectedReportId?: number | null;
  activeReport?: ReportRow | LaporanRow | null;
  onBackToReports?: () => void;
};

export const DetailPanel = ({
  show,
  activeRoad,
  roadDetails,
  isRoadSelected,
  reports,
  reportsLoading,
  reportsError,
  onClose,
  onClearHighlight,
  onSelectReport,
  selectedReportId,
  activeReport,
  onBackToReports,
}: DetailPanelProps) => {
  const {
    roadClassLabel,
    conditionLabel,
    refLabel,
    lengthLabel,
    widthLabel,
    constructionLabel,
    cityLabel,
    districtLabel,
    subDistrictLabel,
    neighbourhoodLabel,
    rtValue,
    rwValue,
    trafficBadgeLabel,
    onewayLabel,
    maxSpeedLabel,
  } = roadDetails;

  const detailPanelClass = show
    ? 'translate-x-0 pointer-events-auto'
    : '-translate-x-full pointer-events-none';

  return (
    <div
      className={`absolute p-0 top-0 left-0 z-30 w-sm h-full flex flex-col transform transition-all duration-300 ease-in-out ${detailPanelClass}`}
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto w-full shadow-lg">
        {show && activeRoad ? (
          <div className="flex flex-col overflow-y-auto flex-1 min-h-0 bg-white w-full p-4 space-y-4">
            <header className="flex items-start justify-between">
              <div className="space-y-1 w-full">
                <div className="flex justify-between">
                  <h2 className="font-medium text-gray-500 uppercase">
                    {refLabel}
                  </h2>
                  <button
                    className="text-gray-500 hover:text-gray-800 hover:border-gray-300 bg-gray-200 rounded-full p-1"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <h3 className="max-w-64 leading-6 text-lg font-medium text-gray-800">
                  {activeRoad.name ?? activeRoad.highway ?? '-'}
                </h3>
                {!activeReport && (
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className="text-gray-700 font-medium py-1 px-2 gap-2">
                      {roadClassLabel}
                    </Badge>
                    <Badge variant="outline" className="text-gray-700 font-medium py-1 px-2 gap-2 capitalize">
                      <span
                        className={`h-2 w-2 rounded-full inline-block ${
                          conditionLabel === 'good condition' ? 'bg-brand-500' 
                          : conditionLabel === 'minor damage' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                      {conditionLabel}
                    </Badge>
                  </div>
                )}
              </div>
            </header>

            {activeReport ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <button
                      type="button"
                      className="text-indigo-600 font-medium"
                      onClick={onBackToReports}
                    >
                      Kembali ke laporan
                    </button>
                    <span className="text-gray-300">|</span>
                    <span>Detail laporan</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      (REPORT_STATUS_META[(activeReport.status ?? 'pending').toLowerCase()] ??
                        REPORT_STATUS_META.default).className
                    }`}
                  >
                    {(REPORT_STATUS_META[(activeReport.status ?? 'pending').toLowerCase()] ??
                      REPORT_STATUS_META.default).label}
                  </Badge>
                </div>

                <Card className="shadow-none border border-gray-200 bg-geist-50">
                  <CardHeader className="flex flex-row items-center justify-between p-3 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 border border-red-300 bg-red-100 rounded-sm">
                        <TriangleAlert className="h-4 w-4 text-red-500" />
                      </span>
                      <CardTitle className="text-sm text-gray-800">
                        {formatReportCode(activeReport.id)}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-3 space-y-3 text-sm text-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Ruas terkait
                      </span>
                      <span className="font-medium">{activeReport.road_id ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Dibuat
                      </span>
                      <span className="font-medium">
                        {formatReportDate(activeReport.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Diperbarui
                      </span>
                      <span className="font-medium">
                        {formatReportDate(activeReport.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        User ID
                      </span>
                      <span className="font-medium">
                        {activeReport.user_id ?? 'Tidak diketahui'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        Kontak pelapor
                      </span>
                      <span className="font-medium">
                        {activeReport.kontak_pelapor || 'Tidak tersedia'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Level kerusakan</span>
                      <span className="font-medium capitalize">
                        {formatKerusakanLevel(activeReport.kerusakan_level)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Lokasi laporan
                  </div>
                  <div className="rounded-md border border-gray-200 bg-geist-50 px-3 py-2 text-sm text-gray-800">
                    {Number.isFinite(activeReport.latitude) && Number.isFinite(activeReport.longitude)
                      ? `${Number(activeReport.latitude).toFixed(5)}, ${Number(activeReport.longitude).toFixed(5)}`
                      : 'Tidak tersedia'}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Deskripsi</p>
                  <p className="rounded-md border border-gray-200 bg-geist-50 px-3 py-3 text-sm text-gray-800 leading-relaxed">
                    {activeReport.deskripsi?.trim() || 'Tidak ada deskripsi tambahan.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col my-3 space-y-2">
                  <div className="flex flex-row rounded-md border border-gray-200 p-4">
                    <div className="flex text-center gap-1 flex-col w-full">
                      <span className="text-sm text-gray-500 font-medium">Length</span>
                      <span className="text-sm text-gray-800 font-medium">{lengthLabel}</span>
                    </div>
                    <div className="flex text-center gap-1 flex-col w-full">
                      <span className="text-sm text-gray-500 font-medium">Width</span>
                      <span className="text-sm text-gray-800 font-medium">{widthLabel}</span>
                    </div>
                    <div className="flex text-center gap-1 flex-col w-full">
                      <span className="text-sm text-gray-500 font-medium">Surface</span>
                      <span className="text-sm text-gray-800 font-medium">{constructionLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col rounded-md border border-gray-200 gap-3 p-4">
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">Kota</span>
                      <span className="text-sm font-medium text-gray-800 capitalize">{cityLabel}</span>
                    </div>
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">Kecamatan</span>
                      <span className="text-sm font-medium text-gray-800 capitalize">{districtLabel}</span>
                    </div>
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">Kelurahan</span>
                      <span className="text-sm font-medium text-gray-800 capitalize">{subDistrictLabel}</span>
                    </div>
                    {/* <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">Lingkungan</span>
                      <span className="text-sm font-medium text-gray-800 capitalize">{neighbourhoodLabel}</span>
                    </div> */}
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">RT/RW</span>
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {rtValue} / {rwValue}
                      </span>
                    </div>
                    {/* <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">Arus</span>
                      <span className="text-sm font-medium text-gray-800 text-right capitalize">
                        {trafficBadgeLabel}
                      </span>
                    </div>
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">Arah jalan</span>
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {onewayLabel}
                      </span>
                    </div>
                    <div className="flex items-center w-full justify-between">
                      <span className="text-sm font-medium text-gray-500">Kecepatan maks</span>
                      <span className="text-sm font-medium text-gray-800">
                        {maxSpeedLabel}
                      </span>
                    </div> */}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-400 font-medium">ACTIVE REPORTS</h3>
                  <div className="mt-2 overflow-x-auto">
                    {!isRoadSelected ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Pilih jalan untuk melihat laporan aktif.
                      </div>
                    ) : reportsLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        Memuat laporan aktif untuk ruas ini...
                      </div>
                    ) : reportsError ? (
                      <div className="px-3 py-2 text-sm text-red-600">
                        {reportsError}
                      </div>
                    ) : reports.length === 0 ? (
                      <div className="px-3 py-2 border border-dashed border-gray-200 rounded-md text-sm text-gray-500">
                        <span>Belum ada laporan aktif untuk ruas ini.</span>
                      </div>
                    ) : (
                      <div className="flex flex-row gap-2 snap-x snap-mandatory">
                        {reports.map((report) => {
                          const statusKey = (report.status ?? 'pending').toLowerCase();
                          const statusMeta =
                            REPORT_STATUS_META[statusKey] ?? REPORT_STATUS_META.default;
                          const reporter =
                            report.kontak_pelapor ||
                            (report.user_id ? `User-${report.user_id}` : '-');
                          const isSelected = selectedReportId === report.id;

                          if (reports.length === 1) {
                            return (
                              <Card
                                key={report.id}
                                className={`flex flex-col w-full bg-geist-50 shadow-none snap-start border ${isSelected ? 'border-indigo-200 ring-2 ring-indigo-100' : 'border-gray-200'} ${onSelectReport ? 'cursor-pointer hover:border-indigo-300' : ''}`}
                                onClick={() => onSelectReport?.(report)}
                              >
                                <CardHeader className="flex flex-row items-center justify-between p-3 gap-3">
                                  <div className="flex flex-row items-center gap-2">
                                    <span className="p-1 border border-red-300 bg-red-100 rounded-sm">
                                      <TriangleAlert className="h-4 w-4 text-red-500" />
                                    </span>
                                    <CardTitle className="text-sm text-gray-800">
                                      {formatReportCode(report.id)}
                                    </CardTitle>
                                  </div>
                                  <Badge variant="outline" className={`py-1 px-2 text-xs font-medium ${statusMeta.className}`}>
                                    {statusMeta.label}
                                  </Badge>
                                </CardHeader>
                                <Separator />
                                <CardContent className="p-3 space-y-3">
                                  <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Pelapor</span>
                                      <span className="text-sm font-medium text-gray-800 truncate max-w-[120px] text-right">
                                        {reporter}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Level kerusakan</span>
                                      <div className="flex items-center gap-2 font-medium text-gray-800 capitalize">
                                        {formatKerusakanLevel(report.kerusakan_level)}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Status</span>
                                      <span className="text-sm font-medium text-gray-800 capitalize">
                                        {statusMeta.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-500">Tanggal laporan</span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {formatReportDate(report.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="px-3 pb-3 pt-0">
                                  <p className="text-xs text-gray-500">
                                    {report.deskripsi || 'Tidak ada deskripsi tambahan.'}
                                  </p>
                                </CardFooter>
                              </Card>
                            );
                          }

                          return (
                            <Card
                              key={report.id}
                              className={`min-w-xs bg-geist-50 shadow-none snap-start border ${isSelected ? 'border-indigo-200 ring-2 ring-indigo-100' : 'border-gray-200'} ${onSelectReport ? 'cursor-pointer hover:border-indigo-300' : ''}`}
                              onClick={() => onSelectReport?.(report)}
                            >
                              <CardHeader className="flex flex-row items-center justify-between p-3 gap-3">
                                <div className="flex flex-row items-center gap-2">
                                  <span className="p-1 border border-red-300 bg-red-100 rounded-sm">
                                    <TriangleAlert className="h-4 w-4 text-red-500" />
                                  </span>
                                  <CardTitle className="text-sm text-gray-800">
                                    {formatReportCode(report.id)}
                                  </CardTitle>
                                </div>
                                <Badge variant="outline" className={`py-1 px-2 text-xs font-medium ${statusMeta.className}`}>
                                  {statusMeta.label}
                                </Badge>
                              </CardHeader>
                              <Separator />
                              <CardContent className="p-3 space-y-3">
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Pelapor</span>
                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[120px] text-right">
                                      {reporter}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Level kerusakan</span>
                                    <div className="flex items-center gap-2 font-medium text-gray-800 capitalize">
                                      {formatKerusakanLevel(report.kerusakan_level)}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span className="text-sm font-medium text-gray-800 capitalize">
                                      {statusMeta.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Tanggal laporan</span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {formatReportDate(report.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter className="px-3 pb-3 pt-0">
                                <p className="text-xs text-gray-500">
                                  {report.deskripsi || 'Tidak ada deskripsi tambahan.'}
                                </p>
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row gap-2">
                  <div className="w-full">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={onClearHighlight}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-white border border-dashed border-gray-200 rounded-md h-full min-h-[200px] text-gray-500 text-sm">
            Pilih jalan untuk melihat detail.
          </div>
        )}
      </div>
    </div>
  );
};
