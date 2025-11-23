import { useEffect, useState } from 'react';

import { supabase } from '@shared/services/supabase';

type ScanStats = {
  totalCount: number | null;
  loading: boolean;
};

export const useScanStats = (userId?: string | null): ScanStats => {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchCount = async () => {
      setLoading(true);
      const query = supabase.from('scan').select('*', { count: 'exact', head: true });
      const { count, error } = userId ? await query.eq('user_id', userId) : await query;
      if (ignore) return;

      if (!error && typeof count === 'number') {
        setTotalCount(count);
      }
      setLoading(false);
    };

    fetchCount();
    return () => {
      ignore = true;
    };
  }, [userId]);

  return { totalCount, loading };
};

export default useScanStats;
