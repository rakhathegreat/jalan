import { useMemo } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';

import BottomNav from '@features/user/components/BottomNav';
import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { useScanHistory } from '@features/user/hooks/useScanHistory';
import { Button } from '@/components/ui/button';

const formatTime = (value?: string | null) => {
  if (!value) return 'Waktu tidak diketahui';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Waktu tidak diketahui';
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const ScanHistory = () => {
  const { user } = useAuthUser();
  const { items, loading, error, reload } = useScanHistory(user?.id);

  const greeting = useMemo(
    () =>
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.user_metadata?.display_name ??
      user?.email ??
      'Explorer',
    [user]
  );

  return (
    <div className="min-h-screen bg-brand-50 pb-24">
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 px-5 pb-14 pt-14 text-white shadow-lg">
        <p className="text-sm opacity-80">Halo, {greeting}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat Scan</h1>
        <p className="mt-3 text-sm text-white/80">
          Catatan pemindaian terbaru akan muncul di sini. Gunakan untuk meninjau lokasi yang sudah dipindai.
        </p>
      </div>

      <main className="-mt-8 space-y-4 px-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {loading ? 'Memuat data...' : `Total ${items.length} scan terbaru`}
          </p>
          <Button variant="outline" size="sm" onClick={() => reload()}>
            <RefreshCw className="h-4 w-4" />
            Muat ulang
          </Button>
        </div>

        <div className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-gray-600">Belum ada riwayat scan.</p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Scan ID</p>
                  <p className="text-base font-semibold text-gray-900">{item.treeId ?? item.id}</p>
                  <p className="text-sm text-gray-600">{item.label}</p>
                </div>
                {item.status && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {item.status}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Clock3 className="h-3.5 w-3.5" />
                {formatTime(item.createdAt)}
              </div>
              {item.notes && <p className="mt-2 text-sm text-gray-600">{item.notes}</p>}
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default ScanHistory;
