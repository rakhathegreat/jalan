import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TreeForm from '@features/trees/components/TreeForm';
import type { TreeFormValues } from '@features/trees/types';
import { createTreeFormDefaults } from '@features/trees/utils/form';
import { supabase } from '@shared/services/supabase';

const AddTree = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValues = useMemo(() => createTreeFormDefaults(), []);

  const handleSubmit = async (values: TreeFormValues) => {
    const locationName = values.coordinates.location?.toString().trim();
    if (!locationName) {
      alert('Location is required before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: jenisPohon, error: jenisPohonError } = await supabase
        .from('jenis_pohon')
        .select('id')
        .eq('common_name', values.common_name)
        .maybeSingle();

      if (jenisPohonError || !jenisPohon) {
        throw new Error('Tree is not listed in the catalog. Please choose an available name.');
      }

      let lokasiId: number | null = null;
      const { data: existingLokasi, error: lokasiError } = await supabase
        .from('lokasi')
        .select('id')
        .eq('lokasi', locationName)
        .maybeSingle();

      if (lokasiError) {
        throw new Error(lokasiError.message);
      }

      if (existingLokasi) {
        lokasiId = existingLokasi.id;
      } else {
        const { data: insertedLokasi, error: insertLokasiError } = await supabase
          .from('lokasi')
          .insert([{ lokasi: locationName }])
          .select('id')
          .single();

        if (insertLokasiError || !insertedLokasi) {
          throw new Error(insertLokasiError?.message ?? 'Failed to add a new location.');
        }

        lokasiId = insertedLokasi.id;
      }

      const coordinatesPayload = {
        latitude: Number(values.coordinates.latitude) || 0,
        longitude: Number(values.coordinates.longitude) || 0,
        location: locationName,
      };

      const { error: insertTreeError } = await supabase.from('data_pohon').insert([
        {
          jenis_pohon_id: jenisPohon.id,
          lokasi_id: lokasiId,
          coordinates: coordinatesPayload,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertTreeError) {
        throw new Error(insertTreeError.message);
      }

      navigate('/admin/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save tree data.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-geist-50 pb-16">
      <header className="border-b border-gray-200 bg-geist-50 backdrop-blur">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                  New Data Entry
                </p>
                <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
                  Tree Form 
                </h1>
                <p className="max-w-3xl text-sm text-gray-600">
                  Provide taxonomy details first, then set the location. Once saved, updates appear instantly on the Tree Management page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-4">

        <section>
          <div className="p-2 sm:py-5 sm:px-0">
            <TreeForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
              submitLabel="Save"
              cancelLabel="Cancel"
              isSubmitting={isSubmitting}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default AddTree;
