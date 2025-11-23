import type { ReactNode } from 'react';
import { CalendarDays, LocateFixed, MapPin, QrCode, SquarePen, Trash } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import type { Tree } from '@features/trees/types';

type TreeCardMode = 'field' | 'classification';

type TreeCardProps = {
  tree: Tree;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewQr: (id: string) => void;
  mode?: TreeCardMode;
  className?: string;
};

type MetaChipProps = {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

const MetaChip = ({ icon, children, className }: MetaChipProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600',
      className
    )}
  >
    <span className="text-gray-400">{icon}</span>
    {children}
  </span>
);

type ActionButtonProps = {
  onClick: () => void;
  children: ReactNode;
  variant?: 'default' | 'danger';
  label: string;
};

const ActionButton = ({
  onClick,
  children,
  variant = 'default',
  label,
}: ActionButtonProps) => {
  const palette =
    variant === 'danger'
      ? 'border-red-200 text-red-600 hover:bg-red-50 focus-visible:ring-red-500'
      : 'border-gray-300 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700 focus-visible:ring-brand-600';

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        palette
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
};

const truncateId = (value: string) =>
  value.length <= 12 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;

const formatCreatedDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const TreeCard = ({
  tree,
  onDelete,
  onEdit,
  onViewQr,
  mode = 'field',
  className = '',
}: TreeCardProps) => {
  const coordinates = `${tree.coordinates.latitude}, ${tree.coordinates.longitude}`;
  const isFieldMode = mode === 'field';

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-4',
        className
      )}
    >

      <header className="flex gap-3 pt-1 flex-row items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-gray-900">{tree.common_name}</h2>
          <p className="text-sm italic text-gray-500">{tree.scientific_name}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
          <span className="text-xs uppercase text-brand-500">ID</span>
          {truncateId(tree.id)}
        </span>
      </header>

      <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-600">
        {isFieldMode ? (
          <>
            <MetaChip icon={<MapPin className="h-3.5 w-3.5" />}>
              {tree.coordinates.location}
            </MetaChip>
            <MetaChip icon={<LocateFixed className="h-3.5 w-3.5" />}>
              <span className="font-mono text-[11px]">{coordinates}</span>
            </MetaChip>
            <MetaChip icon={<CalendarDays className="h-3.5 w-3.5" />}>
              {formatCreatedDate(tree.created_at)}
            </MetaChip>
          </>
        ) : (
          <>
            <MetaChip icon={<MapPin className="h-3.5 w-3.5" />}>
              <span className="text-[10px] uppercase text-gray-400">Family</span>
              <span className="font-medium text-gray-700">{tree.taxonomy.family || '-'}</span>
            </MetaChip>
            <MetaChip icon={<LocateFixed className="h-3.5 w-3.5" />}>
              <span className="text-[10px] uppercase text-gray-400">Genus</span>
              <span className="font-medium text-gray-700">{tree.taxonomy.genus || '-'}</span>
            </MetaChip>
            <MetaChip icon={<CalendarDays className="h-3.5 w-3.5" />}>
              <span className="text-[10px] uppercase text-gray-400">Species</span>
              <span className="font-medium text-gray-700">{tree.taxonomy.species || '-'}</span>
            </MetaChip>
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {isFieldMode && (
          <ActionButton onClick={() => onViewQr(tree.id)} label="View QR">
            <QrCode className="h-4 w-4" />
          </ActionButton>
        )}
        <ActionButton onClick={() => onEdit(tree.id)} label="Edit tree">
          <SquarePen className="h-4 w-4" />
        </ActionButton>
        <ActionButton
          variant="danger"
          onClick={() => onDelete(tree.id)}
          label="Delete tree"
        >
          <Trash className="h-4 w-4" />
        </ActionButton>
      </div>
    </article>
  );
};

export default TreeCard;
