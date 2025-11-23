import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/Card';
import Button from '@shared/components/Button';
import Badge from '@shared/components/Badge';

const reports = [
  {
    id: 'REP-2091',
    tree: 'TP-045',
    type: 'QR Rusak',
    note: 'Sticker terkelupas, tidak terbaca',
    photo: 'https://via.placeholder.com/120',
  },
  {
    id: 'REP-2092',
    tree: 'TP-120',
    type: 'Vandal',
    note: 'Coretan spidol di permukaan',
    photo: 'https://via.placeholder.com/120',
  },
];

const Moderation = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Moderasi & Laporan Lapangan</h1>
      <p className="text-gray-500">Tinjau laporan kondisi pohon, QR rusak, dan tindakan lapangan.</p>
    </div>

    <Card variant="solid" padding="lg">
      <CardHeader>
        <CardTitle>Daftar Laporan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-start"
          >
            <img
              src={report.photo}
              alt={report.type}
              className="h-24 w-24 rounded-lg border border-gray-100 object-cover"
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">
                  {report.id} • Pohon {report.tree}
                </p>
                <Badge variant="outline">{report.type}</Badge>
              </div>
              <p className="text-sm text-gray-600">{report.note}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary">
                  Approve (+ Bonus)
                </Button>
                <Button size="sm" variant="outline">
                  Reject / Penalti
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default Moderation;
