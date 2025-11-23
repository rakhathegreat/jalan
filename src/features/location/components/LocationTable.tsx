import { SquarePen, Trash2 } from 'lucide-react';

import Button from '@shared/components/Button';
import { cn } from '@shared/lib/cn';

import type { LocationRow } from '../types/location';
import { formatLocationDate } from '../utils/location';

type LocationTableProps = {
  data: LocationRow[];
  onEdit: (row: LocationRow) => void;
  onDelete: (id: number) => void;
};

const LocationTable = ({ data, onEdit, onDelete }: LocationTableProps) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <table className="min-w-full border-separate border-spacing-0 text-sm text-gray-700">
      <thead
        className="
          font-geist text-sm text-gray-600
          [&_th]:px-6 [&_th]:py-4 [&_th]:font-normal [&_th]:bg-gray-50
          [&_th]:border-b [&_th]:border-gray-200
          [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg
        "
      >
        <tr>
          <th className="px-6 py-3 text-left">ID</th>
          <th className="px-6 py-3 text-left">Location</th>
          <th className="px-6 py-3 text-left">Created</th>
          <th className="px-6 py-3 text-left">Action</th>
        </tr>
      </thead>
      <tbody>
        {data.map((location, index) => (
          <tr
            key={location.id}
            className={cn(
              'border-t border-gray-100',
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
            )}
          >
            <td className="px-6 py-4 font-normal text-sm text-gray-900">{location.id}</td>
            <td className="px-6 py-4 text-sm font-normal text-gray-900">{location.lokasi}</td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {formatLocationDate(location.created_at)}
            </td>
            <td className="px-6 py-4 text-left">
              <div className="inline-flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(location)}
                  className="gap-2 px-4 font-normal"
                >
                  <SquarePen className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(location.id)}
                  className="gap-2 px-4 font-normal"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default LocationTable;
