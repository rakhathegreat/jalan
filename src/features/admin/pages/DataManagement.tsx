import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MapPin, TriangleAlert, ChevronLeft, ChevronRight, Route, EllipsisVertical } from 'lucide-react';
import Input from '@shared/components/Input';
import { cn } from '@shared/lib/cn';
import { supabase } from '@shared/services/supabase';
import {
  formatDistance,
  formatKerusakanLevel,
  formatReportCode,
  formatReportDate,
  getRoadPrimaryLabel,
  getRoadSecondaryLabel,
  REPORT_STATUS_META,
} from './maps/mapHelpers';
import { MAP_FOCUS_STORAGE_KEY } from './maps/mapFocus';
import type { RoadRow, ReportRow } from './maps/types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';

const limitOptions = [10, 20, 50, 100];

type TableView = 'roads' | 'reports';

const tableViewOptions: Array<{ value: TableView; label: string; description: string }> = [
  {
    value: 'roads',
    label: 'Roads',
    description: 'Data ruas jalan yang tersedia',
  },
  {
    value: 'reports',
    label: 'Reports',
    description: 'Laporan kerusakan jalan dari pengguna',
  },
];

const formatWidth = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return '-';
  return `${parsed.toFixed(1)} m`;
};

const buildLocationLabel = (road: RoadRow) => {
  const parts = [road.kelurahan, road.kecamatan, road.kota].filter(Boolean);
  return parts.length ? parts.join(', ') : '-';
};

const formatCoordinate = (
  latitude: number | null | undefined,
  longitude: number | null | undefined
) => {
  const latNum = latitude === null || latitude === undefined ? null : Number(latitude);
  const lngNum = longitude === null || longitude === undefined ? null : Number(longitude);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return 'Tidak tersedia';
  return `${latNum?.toFixed(5)}, ${lngNum?.toFixed(5)}`;
};

const formatLatLngValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  return num.toFixed(7);
};

type RoadEditForm = {
  name: string;
  highway: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  lingkungan: string;
  rt: string;
  rw: string;
  tipe_jalan: string;
  condition: string;
  status: string;
  length: string;
  width: string;
};

const emptyRoadForm: RoadEditForm = {
  name: '',
  highway: '',
  kota: '',
  kecamatan: '',
  kelurahan: '',
  lingkungan: '',
  rt: '',
  rw: '',
  tipe_jalan: '',
  condition: '',
  status: '',
  length: '',
  width: '',
};

const DataManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tableView, setTableView] = useState<TableView>('roads');
  const [roads, setRoads] = useState<RoadRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedRoadIds, setSelectedRoadIds] = useState<Set<string>>(new Set());
  const [selectedReportIds, setSelectedReportIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(limitOptions[0]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: TableView; ids: Array<string | number> } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoadRow | null>(null);
  const [editForm, setEditForm] = useState<RoadEditForm>(emptyRoadForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [pendingEditRoadId, setPendingEditRoadId] = useState<string | null>(null);
  const [markingReportId, setMarkingReportId] = useState<number | null>(null);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [perPage, total]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    try {
      if (tableView === 'roads') {
        let query = supabase
          .from('roads')
          .select(
            'id, geom, highway, name, props, kota, kecamatan, kelurahan, tipe_jalan, lingkungan, rt, rw, condition, status, length, width, osm_id',
            { count: 'exact' }
          );

        if (debouncedSearch) {
          const term = debouncedSearch.replace(/[,]/g, ' ');
          query = query.or(`name.ilike.%${term}%,highway.ilike.%${term}%`);
        }

        query = query.order('name', { ascending: true }).range(from, to);
        const { data, error, count } = await query;
        if (error) {
          console.error('Failed to fetch roads', error.message);
          setRoads([]);
          setTotal(0);
          return;
        }

        setRoads((data ?? []) as RoadRow[]);
        setReports([]);
        setTotal(count ?? 0);
        return;
      }

      let query = supabase
        .from('reports')
        .select(
          'id, user_id, kerusakan_level, deskripsi, status, kontak_pelapor, created_at, updated_at, road_id, road:roads(name), latitude, longitude',
          { count: 'exact' }
        );

      if (debouncedSearch) {
        const term = debouncedSearch.replace(/[,]/g, ' ');
        query = query.or(
          `deskripsi.ilike.%${term}%,status.ilike.%${term}%,kontak_pelapor.ilike.%${term}%`
        );
      }

      query = query.order('created_at', { ascending: false }).range(from, to);
      const { data, error, count } = await query;

      if (error) {
        console.error('Failed to fetch reports', error.message);
        setReports([]);
        setTotal(0);
        return;
      }

      const normalizedReports = (data ?? []).map((report) => ({
        ...report,
        latitude: report.latitude === null ? null : Number(report.latitude),
        longitude: report.longitude === null ? null : Number(report.longitude),
        road_name: (report as any).road?.name ?? null,
      })) as unknown as ReportRow[];

      setReports(normalizedReports);
      setRoads([]);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, perPage, tableView]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [tableView, debouncedSearch, perPage]);

  useEffect(() => {
    setSelectedRoadIds(new Set());
    setSelectedReportIds(new Set());
  }, [tableView]);

  useEffect(() => {
    if (total === 0 && page !== 1) {
      setPage(1);
      return;
    }
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount, total]);

  useEffect(() => {
    setSelectedRoadIds((prev) => {
      const allowed = new Set(roads.map((road) => road.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      return next;
    });
  }, [roads]);

  useEffect(() => {
    setSelectedReportIds((prev) => {
      const allowed = new Set(reports.map((report) => report.id));
      const next = new Set<number>();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      return next;
    });
  }, [reports]);

  useEffect(() => {
    const state = location.state as { editRoadId?: string | number } | null;
    if (state?.editRoadId) {
      setPendingEditRoadId(String(state.editRoadId));
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const summaryLabel = tableView === 'roads' ? 'roads' : 'reports';
  const deleteCount = deleteTarget?.ids.length ?? 0;
  const deleteLabel = deleteTarget?.type === 'roads' ? 'jalan' : 'laporan';
  const deleteTitle = deleteCount > 0 ? `Hapus ${deleteCount} ${deleteLabel ?? 'data'}?` : 'Hapus data?';
  const deleteItems = useMemo(() => {
    if (!deleteTarget) return [];
    if (deleteTarget.type === 'roads') {
      const idSet = new Set(deleteTarget.ids.map(String));
      return roads
        .filter((road) => idSet.has(String(road.id)))
        .map((road) => ({
          id: road.id,
          primary: getRoadPrimaryLabel(road),
          secondary: getRoadSecondaryLabel(road),
          badge: 'Road',
        }));
    }
    const idSet = new Set(deleteTarget.ids.map(Number));
    return reports
      .filter((report) => idSet.has(Number(report.id)))
      .map((report) => ({
        id: report.id,
        primary: formatReportCode(report.id),
        secondary: `Road: ${report.road_name ?? report.road_id ?? '-'}`,
        badge: 'Report',
      }));
  }, [deleteTarget, reports, roads]);
  const pageNumbers = useMemo(() => {
    if (pageCount <= 10) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(pageCount - 9, page - 4));
    return Array.from({ length: 10 }, (_, i) => start + i);
  }, [page, pageCount]);

  const toggleRoadSelection = (id: string) =>
    setSelectedRoadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const toggleReportSelection = (id: number) =>
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const allRoadsSelected = roads.length > 0 && roads.every((road) => selectedRoadIds.has(road.id));
  const allReportsSelected =
    reports.length > 0 && reports.every((report) => selectedReportIds.has(report.id));

  const toggleSelectAllRoads = () => {
    if (allRoadsSelected) {
      setSelectedRoadIds(new Set());
      return;
    }
    const next = new Set<string>();
    roads.forEach((road) => next.add(road.id));
    setSelectedRoadIds(next);
  };

  const toggleSelectAllReports = () => {
    if (allReportsSelected) {
      setSelectedReportIds(new Set());
      return;
    }
    const next = new Set<number>();
    reports.forEach((report) => next.add(report.id));
    setSelectedReportIds(next);
  };

  const removeSelections = (type: TableView, ids: Array<string | number>) => {
    if (type === 'roads') {
      setSelectedRoadIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(String(id)));
        return next;
      });
      return;
    }
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(Number(id)));
      return next;
    });
  };

  const handleDelete = async (type: TableView, ids: Array<string | number>) => {
    if (!ids.length) return false;

    const targetTable = type === 'roads' ? 'roads' : 'reports';
    const parsedIds = type === 'roads' ? ids.map(String) : ids.map(Number);
    const { error } = await supabase.from(targetTable).delete().in('id', parsedIds);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return false;
    }
    removeSelections(type, ids);
    fetchData();
    return true;
  };

  const requestDelete = (type: TableView, ids: Array<string | number>) => {
    if (!ids.length) return;
    setDeleteTarget({ type, ids });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await handleDelete(deleteTarget.type, deleteTarget.ids);
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const handleViewOnMap = (type: TableView, id: string | number) => {
    if (typeof window === 'undefined') return;
    const payload =
      type === 'roads'
        ? { type, roadId: String(id) }
        : { type, reportId: Number(id) };
    try {
      window.localStorage.setItem(
        MAP_FOCUS_STORAGE_KEY,
        JSON.stringify({ ...payload, ts: Date.now() })
      );
    } catch (err) {
      console.warn('Failed to persist map focus', err);
    }
    navigate('/admin/maps');
  };

  const handleEdit = useCallback(
    (type: TableView, id: string | number) => {
      if (type !== 'roads') {
        alert(`Edit untuk report ${id} belum tersedia.`);
        return;
      }
      const target = roads.find((road) => String(road.id) === String(id));
      if (!target) {
        alert('Data jalan tidak ditemukan.');
        return;
      }
      setEditTarget(target);
      setEditForm({
        name: target.name ?? '',
        highway: target.highway ?? '',
        kota: target.kota ?? '',
        kecamatan: target.kecamatan ?? '',
        kelurahan: target.kelurahan ?? '',
        lingkungan: target.lingkungan ?? '',
        rt: target.rt === null || target.rt === undefined ? '' : String(target.rt),
        rw: target.rw === null || target.rw === undefined ? '' : String(target.rw),
        tipe_jalan: target.tipe_jalan ?? '',
        condition: target.condition ?? '',
        status: target.status ?? '',
        length: target.length === null || target.length === undefined ? '' : String(target.length),
        width: target.width === null || target.width === undefined ? '' : String(target.width),
      });
      setEditError(null);
      setEditDialogOpen(true);
    },
    [roads]
  );

  useEffect(() => {
    if (!pendingEditRoadId || tableView !== 'roads') return;
    if (!roads.length) return;

    handleEdit('roads', pendingEditRoadId);
    setPendingEditRoadId(null);
  }, [handleEdit, pendingEditRoadId, roads, tableView]);

  const handleBulkExport = () => {
    const selectedRoads = roads.filter((road) => selectedRoadIds.has(road.id));
    const selectedReports = reports.filter((report) => selectedReportIds.has(report.id));

    if (tableView === 'roads' && selectedRoads.length === 0) {
      alert('Pilih data terlebih dahulu untuk diekspor.');
      return;
    }

    if (tableView === 'reports' && selectedReports.length === 0) {
      alert('Pilih data terlebih dahulu untuk diekspor.');
      return;
    }

    const csvRows: string[] = [];
    if (tableView === 'roads') {
      const headers = [
        'Name',
        'Kota',
        'Kecamatan',
        'Kelurahan',
        'Lingkungan',
        'RT',
        'RW',
        'Tipe Jalan',
        'Condition',
        'Status',
        'Length',
        'Width',
      ];
      csvRows.push(headers.join(','));
      selectedRoads.forEach((road) => {
        const row = [
          road.name ?? '',
          road.kota ?? '',
          road.kecamatan ?? '',
          road.kelurahan ?? '',
          road.lingkungan ?? '',
          road.rt ?? '',
          road.rw ?? '',
          road.tipe_jalan ?? '',
          renderRoadCondition(road.condition),
          road.status ?? '',
          road.length ?? '',
          road.width ?? '',
        ]
          .map((value) => {
            const str = String(value ?? '');
            if (str.includes(',') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',');
        csvRows.push(row);
      });
    } else {
      const headers = [
        'Road',
        'Kerusakan',
        'Status',
        'Latitude',
        'Longitude',
        'Created At',
        'Updated At',
      ];
      csvRows.push(headers.join(','));
      selectedReports.forEach((report) => {
        const row = [
          report.road_id ?? '',
          formatKerusakanLevel(report.kerusakan_level),
          report.status ?? '',
          report.latitude ?? '',
          report.longitude ?? '',
          report.created_at ?? '',
          report.updated_at ?? '',
        ]
          .map((value) => {
            const str = String(value ?? '');
            if (str.includes(',') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',');
        csvRows.push(row);
      });
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableView}-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDelete = (type: TableView) => {
    const ids = type === 'roads' ? Array.from(selectedRoadIds) : Array.from(selectedReportIds);
    requestDelete(type, ids);
  };

  const handleMarkReportDone = async (id: number) => {
    setMarkingReportId(id);
    const { error } = await supabase.from('reports').update({ status: 'done' }).eq('id', id);
    if (error) {
      alert(`Gagal menandai laporan selesai: ${error.message}`);
      setMarkingReportId(null);
      return;
    }
    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, status: 'done' } : report))
    );
    setMarkingReportId(null);
  };

  const renderActionMenu = (type: TableView, id: string | number) => {
    const report =
      type === 'reports' ? reports.find((item) => item.id === Number(id)) : null;
    const isDone = report ? (report.status ?? '').toLowerCase() === 'done' : false;
    const isMarking = report ? markingReportId === report.id : false;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="bg-white p-0 text-gray-600"
            aria-label="Open actions"
          >
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="left"
          className="w-48 rounded-md border border-gray-200 bg-white p-1"
        >
          <div className="flex flex-col">
            <Button
              size="custom"
              variant="ghost"
              className="justify-start rounded-sm p-2 text-sm font-normal text-gray-800 hover:bg-stone-100"
              onClick={() => handleEdit(type, id)}
            >
              Edit
            </Button>
            <Button
              size="custom"
              variant="ghost"
              className="justify-start rounded-sm p-2 text-sm font-normal text-gray-800 hover:bg-stone-100"
              onClick={() => handleViewOnMap(type, id)}
            >
              View on Map
            </Button>
            {type === 'reports' && (
              <Button
                size="custom"
                variant="ghost"
                disabled={isDone || isMarking}
                className="justify-start rounded-sm p-2 text-sm font-normal text-gray-800 hover:bg-stone-100 disabled:opacity-60"
                onClick={() => handleMarkReportDone(Number(id))}
              >
                {isMarking ? 'Memproses...' : 'Tandai selesai'}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="justify-start rounded-sm text-red-700 hover:bg-red-50 font-normal"
              onClick={() => requestDelete(type, [id])}
            >
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderBulkActionMenu = (type: TableView) => {
    const hasSelection = type === 'roads' ? selectedRoadIds.size > 0 : selectedReportIds.size > 0;
    const selectionCount = type === 'roads' ? selectedRoadIds.size : selectedReportIds.size;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="bg-white p-0 text-gray-600"
            aria-label="Open bulk actions"
            disabled={!hasSelection}
          >
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="left"
          className="w-44 rounded-md border border-gray-200 bg-white p-1"
        >
          <div className="flex flex-col">
            <Button
              size="custom"
              variant="ghost"
              className="justify-start p-2 text-sm rounded-sm text-gray-800 hover:bg-stone-100 font-normal"
              onClick={handleBulkExport}
            >
              Export ({selectionCount})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="justify-start rounded-sm text-red-700 hover:bg-red-50 font-normal"
              onClick={() => handleBulkDelete(type)}
            >
              Delete ({selectionCount})
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );

  const renderRoadCondition = (value: string | null) => {
    if (!value) return '-';
    const normalized = value.replace(/_/g, ' ');
    return normalized;
  };

  const renderRoadCards = () => (
    <div className="space-y-3 lg:hidden">
      {roads.map((road) => (
        <div key={road.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{getRoadPrimaryLabel(road)}</p>
              <p className="text-xs text-gray-500">{getRoadSecondaryLabel(road)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={selectedRoadIds.has(road.id)}
                onChange={() => toggleRoadSelection(road.id)}
                aria-label={`Select ${road.name ?? road.id}`}
              />
              <span className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-700">
                {road.status ?? 'Unknown'}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <p className="text-[11px] text-gray-500">Condition</p>
              <p className="font-medium">{renderRoadCondition(road.condition)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Type</p>
              <p className="font-medium capitalize">{road.tipe_jalan ?? '-'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Length</p>
              <p className="font-medium">{formatDistance(road.length)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Width</p>
              <p className="font-medium">{formatWidth(road.width)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Status</p>
              <p className="font-medium">{road.status ?? '-'}</p>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{buildLocationLabel(road)}</span>
            </div>
            <div className="col-span-2 text-xs text-gray-600">
              Lingkungan: <span className="font-semibold text-gray-800">{road.lingkungan ?? '-'}</span> | RT/RW:{' '}
              <span className="font-semibold text-gray-800">{road.rt ?? '-'}</span> /{' '}
              <span className="font-semibold text-gray-800">{road.rw ?? '-'}</span>
            </div>
            <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 text-xs">
              <Button size="sm" variant="outline" onClick={() => handleEdit('roads', road.id)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => requestDelete('roads', [road.id])}>
                Delete
              </Button>
              <Button size="sm" variant="primary" onClick={() => handleViewOnMap('roads', road.id)}>
                View on Map
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderRoadTable = () => (
    <div className="hidden lg:block">
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="realtive bg-gray-50">
            <tr>
              <th scope="col" className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  checked={allRoadsSelected}
                  onChange={toggleSelectAllRoads}
                  aria-label="Select all roads on this page"
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Road
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Kota
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Kecamatan
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Kelurahan
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Lingkungan
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                RT
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                RW
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Tipe Jalan
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Condition
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Length
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Width
              </th>
              <th scope="col" className="sticky right-0 bg-gray-50 px-4 py-3 text-right text-xs font-medium text-gray-500">
                <div className="flex items-center justify-end gap-2">
                  {renderBulkActionMenu('roads')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="relative divide-y divide-gray-100 bg-white whitespace-nowrap">
            {roads.map((road) => (
              <tr key={road.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={selectedRoadIds.has(road.id)}
                    onChange={() => toggleRoadSelection(road.id)}
                    aria-label={`Select ${road.name ?? road.id}`}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="text-sm font text-gray-900">{getRoadPrimaryLabel(road)}</div>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="">{road.kota ?? '-'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{road.kecamatan ?? '-'}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{road.kelurahan ?? '-'}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{road.lingkungan ?? '-'}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{road.rt ?? '-'}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{road.rw ?? '-'}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-[11px] font-medium text-gray-700">
                    <Route className="h-3.5 w-3.5 text-gray-400" />
                    <span className="capitalize">{road.tipe_jalan ?? 'Unknown type'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">
                  <Badge variant="outline" className={`font-medium capitalize ${road.condition === 'good condition' ? 'bg-green-50 border border-brand-200 text-brand-600' : road.condition === 'minor damage' ? 'bg-yellow-50 border border-yellow-200 text-yellow-600' : 'bg-red-50 border border-red-300 text-red-800'}`} color={road.condition ?? 'default'}>{road.condition ?? 'Unknown'}</Badge>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">
                  {road.status ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 align-top text-sm font-medium text-gray-900">
                  {formatDistance(road.length)}
                </td>
                <td className="px-4 py-3 align-top text-sm font-medium text-gray-900">
                  {formatWidth(road.width)}
                </td>
                <td className="sticky right-0 bg-white px-4 py-3 align-top text-right">
                  {renderActionMenu('roads', road.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportStatus = (status: string | null | undefined) => {
    const meta = status ? REPORT_STATUS_META[status.toLowerCase()] ?? REPORT_STATUS_META.default : REPORT_STATUS_META.default;
    return (
      <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold', meta.className)}>
        {meta.label}
      </span>
    );
  };

  const renderReportCards = () => (
    <div className="space-y-3 lg:hidden">
      {reports.map((report) => (
        <div key={report.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{formatReportCode(report.id)}</p>
              <p className="text-xs text-gray-500">
                Road: {report.road_name ?? report.road_id ?? '-'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={selectedReportIds.has(report.id)}
                onChange={() => toggleReportSelection(report.id)}
                aria-label={`Select report ${report.id}`}
              />
              {renderReportStatus(report.status)}
            </div>
          </div>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <div className="flex items-center gap-2 text-gray-600">
              <TriangleAlert className="h-4 w-4 text-amber-500" />
              <span className="font-medium capitalize">{formatKerusakanLevel(report.kerusakan_level)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{formatCoordinate(report.latitude, report.longitude)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Dibuat: <span className="font-medium text-gray-800">{formatReportDate(report.created_at)}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {report.deskripsi?.trim() || 'Tidak ada deskripsi'}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={(report.status ?? '').toLowerCase() === 'done' || markingReportId === report.id}
                className="font-normal disabled:opacity-60"
                onClick={() => handleMarkReportDone(report.id)}
              >
                {markingReportId === report.id ? 'Memproses...' : 'Tandai selesai'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleEdit('reports', report.id)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => requestDelete('reports', [report.id])}>
                Delete
              </Button>
              <Button size="sm" variant="primary" onClick={() => handleViewOnMap('reports', report.id)}>
                View on Map
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReportTable = () => (
    <div className="hidden lg:block">
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="realtive bg-gray-50">
            <tr>
              <th scope="col" className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  checked={allReportsSelected}
                  onChange={toggleSelectAllReports}
                  aria-label="Select all reports on this page"
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Report
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Road Name
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Latitude
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Longitude
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Kerusakan
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Kontak
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                User
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                Created
              </th>
              <th scope="col" className="sticky right-0 bg-gray-50 px-4 py-3 text-right text-xs font-medium text-gray-500">
                <div className="flex items-center justify-end gap-2">{renderBulkActionMenu('reports')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="relative divide-y divide-gray-100 bg-white whitespace-nowrap">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={selectedReportIds.has(report.id)}
                    onChange={() => toggleReportSelection(report.id)}
                    aria-label={`Select report ${report.id}`}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="text-sm font-medium text-gray-900">{formatReportCode(report.id)}</div>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">
                  <div className="font-medium text-gray-900">{report.road_name ?? '-'}</div>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{formatLatLngValue(report.latitude)}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{formatLatLngValue(report.longitude)}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-900 capitalize">
                  {formatKerusakanLevel(report.kerusakan_level)}
                </td>
                <td className="px-4 py-3 align-top">{renderReportStatus(report.status)}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{report.user_id ?? '-'}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{report.kontak_pelapor ?? '-'}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-800">{formatReportDate(report.created_at)}</td>
                <td className="sticky right-0 bg-white px-4 py-3 align-top text-right">
                  {renderActionMenu('reports', report.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDataContent = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-sm text-gray-500">
          Loading data...
        </div>
      );
    }

    if (tableView === 'roads') {
      if (!roads.length) {
        return renderEmptyState('Belum ada data jalan. Coba cari kata kunci lain.');
      }
      return (
        <>
          {renderRoadCards()}
          {renderRoadTable()}
        </>
      );
    }

    if (!reports.length) {
      return renderEmptyState('Belum ada laporan untuk ditampilkan.');
    }

    return (
      <>
        {renderReportCards()}
        {renderReportTable()}
      </>
    );
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditTarget(null);
      setEditForm(emptyRoadForm);
      setEditError(null);
      setEditSaving(false);
    }
  };

  const parseNumberField = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeTextField = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    setEditError(null);

    const payload = {
      name: normalizeTextField(editForm.name),
      highway: normalizeTextField(editForm.highway),
      kota: normalizeTextField(editForm.kota),
      kecamatan: normalizeTextField(editForm.kecamatan),
      kelurahan: normalizeTextField(editForm.kelurahan),
      lingkungan: normalizeTextField(editForm.lingkungan),
      rt: parseNumberField(editForm.rt),
      rw: parseNumberField(editForm.rw),
      tipe_jalan: normalizeTextField(editForm.tipe_jalan),
      condition: normalizeTextField(editForm.condition),
      status: normalizeTextField(editForm.status),
      length: parseNumberField(editForm.length),
      width: parseNumberField(editForm.width),
    };

    try {
      const { error } = await supabase.from('roads').update(payload).eq('id', editTarget.id);
      if (error) {
        setEditError(error.message ?? 'Gagal menyimpan perubahan.');
        return;
      }

      setEditDialogOpen(false);
      setEditTarget(null);
      fetchData();
    } catch (err) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('Gagal menyimpan perubahan.');
      }
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-geist-50 pb-6">
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTarget(null);
            setDeleteLoading(false);
          }
        }}
      >
        <AlertDialogContent className="max-w-3xl">
          <div className="flex flex-col gap-4">
            <AlertDialogHeader className="space-y-2 text-left">
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">{deleteTitle}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600">
                Tindakan ini tidak dapat dibatalkan. Data akan dihapus permanen dari database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-60 overflow-y-auto rounded-md border border-gray-100 bg-gray-50/60 px-3 py-2">
              {deleteItems.length === 0 ? (
                <p className="text-sm text-gray-500">Tidak ada data terpilih.</p>
              ) : (
                <div className="space-y-2">
                  {deleteItems.map((item) => (
                    <div
                      key={`${deleteTarget?.type ?? 'item'}-${item.id}`}
                      className="flex items-start justify-between gap-3 rounded-md border border-transparent px-2 py-2 hover:border-gray-200 hover:bg-white"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-gray-900">{item.primary}</p>
                        {item.secondary ? (
                          <p className="text-xs text-gray-500">{item.secondary}</p>
                        ) : null}
                      </div>
                      <Badge variant="outline" className="text-[11px] text-gray-600">
                        {item.badge}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-6xl">
          <div className="flex items-start justify-between gap-3">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle>Edit data jalan</DialogTitle>
              <DialogDescription>
                Perbarui detail ruas jalan. Kosongkan nilai untuk mengatur ulang ke kosong.
              </DialogDescription>
            </DialogHeader>
          </div>

          {editTarget ? (
            <div className="space-y-4">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <Input
                  label="Nama jalan"
                  value={editForm.name}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, name: val }))}
                  placeholder="Contoh: Jalan Melati"
                />
                <Input
                  label="Highway"
                  value={editForm.highway}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, highway: val }))}
                  placeholder="primary / residential"
                />
                <Input
                  label="Kota"
                  value={editForm.kota}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, kota: val }))}
                  placeholder="Kota"
                />
                <Input
                  label="Kecamatan"
                  value={editForm.kecamatan}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, kecamatan: val }))}
                  placeholder="Kecamatan"
                />
                <Input
                  label="Kelurahan"
                  value={editForm.kelurahan}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, kelurahan: val }))}
                  placeholder="Kelurahan"
                />
                <Input
                  label="Lingkungan"
                  value={editForm.lingkungan}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, lingkungan: val }))}
                  placeholder="Lingkungan"
                />
                <Input
                  label="RT"
                  type="number"
                  inputMode="numeric"
                  value={editForm.rt}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, rt: val }))}
                  placeholder="RT"
                />
                <Input
                  label="RW"
                  type="number"
                  inputMode="numeric"
                  value={editForm.rw}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, rw: val }))}
                  placeholder="RW"
                />
                <Input
                  label="Tipe jalan"
                  value={editForm.tipe_jalan}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, tipe_jalan: val }))}
                  placeholder="Arteri / Lokal"
                />
                <Input
                  label="Condition"
                  value={editForm.condition}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, condition: val }))}
                  placeholder="good condition / minor damage"
                />
                <Input
                  label="Status"
                  value={editForm.status}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, status: val }))}
                  placeholder="Open / Closed"
                />
                <Input
                  label="Length (m)"
                  type="number"
                  inputMode="decimal"
                  value={editForm.length}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, length: val }))}
                  placeholder="100"
                />
                <Input
                  label="Width (m)"
                  type="number"
                  inputMode="decimal"
                  value={editForm.width}
                  onValueChange={(val) => setEditForm((prev) => ({ ...prev, width: val }))}
                  placeholder="5"
                />
              </div>

              {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Pilih data jalan untuk mulai mengedit.</p>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button size='sm' variant='outline' className='rounded-sm px-4' disabled={editSaving}>Batal</Button>
            </DialogClose>
            <Button size='sm' className='rounded-sm px-4 bg-black' onClick={handleSaveEdit} disabled={editSaving || !editTarget}>
              {editSaving ? 'Menyimpan...' : 'Simpan perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mx-auto space-y-7">
        <header className="border-b border-gray-300">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 md:flex-row md:items-center md:justify-between md:px-0">
            <div className="space-y-4 py-7 md:py-10">
              <h1 className="text-3xl font-medium tracking-tight text-gray-900 sm:text-4xl">Data Management</h1>
              <p className="text-sm font-normal text-gray-900">
                Semua data jalan dan laporan terkonsolidasi di sini.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-4 px-4">
          <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-100 p-1">
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {tableViewOptions.map((option) => {
                  const isActive = option.value === tableView;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setTableView(option.value)}
                      aria-pressed={isActive}
                      className={cn(
                        'flex flex-col rounded-md p-2.5 text-center transition-colors',
                        isActive
                          ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                          : 'text-gray-700 hover:text-gray-700'
                      )}
                    >
                      <span className="text-sm font-normal">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            <div className="flex flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative w-full">
                <Search strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={tableView === 'roads' ? 'Cari nama jalan atau tipe...' : 'Cari laporan atau status...'}
                  value={search}
                  onValueChange={(val) => {
                    setSearch(val);
                    setPage(1);
                  }}
                  size="sm"
                  className="h-11 bg-white pl-10"
                />
              </div>
            </div>
          </section>

          <section className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            {renderDataContent()}
          </section>

          {total > 0 && (
            <div className="mx-auto mt-6 max-w-6xl rounded-lg border border-gray-300 bg-white px-4 py-3 sm:px-5">
              <div className="flex flex-row justify-between gap-4 md:items-center">
                <p className="hidden text-sm font-normal text-gray-600 lg:inline">
                  Showing{' '}
                  <span className="font-medium text-gray-900">{Math.min(start, total)}</span> -{' '}
                  <span className="font-medium text-gray-900">{Math.min(end, total)}</span> of{' '}
                  <span className="font-medium text-gray-900">{total}</span> {summaryLabel}
                </p>

                <div className="flex flex-1 items-center justify-between gap-3 lg:flex-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 w-20"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    aria-label="Previous page"
                  >
                    <div className="flex items-center gap-1">
                      <ChevronLeft strokeWidth={2.5} className="h-5 w-5" />
                      <span>Prev</span>
                    </div>
                  </Button>

                  <div className="flex flex-row justify-center gap-2">
                    {pageNumbers.map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setPage(n)}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          `${n === page ? 'border border-gray-300 bg-white shadow-md' : ''} h-9 w-10 justify-center text-gray-600`
                        )}
                        aria-current={n === page ? 'page' : undefined}
                        aria-label={`Go to page ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-9 w-20"
                    disabled={page === pageCount || total === 0}
                    onClick={() => setPage((prev) => prev + 1)}
                    aria-label="Next page"
                  >
                    <div className="flex items-center gap-1">
                      <span>Next</span>
                      <ChevronRight strokeWidth={2.5} className="h-5 w-5" />
                    </div>
                  </Button>
                </div>
                <div className="flex flex-1 gap-3 md:flex-row md:items-center md:gap-4 lg:flex-0">
                  <label className="hidden items-center gap-2 whitespace-nowrap text-sm font-normal text-gray-500 lg:inline-flex">
                    Items / Page
                    <select
                      value={perPage}
                      onChange={(e) => handlePerPageChange(Number(e.target.value))}
                      className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      {limitOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
