import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/Card';
import Input from '@shared/components/Input';
import Button from '@shared/components/Button';

const AntiCheat = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Validasi Scan & Anti-Cheat</h1>
      <p className="text-gray-500">Atur batas frekuensi, geofencing, dan deteksi anomali.</p>
    </div>

    <Card variant="solid" padding="lg">
      <CardHeader>
        <CardTitle>Batas Frekuensi</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Input label="Per QR per user (kali)" type="number" defaultValue="1" />
        <Input label="Cooldown (menit)" type="number" defaultValue="30" />
      </CardContent>
    </Card>

    <Card variant="solid" padding="lg">
      <CardHeader>
        <CardTitle>Geofencing</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Input label="Maksimal jarak (meter)" type="number" defaultValue="50" />
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
          Integrasi peta koordinat akan ditampilkan di sini untuk validasi lokasi scan.
        </div>
      </CardContent>
    </Card>

    <Card variant="solid" padding="lg">
      <CardHeader>
        <CardTitle>Fingerprint & Anomali</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
          Device ID & alamat IP pengguna terakhir tercatat otomatis. Anomali (spam/jam aneh) akan muncul di sini.
        </div>
        <Button size="sm" variant="outline">
          Lihat Alert Kecurangan
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default AntiCheat;
