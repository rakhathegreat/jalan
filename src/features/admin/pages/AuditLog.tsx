import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/Card';
import Badge from '@shared/components/Badge';

const logs = [
  {
    id: 'LOG-3012',
    actor: 'Ayu Wulandari',
    action: 'edit_data_pohon',
    entity: 'Tree #TP-020',
    time: '12 Feb 2025 • 09:12',
    diff: 'Update koordinat & status',
  },
  {
    id: 'LOG-3013',
    actor: 'Budi Setiawan',
    action: 'perubahan_aturan_game',
    entity: 'Cooldown scan',
    time: '12 Feb 2025 • 10:45',
    diff: '30 → 25 menit',
  },
];

const AuditLog = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Log & Audit Trail</h1>
      <p className="text-gray-500">
        Catat seluruh perubahan penting untuk akuntabilitas dan pelacakan.
      </p>
    </div>

    <Card variant="solid" padding="lg">
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-2xl border border-gray-200 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-900">{log.id}</p>
              <Badge variant="outline">{log.action}</Badge>
            </div>
            <p className="text-gray-600">
              {log.actor} pada <span className="font-semibold">{log.entity}</span>
            </p>
            <p className="text-xs text-gray-400">{log.time}</p>
            <p className="mt-2 text-gray-500">{log.diff}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Integrasi dengan tabel AuditLogs (perubahan aturan, data pohon, transaksi poin).
        </div>
      </CardContent>
    </Card>
  </div>
);

export default AuditLog;
