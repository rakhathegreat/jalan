import { LogOut, UserRound } from 'lucide-react';

import BottomNav from '@features/user/components/BottomNav';
import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { Button } from '@/components/ui/button';
import { supabase } from '@shared/services/supabase';

const Profile = () => {
  const { user, loading } = useAuthUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.display_name ??
    user?.email ??
    'Pengguna';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-brand-50 pb-24">
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 px-5 pb-12 pt-14 text-white shadow-lg">
        <p className="text-sm opacity-80">Profil</p>
        <h1 className="text-2xl font-semibold tracking-tight">Akun Anda</h1>
      </div>

      <main className="-mt-6 space-y-4 px-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nama</p>
              <p className="text-base font-semibold text-gray-900">{loading ? 'Memuat...' : displayName}</p>
              <p className="text-xs text-gray-500">{user?.email ?? ''}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Keluar dari sesi saat ini. Anda bisa login kembali untuk melanjutkan pelaporan atau pemindaian.
          </p>
          <Button onClick={handleLogout} className="mt-3 w-full" variant="outline">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
