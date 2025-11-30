import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { ChangeEvent, ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { FilterOptions, RoadFilters } from '../hooks/useFilters';

type FilterGroupProps = {
  label: string;
  options: FilterOptions[keyof FilterOptions];
  selected: string[];
  onChange: (value: string | null) => void;
};

const FilterGroup = ({ label, options, selected, onChange }: FilterGroupProps) => {
  const value = selected[0] ?? 'all';
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      {options.length === 0 ? (
        <p className="text-xs text-gray-500">Data filter belum tersedia.</p>
      ) : (
        <Select
          value={value}
          onValueChange={(next) => onChange(next === 'all' ? null : next)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

type NumberFilterProps = {
  label: string;
  max: number;
  value: string[];
  onChange: (value: string | null) => void;
};

const NumberFilter = ({ label, max, value, onChange }: NumberFilterProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    if (!rawValue.trim()) {
      onChange(null);
      return;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;

    const normalized = Math.min(Math.max(Math.trunc(parsed), 0), max);
    onChange(String(normalized));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600">
        {label} <span className="text-gray-500">(maks {max})</span>
      </p>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value[0] ?? ''}
        onChange={handleChange}
        placeholder={`0-${max}`}
      />
    </div>
  );
};

type MapFilterProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RoadFilters;
  options: FilterOptions;
  onSelect: (key: keyof RoadFilters, value: string | null) => void;
  onReset: () => void;
  onApply: () => void;
  onCancel: () => void;
  hasActiveFilters: boolean;
  children: ReactNode;
};

export function MapFilter({
  open,
  onOpenChange,
  filters,
  options,
  onSelect,
  onReset,
  onApply,
  onCancel,
  hasActiveFilters,
  children,
}: MapFilterProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="w-[92vw] max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <DialogTitle>Filter ruas jalan</DialogTitle>
            <DialogDescription>
              Saring berdasarkan status, kondisi, jenis/tipe jalan, dan wilayah administratif.
            </DialogDescription>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FilterGroup
            label="Kondisi jalan"
            options={options.condition}
            selected={filters.condition}
            onChange={(value) => onSelect('condition', value)}
          />
          <FilterGroup
            label="Tipe jalan"
            options={options.tipeJalan}
            selected={filters.tipeJalan}
            onChange={(value) => onSelect('tipeJalan', value)}
          />
          <NumberFilter
            label="RT"
            max={94}
            value={filters.rt}
            onChange={(value) => onSelect('rt', value)}
          />
          <NumberFilter
            label="RW"
            max={19}
            value={filters.rw}
            onChange={(value) => onSelect('rw', value)}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 sm:flex-row sm:justify-end">
          <div className="flex flex-1 sm:flex-none gap-2">
            <Button
              variant="ghost"
              className="flex-1 sm:flex-none"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onReset}
              disabled={!hasActiveFilters}
            >
              Reset
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={onApply}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
