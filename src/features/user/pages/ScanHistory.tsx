import { useMemo } from 'react';
import { ArrowLeft, Clock, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BottomNav from '@features/user/components/BottomNav';
import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { useScanHistory } from '@features/user/hooks/useScanHistory';

const ScanHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const { history, loading } = useScanHistory(user?.id);

  const grouped = useMemo(() => {
    const byDate = new Map<string, typeof history>();
    history.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const arr = byDate.get(date) ?? [];
      arr.push(item);
      byDate.set(date, arr);
    });
    return Array.from(byDate.entries());
  }, [history]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50">
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-28 pt-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-brand-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-600">Riwayat</p>
            <h1 className="text-xl font-semibold text-brand-800">Scan terakhir</h1>
          </div>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-700">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-semibold">20 entri terbaru</span>
            </div>
            <p className="text-xs text-gray-500">{loading ? 'Memuat...' : `${history.length} entri`}</p>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Memuat riwayat...</p>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-700">
              Belum ada riwayat scan.
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map(([dateLabel, items]) => (
                <div key={dateLabel} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{dateLabel}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <a
                        key={item.id}
                        href={`/detail/${item.data_pohon_id ?? ''}`}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-brand-50/40 p-4 text-sm text-brand-800 hover:border-brand-200 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 ring-1 ring-brand-200">
                            <QrCode className="h-4 w-4" />
                          </span>
                          <div className="flex flex-col">
                            <span className="text-brand-800 font-semibold">
                              Pohon #{(item.data_pohon_id ?? '').slice(0, 8) || 'Unknown'}
                            </span>
                            <span className="text-xs text-brand-700/70">
                              {new Date(item.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-brand-600">Lihat detail</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScanHistory;
