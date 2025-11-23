import { SquarePen, Trash } from 'lucide-react';

import type { LocationRow } from '@features/location/types/location';
import { formatLocationDate } from '@features/location/utils/location';
import { cn } from '@shared/lib/cn';

export type LocationCardProps = {
  location: LocationRow;
  onEdit: (row: LocationRow) => void;
  onDelete: (id: number) => void;
  className?: string;
};

export default function LocationCard({ location, onEdit, onDelete, className }: LocationCardProps) {
  return (
    <article className={cn('rounded-2xl border border-gray-200 bg-white p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium text-gray-900">{location.lokasi}</p>
          <p className="text-xs text-gray-500">Added {formatLocationDate(location.created_at)}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
          <span className="text-xs text-brand-500">ID</span>
          {location.id}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          onClick={() => onEdit(location)}
        >
          <SquarePen className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 p-3 text-xs font-semibold text-red-600 hover:bg-red-50"
          onClick={() => onDelete(location.id)}
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
