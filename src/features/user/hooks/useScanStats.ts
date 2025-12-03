import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@shared/services/supabase';

export const useScanStats = (userId?: string | null) => {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setTotalCount(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const countByColumn = async (column: 'user_id' | 'user') => {
      const { count, error: queryError } = await supabase
        .from('scan')
        .select('*', { count: 'exact', head: true })
        .eq(column, userId);
      if (queryError) throw queryError;
      return count ?? 0;
    };

    try {
      let count = 0;
      try {
        count = await countByColumn('user_id');
      } catch (primaryError) {
        try {
          count = await countByColumn('user');
        } catch (fallbackError) {
          const message =
            (fallbackError as { message?: string })?.message ??
            (primaryError as { message?: string })?.message ??
            'Gagal memuat riwayat scan.';
          setError(message);
          setTotalCount(null);
          setLoading(false);
          return;
        }
      }
      setTotalCount(count);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { totalCount, loading, error, reload: load };
};

export default useScanStats;
