import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@shared/services/supabase';

export type ScanHistoryItem = {
  id: string;
  createdAt?: string | null;
  status?: string | null;
  label?: string;
  treeId?: string | number | null;
  notes?: string | null;
};

const buildLabel = (payload: Record<string, any>) =>
  payload.site_name ??
  payload.tree_name ??
  payload.tree_id ??
  payload.tree ??
  payload.result ??
  payload.status ??
  'Scan tidak dikenal';

export const useScanHistory = (userId?: string | null, limit = 15) => {
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadByColumn = async (column: 'user_id' | 'user') => {
      const query = supabase
        .from('scan')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      return data ?? [];
    };

    try {
      let data: Record<string, any>[] = [];
      try {
        data = await loadByColumn('user_id');
      } catch (primaryError) {
        try {
          data = await loadByColumn('user');
        } catch (fallbackError) {
          const message =
            (fallbackError as { message?: string })?.message ??
            (primaryError as { message?: string })?.message ??
            'Gagal memuat riwayat scan.';
          setError(message);
          setItems([]);
          setLoading(false);
          return;
        }
      }

      setItems(
        data.map((item) => ({
          id: String(item.id ?? crypto.randomUUID?.() ?? Date.now()),
          createdAt: item.created_at ?? item.ts ?? null,
          status: item.status ?? item.result ?? null,
          label: buildLabel(item),
          treeId: item.tree_id ?? item.tree ?? null,
          notes: item.note ?? item.notes ?? null,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [limit, userId]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return { items, loading, error, reload: fetchHistory };
};

export default useScanHistory;
