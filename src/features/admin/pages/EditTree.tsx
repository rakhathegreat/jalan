import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import TreeForm from '@features/trees/components/TreeForm';
import type { Tree, TreeFormValues } from '@features/trees/types';
import { normalizeTreeForForm } from '@features/trees/utils/form';
import { supabase } from '@shared/services/supabase';

const EditTree = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<TreeFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('trees').select('*').eq('id', id).single();

      if (!isMounted) return;

      if (error) {
        alert(error.message);
        navigate('/admin/dashboard');
        return;
      }

      if (data) {
        setInitialValues(normalizeTreeForForm(data as Tree));
      }
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleSubmit = async (values: TreeFormValues) => {
    if (!id) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('trees').update(values).eq('id', id);
    setIsSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    navigate('/admin/dashboard');
  };

  if (!id) {
    return <p className="p-6">Invalid tree id.</p>;
  }

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!initialValues) {
    return <p className="p-6">Tree not found.</p>;
  }

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold">Edit Tree</h1>

      <TreeForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        submitLabel="Update Tree"
        cancelLabel="Cancel"
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EditTree;
