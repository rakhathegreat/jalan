import { useMemo } from 'react';
import Button from '@shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/Card';
import Badge from '@shared/components/Badge';

const TreeRegistry = () => {
  const stats = useMemo(
    () => [
      { label: 'Pohon Aktif', value: 1280 },
      { label: 'QR Aktif', value: 1264 },
      { label: 'QR Nonaktif', value: 16 },
      { label: 'Batch Menunggu Cetak', value: 4 },
    ],
    []
  );

  const batches = [
    { id: 'BATCH-2403', size: 'M', count: 250, status: 'Menunggu Cetak' },
    { id: 'BATCH-2402', size: 'S', count: 100, status: 'Selesai' },
  ];

  const qrHistory = [
    {
      tree: 'TP-001',
      previous: 'QR-8F21',
      replacement: 'QR-9A20',
      date: '12 Feb 2025',
      reason: 'Kerusakan fisik',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Pohon & QR</h1>
        <p className="text-gray-500">
          Kelola data pohon, riwayat QR, dan proses pencetakan secara terpusat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} variant="subtle" padding="md">
            <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card variant="solid" padding="lg">
        <CardHeader>
          <CardTitle>Data Pohon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Tambah Pohon</Button>
            <Button size="sm" variant="outline">
              Impor CSV
            </Button>
            <Button size="sm" variant="ghost">
              Ekspor CSV
            </Button>
          </div>
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
            Tabel CRUD pohon belum terhubung. Gunakan Add/Edit Tree untuk sementara.
          </div>
        </CardContent>
      </Card>

      <Card variant="solid" padding="lg">
        <CardHeader>
          <CardTitle>Batch QR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Generate Batch</Button>
            <Button size="sm" variant="outline">
              Cetak Label
            </Button>
          </div>
          <div className="space-y-2">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="flex flex-wrap items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-gray-900">{batch.id}</p>
                  <p className="text-gray-500">
                    {batch.count} QR • Ukuran {batch.size}
                  </p>
                </div>
                <Badge variant="secondary">{batch.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="solid" padding="lg">
        <CardHeader>
          <CardTitle>Riwayat Penggantian QR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {qrHistory.map((item) => (
            <div
              key={item.previous}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-gray-900">Tree {item.tree}</span>
                <Badge variant="outline">{item.date}</Badge>
              </div>
              <p className="text-gray-500">
                {item.previous} diganti menjadi <span className="font-semibold">{item.replacement}</span>
              </p>
              <p className="text-xs text-gray-400">Alasan: {item.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreeRegistry;
