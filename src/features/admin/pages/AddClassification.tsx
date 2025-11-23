import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ClassificationTreeForm from '@features/trees/components/ClassificationTreeForm';
import type { TreeFormValues } from '@features/trees/types';
import { createTreeFormDefaults } from '@features/trees/utils/form';
import { supabase } from '@shared/services/supabase';

const AddClassification = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValues = useMemo(() => createTreeFormDefaults(), []);

  const handleSubmit = async (values: TreeFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        common_name: values.common_name.trim(),
        scientific_name: values.scientific_name.trim(),
        taxonomy: values.taxonomy,
        endemic: values.endemic,
        description: values.description,
        characteristics: values.characteristics,
      };

      const { error } = await supabase.from('jenis_pohon').insert([payload]);
      if (error) throw new Error(error.message);

      navigate('/admin/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save classification data.';
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
            <ClassificationTreeForm
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

export default AddClassification;
