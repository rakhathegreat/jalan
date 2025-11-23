// src/pages/Detail.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Compass, Leaf, MapPin, Sprout } from 'lucide-react';

import BottomNav from '@features/user/components/BottomNav';
import { supabase } from '@shared/services/supabase';

type TreeRecord = {
  id?: string | number;
  idx?: number;
  common_name: string;
  scientific_name?: string | null;
  taxonomy?: string | Record<string, unknown> | null;
  endemic?: string | { status?: string; regions?: string[] } | null;
  description?: string | null;
  characteristics?: string | Record<string, unknown> | null;
  coordinates?: { latitude?: number; longitude?: number; location?: string } | null;
  created_at?: string | null;
};

type ParsedTree = {
  id: string;
  commonName: string;
  scientificName: string;
  taxonomy: Array<{ label: string; value: string }>;
  endemicStatus?: string;
  endemicRegions: string[];
  description: string;
  characteristics: Array<{ label: string; value: string }>;
  coordinates?: { latitude?: number; longitude?: number; location?: string };
  createdAt?: string;
};

const FALLBACK_TREE: TreeRecord = {
  idx: 1,
  id: 1,
  created_at: '2025-11-08 04:25:32.785331+00',
  common_name: 'Angsana',
  scientific_name: 'Pterocarpus indicus',
  taxonomy:
    '{"class": "Magnoliopsida", "genus": "Pterocarpus", "order": "Fabales", "clades": ["Tracheophytes", "Angiosperms", "Eudicots", "Rosids"], "family": "Fabaceae", "kingdom": "Plantae", "species": "Pterocarpus indicus", "division": "Magnoliophyta"}',
  endemic: '{"status": "native", "regions": ["Jawa", "Sumatra", "Kalimantan"]}',
  description: 'Pohon peneduh cepat tumbuh, tajuk lebar, cocok untuk jalan kota.',
  characteristics: '{"leaf": "majemuk", "uses": ["peneduh", "kayu"], "height_m": 20, "growth_rate": "cepat"}',
};

const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const normalizeTree = (payload: any): ParsedTree => {
  // kalau hasil join, ambil detail dari jenis_pohon
  const source: TreeRecord = payload.jenis_pohon ?? payload;

  const taxonomyRaw = parseJson<Record<string, unknown>>(source.taxonomy, {});
  const endemicRaw = parseJson<{ status?: string; regions?: string[] }>(source.endemic, {});
  const characteristicRaw = parseJson<Record<string, unknown>>(source.characteristics, {});

  const taxonomyEntries: Array<{ label: string; value: string }> = [];
  const taxonomyOrder = ['kingdom', 'division', 'class', 'order', 'family', 'genus', 'species'];
  taxonomyOrder.forEach((key) => {
    const val = (taxonomyRaw as any)[key];
    if (val) taxonomyEntries.push({ label: key, value: String(val) });
  });
  if (Array.isArray((taxonomyRaw as any).clades) && (taxonomyRaw as any).clades.length) {
    taxonomyEntries.push({
      label: 'clades',
      value: (taxonomyRaw as any).clades.join(' • '),
    });
  }

  const characteristics: Array<{ label: string; value: string }> = [];
  Object.entries(characteristicRaw).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      characteristics.push({ label: key, value: val.join(', ') });
    } else if (typeof val === 'number') {
      characteristics.push({
        label: key,
        value: key.includes('height') ? `${val} m` : String(val),
      });
    } else if (val) {
      characteristics.push({ label: key, value: String(val) });
    }
  });

  return {
    id: String(payload.id ?? source.id ?? payload.idx ?? 'unknown'),
    commonName: source.common_name,
    scientificName: source.scientific_name ?? '',
    taxonomy: taxonomyEntries,
    endemicStatus: endemicRaw.status,
    endemicRegions: endemicRaw.regions ?? [],
    description: source.description ?? '',
    characteristics,
    coordinates: payload.coordinates ?? source.coordinates ?? undefined,
    createdAt: payload.created_at ?? source.created_at ?? undefined,
  };
};

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const [tree, setTree] = useState<ParsedTree | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      const { data: record, error } = await supabase
        .from('data_pohon')
        .select(
          `
          id,
          coordinates,
          created_at,
          jenis_pohon (
            id,
            common_name,
            scientific_name,
            taxonomy,
            endemic,
            description,
            characteristics
          )
        `
        )
        .eq('id', id)
        .single();

      console.log(record, error);

      if (!error && record) {
        setTree(normalizeTree(record));
      } else {
        console.error(error);
        // fallback dibungkus seperti hasil join
        setTree(
          normalizeTree({
            id: FALLBACK_TREE.id,
            coordinates: null,
            created_at: FALLBACK_TREE.created_at,
            jenis_pohon: FALLBACK_TREE,
          })
        );
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-brand-50 text-gray-600">
        Memuat detail pohon...
      </div>
    );

  if (!tree)
    return (
      <div className="grid min-h-screen place-items-center bg-brand-50 text-gray-600">
        Pohon tidak ditemukan
      </div>
    );

  const plantedDate = tree.createdAt
    ? new Date(tree.createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const quickFacts = [
    tree.coordinates?.location
      ? { icon: MapPin, label: 'Lokasi tanam', value: tree.coordinates.location }
      : null,
    tree.coordinates?.latitude && tree.coordinates?.longitude
      ? {
          icon: Compass,
          label: 'Koordinat',
          value: `${tree.coordinates.latitude}, ${tree.coordinates.longitude}`,
        }
      : null,
    plantedDate ? { icon: Calendar, label: 'Terdata sejak', value: plantedDate } : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: React.ReactNode }[];


  return (
    <div className="min-h-screen bg-brand-50">
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-28 pt-8">
        <section className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-sm">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-white/80">
              {tree.endemicStatus ? `Status ${tree.endemicStatus}` : 'Detail pohon'}
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">{tree.commonName}</h1>
            <p className="text-white/80 italic">{tree.scientificName}</p>
          </div>
          {quickFacts.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {quickFacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg bg-white/10 p-3 text-sm">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] uppercase tracking-wide text-white/70">{label}</p>
                  <p className="mt-1 font-semibold leading-relaxed text-white">{value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_4px_25px_-12px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-600">Identitas</p>
              <h2 className="text-xl font-semibold text-brand-800">Kisah singkat</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              <Sprout className="h-4 w-4" />
              ID #{tree.id.slice(0, 8)}
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr]">
            <p className="text-sm leading-relaxed text-gray-700">{tree.description}</p>
            <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-800 ring-1 ring-brand-100">
              <p className="font-semibold">Endemik</p>
              <p className="text-brand-700/80">
                {tree.endemicRegions.length ? tree.endemicRegions.join(', ') : 'Tidak ada data'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_4px_25px_-12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-800">Karakteristik</h2>
            <Leaf className="h-5 w-5 text-brand-600" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tree.characteristics.length === 0 && (
              <div className="rounded-lg border border-dashed border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-700">
                Belum ada karakteristik yang tercatat.
              </div>
            )}
            {tree.characteristics.map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                <p className="text-base font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_4px_25px_-12px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-800">Taksonomi</h2>
            <MapPin className="h-5 w-5 text-brand-600" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tree.taxonomy.map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                <p className="text-base font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {tree.coordinates && (tree.coordinates.latitude || tree.coordinates.location) && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_4px_25px_-12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brand-800">Lokasi & Koordinat</h2>
              <Compass className="h-5 w-5 text-brand-600" />
            </div>
            <div className="mt-3 rounded-lg border border-dashed border-brand-200 bg-brand-50/80 p-4 text-sm text-brand-800">
              {tree.coordinates.location && <p className="font-semibold">{tree.coordinates.location}</p>}
              {(tree.coordinates.latitude || tree.coordinates.longitude) && (
                <p className="mt-1 text-brand-700/80">
                  {tree.coordinates.latitude ?? '-'}, {tree.coordinates.longitude ?? '-'}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
