import { useParams } from 'react-router-dom';

import BottomNav from '@features/user/components/BottomNav';

const Detail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-brand-50 pb-24">
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500 px-5 pb-14 pt-14 text-white shadow-lg">
        <p className="text-sm opacity-80">Detail</p>
        <h1 className="text-2xl font-semibold tracking-tight">Rincian data</h1>
      </div>

      <main className="-mt-8 space-y-4 px-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm text-gray-600">ID data: {id ?? 'Tidak ditemukan'}</p>
          <p className="mt-2 text-sm text-gray-600">
            Detail lengkap akan ditambahkan setelah integrasi backend untuk halaman ini tersedia.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Detail;
