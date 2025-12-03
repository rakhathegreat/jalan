import { useCallback, useState } from 'react';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@shared/services/supabase';

type LogoutButtonProps = {
  className?: string;
};

const LogoutButton = ({ className }: LogoutButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    setError(null);
    setLoading(true);

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message ?? 'Gagal logout. Silakan coba lagi.');
      setLoading(false);
      return;
    }

    window.location.href = '/login';
  }, []);

  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={loading}
        className="gap-2 text-gray-700"
      >
        <LogOut className="h-4 w-4" />
        {loading ? 'Keluar...' : 'Logout'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default LogoutButton;
