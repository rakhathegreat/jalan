import { useEffect, useRef, useState } from 'react';
import { QrCode, SquarePen, Trash2, Archive, EllipsisVertical } from 'lucide-react';

import Button, { buttonVariants } from '@shared/components/Button';
import { cn } from '@shared/lib/cn';

import type { Tree } from '@features/trees/types';

type TreeTableMode = 'classification' | 'field';

type TreeTableProps = {
  data: Tree[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewQr: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkExport?: (ids: string[]) => void | Promise<void>;
  mode?: TreeTableMode;
  className?: string;
};


const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const actionButton = cn(
  buttonVariants({ variant: 'ghost', size: 'md' })
);

const TreeTable = ({
  data,
  onDelete,
  onEdit,
  onViewQr,
  onBulkDelete,
  onBulkExport,
  mode = 'field',
  className = '',
}: TreeTableProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => data.some((tree) => tree.id === id)));
  }, [data]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < data.length;
    }
  }, [selectedIds, data.length]);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpenId(null);
      setBulkMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) setSelectedIds([]);
    else setSelectedIds(data.map((tree) => tree.id));
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (onBulkDelete) await onBulkDelete(selectedIds);
    else selectedIds.forEach((id) => onDelete(id));
    setSelectedIds([]);
  };

  const handleBulkExport = async () => {
    if (!selectedIds.length) return;
    if (onBulkExport) await onBulkExport(selectedIds);
    else console.info('Export selected', selectedIds);
  };

  const hasSelection = selectedIds.length > 0;

  const renderActionCell = (tree: Tree) => (
    <td className="px-6 py-4">
      <div className="relative flex justify-end">
        <Button
          variant="ghost"
          size={'sm'}
          className={cn(actionButton, 'text-gray-700')}
          aria-label="More actions"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpenId((prev) => (prev === tree.id ? null : tree.id));
          }}
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
        {menuOpenId === tree.id && (
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-9 z-30 w-44 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
          >
            {mode === 'field' && (
              <button
                type="button"
                onClick={() => {
                  onViewQr(tree.id);
                  setMenuOpenId(null);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <QrCode className="h-4 w-4" />
                View QR
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onEdit(tree.id);
                setMenuOpenId(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <SquarePen className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(tree.id);
                setMenuOpenId(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </td>
  );

  const renderFieldColumns = (tree: Tree) => (
    <>
      <td className="px-6 py-4 font-mono text-xs text-gray-500">
        <span
          className="block max-w-[160px] truncate"
          title={tree.id}
        >
          {tree.id}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-900">{tree.common_name}</td>
      <td className="px-6 py-4 italic text-gray-500">{tree.scientific_name || '-'}</td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-900">{tree.coordinates.location}</p>
        <p className="text-xs text-gray-500">
          {tree.coordinates.latitude}, {tree.coordinates.longitude}
        </p>
      </td>
      <td className="px-6 py-4 text-sm font-normal text-gray-600">{formatDate(tree.created_at)}</td>
      {renderActionCell(tree)}
    </>
  );

  const renderClassificationColumns = (tree: Tree) => (
    <>
      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">
        {tree.id}
      </td>
      <td className="px-6 py-4 text-gray-900">{tree.common_name}</td>
      <td className="px-6 py-4 italic text-gray-500">{tree.scientific_name || '-'}</td>
      <td className="px-6 py-4 text-gray-900">{tree.taxonomy.family || '-'}</td>
      <td className="px-6 py-4 text-gray-900">{tree.taxonomy.genus || '-'}</td>
      <td className="px-6 py-4 text-gray-900">{tree.taxonomy.species || '-'}</td>
      {renderActionCell(tree)}
    </>
  );

  return (
    <div className={cn('overflow-x-visible rounded-lg border border-gray-300 bg-white', className)}>
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
            <th scope="col" className="w-12">
              <input
                ref={selectAllRef}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-brand-600 focus:ring-brand-500"
                checked={selectedIds.length === data.length && data.length > 0}
                onChange={toggleSelectAll}
                aria-label="Select all trees"
              />
            </th>
            {mode === 'field' ? (
              <>
                <th scope="col" className="text-left">
                  Tree ID
                </th>
                <th scope="col" className="text-left">
                  Common Name
                </th>
                <th scope="col" className="text-left">
                  Scientific Name
                </th>
                <th scope="col" className="text-left">
                  Location
                </th>
                <th scope="col" className="text-left">
                  Created
                </th>
              </>
            ) : (
              <>
                <th scope="col" className="text-left">
                  ID
                </th>
                <th scope="col" className="text-left">
                  Common Name
                </th>
                <th scope="col" className="text-left">
                  Scientific Name
                </th>
                <th scope="col" className="text-left">
                  Family
                </th>
                <th scope="col" className="text-left">
                  Genus
                </th>
                <th scope="col" className="text-left">
                  Species
                </th>
              </>
            )}
            <th scope="col" className="text-right">
              <div className="relative">
                <Button
                  variant="ghost"
                  size={'md'}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'gap-2')}
                  aria-label="Bulk actions"
                  onClick={(event) => {
                    event.stopPropagation();
                    setBulkMenuOpen((prev) => !prev);
                  }}
                >
                  <EllipsisVertical className="h-4.5 w-4.5" />
                </Button>
                {bulkMenuOpen && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="absolute right-0 top-9 z-40 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleBulkExport();
                        setBulkMenuOpen(false);
                      }}
                      disabled={!hasSelection}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      <Archive className="h-4 w-4" />
                      Export
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleBulkDelete();
                        setBulkMenuOpen(false);
                      }}
                      disabled={!hasSelection}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="
      [&_tr:not(:last-child)_td]:border-b [&_tr:not(:last-child)_td]:border-gray-200
    ">
          {data.map((tree) => {
            const checked = selectedIds.includes(tree.id);
            return (
              <tr key={tree.id} className={cn('hover:bg-gray-50', checked && 'bg-brand-50/60')}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-brand-600 focus:ring-brand-500"
                    checked={checked}
                    onChange={() => toggleSelect(tree.id)}
                    aria-label={`Select tree ${tree.common_name}`}
                  />
                </td>
                {mode === 'field' ? renderFieldColumns(tree) : renderClassificationColumns(tree)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TreeTable;
