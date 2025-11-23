import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@shared/services/supabase';

export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    supabase.auth.getUser().then(({ data, error }) => {
      if (ignore) return;
      if (!error) setUser(data.user ?? null);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  return { user, loading };
};

export default useAuthUser;
