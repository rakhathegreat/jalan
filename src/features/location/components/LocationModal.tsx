import { useEffect, useState, type FormEvent } from 'react';

import Button from '@shared/components/Button';
import Input from '@shared/components/Input';

import { X } from 'lucide-react';

export type LocationModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (lokasi: string) => Promise<void> | void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  initialValue?: string;
};

const LocationModal = ({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
  initialValue = '',
}: LocationModalProps) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
  }, [initialValue, open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || isSubmitting) return;
    await onSubmit(value.trim());
    if (mode === 'create') {
      setValue('');
    }
  };

  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Edit Location' : 'Add New Location';
  const submitLabel = isEditMode ? 'Update' : 'Save';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium tracking-tight text-gray-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 hover:cursor-pointer"
            aria-label="Close add location modal"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <Input
            label="Location"
            placeholder="Example: Bandung City Park"
            value={value}
            onValueChange={setValue}
            disabled={isSubmitting}
            required
            className="rounded-lg border-gray-200 font-normal"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-32"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-40 font-normal" disabled={isSubmitting || !value.trim()}>
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationModal;
