import { History, Scan as ScanIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import BottomNav from '@features/user/components/BottomNav';
import { Button } from '@/components/ui/button';

const Scan = () => (
  <div className="min-h-screen bg-brand-50 pb-24">
    <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 px-5 pb-14 pt-14 text-white shadow-lg">
      <p className="text-sm opacity-80">Scan QR</p>
      <h1 className="text-2xl font-semibold tracking-tight">Pindai pohon</h1>
      <p className="mt-3 text-sm text-white/85">
        Fitur scan akan menggunakan kamera perangkat. Pastikan Anda mengizinkan akses kamera.
      </p>
    </div>

    <main className="-mt-8 space-y-4 px-4">
      <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <ScanIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-gray-900">Mode scan belum aktif</h2>
        <p className="mt-1 text-sm text-gray-600">
          Integrasi kamera akan segera tersedia. Sementara itu, Anda bisa tetap melaporkan kondisi jalan secara manual.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button asChild>
            <Link to="/reports/new">Buat laporan jalan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/scan-history">
              <History className="h-4 w-4" />
              Lihat riwayat scan
            </Link>
          </Button>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
);

export default Scan;
