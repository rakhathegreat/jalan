// src/pages/Profile.tsx
import { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, QrCode, Sparkles, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import BottomNav from '@features/user/components/BottomNav';
import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { useScanStats } from '@features/user/hooks/useScanStats';
import { useScanHistory } from '@features/user/hooks/useScanHistory';

import { Button } from '@shared/components/Button';
import Badge from '@shared/components/Badge';

import { supabase } from '@shared/services/supabase';

const milestones = [
  { title: 'Pencinta pohon', target: 5, description: 'Scan 5 pohon berbeda' },
  { title: 'Penjaga rimbun', target: 15, description: 'Scan di 3 lokasi baru' },
  { title: 'Duta hijau', target: 30, description: 'Bagikan laporan kondisi' },
];

const Profile = () => {
  const [scanCount, setScanCount] = useState(0);
  const { user, loading: loadingProfile } = useAuthUser();
  const { totalCount: remoteScanCount } = useScanStats(user?.id);
  const { history: scanHistory, loading: loadingHistory } = useScanHistory(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = Number(localStorage.getItem('scanCount') || '0');
    setScanCount(saved);
  }, []);

  useEffect(() => {
    if (remoteScanCount != null) {
      setScanCount(remoteScanCount);
      localStorage.setItem('scanCount', String(remoteScanCount));
    }
  }, [remoteScanCount]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('scanCount');
    window.location.href = '/';
  };

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? 'Pecinta Pohon';
  const initials = useMemo(() => {
    const letters = displayName
      .split(' ')
      .map((word: string) => word.charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return letters || 'P';
  }, [displayName]);

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      })
    : 'Belum terdata';

  const nextMilestone = milestones.find((milestone) => scanCount < milestone.target);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50">
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-28 pt-6">
        <section className="rounded-2xl bg-gradient-to-bl from-brand-500 to-brand-600 p-5 text-white shadow-lg ring-1 ring-white/15">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-xl font-semibold">
                {initials}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-white/80">Profil penjelajah</p>
                <h1 className="text-2xl font-semibold text-white">{displayName}</h1>
                <p className="flex items-center gap-2 text-xs text-white/80">
                  <Calendar className="h-4 w-4 text-white/70" /> Bergabung {joinDate}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="w-fit border-white/40 bg-white/10 text-white">
              {loadingProfile ? 'Memuat...' : 'Akun aktif'}
            </Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase text-white/70">Total scan</p>
              <p className="text-2xl font-semibold text-white">{scanCount}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase text-white/70">Status lencana</p>
              <p className="text-sm font-semibold text-white">
                {scanCount >= 15 ? 'Penjaga rimbun' : scanCount >= 5 ? 'Pencinta pohon' : 'Pemula'}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase text-white/70">Lokasi favorit</p>
              <p className="flex items-center gap-1 text-sm font-semibold text-white">
                <MapPin className="h-4 w-4 text-white/80" />
                Kebun kampus utama
              </p>
            </div>
          </div>
          {nextMilestone && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Menuju {nextMilestone.title}</span>
                <span className="font-semibold text-white">
                  {Math.max(nextMilestone.target - scanCount, 0)} scan lagi
                </span>
              </div>
              <div
                className="relative h-2 w-full rounded-full bg-white/15 ring-1 ring-inset ring-white/25 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.min(100, Math.round((scanCount / nextMilestone.target) * 100))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, Math.round((scanCount / nextMilestone.target) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brand-700">
              <History className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-brand-800">Riwayat Scan</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/scan-history')}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {loadingHistory ? (
              <p className="text-sm text-gray-600">Memuat riwayat...</p>
            ) : scanHistory.length === 0 ? (
              <p className="text-sm text-gray-600">Belum ada riwayat scan.</p>
            ) : (
              scanHistory.slice(0, 3).map((item) => (
                <a
                  key={item.id}
                  href={`/detail/${item.data_pohon_id ?? ''}`}
                  className="flex items-center justify-between rounded-xl border border-gray-300 bg-brand-50/40 p-4 text-sm text-brand-800 hover:border-brand-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 ring-1 ring-brand-200">
                      <QrCode className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col space-y-1">
                      <span className="text-brand-800 font-semibold">
                        Pohon {(item.data_pohon.jenis_pohon.common_name as string) || 'Unknown'}
                      </span>
                      <span className="text-xs text-brand-700/70">
                        {new Date(item.created_at).toLocaleTimeString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-brand-600">Lihat detail</span>
                </a>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-600">Kegiatan terbaru</p>
              <h2 className="text-xl font-semibold text-brand-700">Statistik scan</h2>
            </div>
            {nextMilestone && (
              <Badge variant="secondary" className="text-brand-700">
                {`Butuh ${Math.max(nextMilestone.target - scanCount, 0)} scan untuk ${nextMilestone.title}`}
              </Badge>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
              <div className="flex items-center gap-2 text-brand-700">
                <QrCode className="h-5 w-5" />
                <p className="text-xs font-semibold uppercase tracking-wide">Catatan bulan ini</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-brand-800">{scanCount}</p>
              <p className="text-sm text-brand-700/80">Scan yang tersimpan pada perangkat ini.</p>
            </div>
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-5 text-brand-800">
              <p className="text-sm">
                Simpan hasil scan favorit dengan menandainya sebagai <span className="font-semibold">pohon kesayangan</span>.
                Fitur ini segera hadir untuk semua akun publik.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-brand-700">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-brand-800">Target pencapaian</h2>
          </div>
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const progress = Math.min((scanCount / milestone.target) * 100, 100);
              const achieved = scanCount >= milestone.target;
              return (
                <div key={milestone.title} className="rounded-2xl border border-gray-200 p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-800">{milestone.title}</p>
                      <p className="text-xs text-brand-700/80">{milestone.description}</p>
                    </div>
                    <Badge variant={achieved ? 'success' : 'outline'}>
                      {achieved ? 'Tercapai' : `${milestone.target} scan`}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="relative flex-1 h-2 rounded-full bg-brand-50 ring-1 ring-inset ring-brand-100 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-[width] duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-brand-700">{Math.round(progress)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Button variant="danger" size="full" className="gap-2 text-sm text-white bg-red-700 font-medium" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
