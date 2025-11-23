import { useEffect, useState } from 'react';

import { supabase } from '@shared/services/supabase';

export type ScanHistoryItem = {
  id: string;
  data_pohon_id: string | null;
  created_at: string;
  data_pohon: {
    id: string;
    jenis_pohon_id: string;
    jenis_pohon: {
      common_name: string;
      scientific_name: string;
    };
  }
};

export const useScanHistory = (userId?: string | null) => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchHistory = async () => {
      if (!userId) {
        setHistory([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('scan')
        .select('id, data_pohon_id, created_at, data_pohon (id, jenis_pohon_id, jenis_pohon (common_name, scientific_name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ignore) return;
      if (!error && data) setHistory(data as unknown as ScanHistoryItem[]);
      setLoading(false);
    };

    fetchHistory();
    return () => {
      ignore = true;
    };
  }, [userId]);

  return { history, loading };
};

export default useScanHistory;
