import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Compass, Crosshair, MapPin, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@shared/components/Input';
import { supabase } from '@shared/services/supabase';
import { Badge } from '@/components/ui/badge';
import type { RoadRow } from '@/features/admin/pages/maps/types';

const severityOptions = [
  { value: 'ringan', label: 'Ringan' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'berat', label: 'Berat' },
];

const NewReport = () => {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  const [severity, setSeverity] = useState<string>('sedang');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [roadQuery, setRoadQuery] = useState('');
  const [roads, setRoads] = useState<RoadRow[]>([]);
  const [searchingRoads, setSearchingRoads] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState<RoadRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const displayName = useMemo(
    () =>
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.user_metadata?.display_name ??
      user?.email ??
      'Explorer',
    [user]
  );

  useEffect(() => {
    if (!roadQuery || roadQuery.length < 3) {
      setRoads([]);
      return;
    }

    const handler = window.setTimeout(async () => {
      setSearchingRoads(true);
      const { data, error } = await supabase
        .from('roads')
        .select('id, name, kelurahan, kecamatan, kota')
        .or(`name.ilike.%${roadQuery}%,kecamatan.ilike.%${roadQuery}%,kota.ilike.%${roadQuery}%`)
        .limit(8);

      if (!error) setRoads((data ?? []) as RoadRow[]);
      setSearchingRoads(false);
    }, 250);

    return () => window.clearTimeout(handler);
  }, [roadQuery]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setSubmitError('Perangkat tidak mendukung geolokasi.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude.toFixed(6)));
        setLongitude(String(pos.coords.longitude.toFixed(6)));
        setSubmitError(null);
      },
      () => setSubmitError('Gagal mendapatkan lokasi. Pastikan izin lokasi diizinkan.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setSubmitError('Anda perlu login untuk mengirim laporan.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    const lat = latitude.trim() ? Number(latitude) : null;
    const lng = longitude.trim() ? Number(longitude) : null;

    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      kerusakan_level: severity,
      deskripsi: description.trim() || null,
      status: 'pending',
      kontak_pelapor: contact.trim() || null,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      road_id: selectedRoad?.id ?? null,
    });

    if (error) {
      setSubmitError(error.message ?? 'Gagal mengirim laporan.');
      setSubmitting(false);
      return;
    }

    setSubmitMessage('Laporan berhasil dikirim. Tim akan memverifikasi dan memperbarui status.');
    setDescription('');
    setContact('');
    setLatitude('');
    setLongitude('');
    setSelectedRoad(null);
    setRoadQuery('');
    setSubmitting(false);

    window.setTimeout(() => navigate('/reports/history'), 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Laporan baru</p>
            <h1 className="text-3xl font-semibold text-gray-900">Buat laporan jalan</h1>
            <p className="text-sm text-gray-600">
              Lengkapi detail kerusakan dan lokasi agar tim bisa memproses lebih cepat.
            </p>
            <p className="text-sm text-gray-500">Halo, {displayName}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Link to="/reports/history">
                <MapPin className="mr-2 h-4 w-4" />
                Lihat riwayat
              </Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Tingkat kerusakan</p>
                <p className="text-sm text-gray-700">Pilih kategori yang paling sesuai.</p>
              </div>
              <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
                Wajib
              </Badge>
            </div>
            <div className="mt-3 w-full sm:w-72">
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tingkat kerusakan" />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Lokasi & jalan</p>
                <p className="text-sm text-gray-700">Cari ruas jalan atau isi koordinat manual.</p>
              </div>
              <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                Opsional
              </Badge>
            </div>

            {selectedRoad ? (
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-3 text-sm text-brand-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{selectedRoad.name ?? `Ruas ${selectedRoad.id}`}</p>
                    <p className="text-xs text-brand-700">
                      {[selectedRoad.kelurahan, selectedRoad.kecamatan, selectedRoad.kota].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRoad(null)}
                    className="text-xs font-medium text-brand-700 underline"
                  >
                    Ganti
                  </button>
                </div>
              </div>
            ) : (
              <Input
                placeholder="Cari nama jalan, kecamatan, atau kota"
                value={roadQuery}
                onValueChange={setRoadQuery}
                helperText={searchingRoads ? 'Mencari jalan...' : 'Minimal 3 huruf untuk mencari.'}
              />
            )}

            {!selectedRoad && roads.length > 0 && (
              <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {roads.map((road) => (
                  <button
                    key={road.id}
                    type="button"
                    onClick={() => setSelectedRoad(road)}
                    className="w-full rounded-md bg-white px-3 py-2 text-left text-sm text-gray-800 shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <p className="font-semibold">{road.name ?? `Ruas ${road.id}`}</p>
                    <p className="text-xs text-gray-600">
                      {[road.kelurahan, road.kecamatan, road.kota].filter(Boolean).join(', ') || 'Lokasi belum tercatat'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Latitude"
                placeholder="-8.123456"
                value={latitude}
                onValueChange={setLatitude}
                type="text"
              />
              <Input
                label="Longitude"
                placeholder="115.123456"
                value={longitude}
                onValueChange={setLongitude}
                type="text"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleUseLocation} className="w-full sm:w-auto">
              <Crosshair className="h-4 w-4" />
              Pakai lokasi saya
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Deskripsi singkat</p>
              <p className="text-sm text-gray-700">Jelaskan kondisi jalan dan titik kerusakan.</p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Lubang besar di tengah jalan, air menggenang saat hujan."
              className="min-h-[120px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              required
            />

            <Input
              label="Kontak (opsional)"
              placeholder="Nomor WA atau email"
              value={contact}
              onValueChange={setContact}
              type="text"
            />
          </div>

          {(submitError || submitMessage) && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                submitError
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {submitError ?? submitMessage}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              <Send className="h-4 w-4" />
              {submitting ? 'Mengirim...' : 'Kirim laporan'}
            </Button>
            <Button asChild variant="ghost" className="w-full sm:w-auto">
              <Link to="/reports/history">Lihat riwayat</Link>
            </Button>
          </div>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Panduan cepat</p>
              <ul className="mt-2 list-disc pl-4 text-sm text-gray-600">
                <li>Pilih tingkat kerusakan sesuai kondisi jalan.</li>
                <li>Isi titik lokasi agar admin bisa memverifikasi.</li>
                <li>Kontak membantu tim menghubungi jika dibutuhkan.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewReport;
