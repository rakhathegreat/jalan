import { Button } from '@/components/ui/button';
import { Box, Expand, ListFilter, MapIcon, Minus, MousePointer2, Plus, Search } from 'lucide-react';
import type { FilterOptions, RoadFilters } from '../hooks/useFilters';
import { MapFilter } from './MapFilter';
import type { MapMode } from '../types';

type MapControlsProps = {
  mapMode: MapMode;
  onModeChange: (mode: MapMode) => void;
  mapReady: boolean;
  onSearch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  hoverEnabled: boolean;
  onToggleHover: () => void;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  filters: RoadFilters;
  filterOptions: FilterOptions;
  onSelectFilter: (key: keyof RoadFilters, value: string | null) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
  onCancelFilters: () => void;
  hasActiveFilters: boolean;
};

export const MapControls = ({
  mapMode,
  onModeChange,
  mapReady,
  onSearch,
  onZoomIn,
  onZoomOut,
  onReset,
  hoverEnabled,
  onToggleHover,
  filterOpen,
  onFilterOpenChange,
  filters,
  filterOptions,
  onSelectFilter,
  onResetFilters,
  onApplyFilters,
  onCancelFilters,
  hasActiveFilters,
}: MapControlsProps) => (
  <>
    <div className="absolute flex flex-col gap-2 p-2 top-0 right-0 z-30">
      <div className="flex flex-col p-1 bg-white rounded-sm shadow-md">
        <button
          className="flex items-center justify-center py-2 rounded-sm text-gray-900 hover:bg-white"
          onClick={onSearch}
          aria-label="Buka pencarian jalan"
          disabled={!mapReady}
        >
          <Search strokeWidth={2.5} className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col p-1 bg-white rounded-sm shadow-md">
        <button
          className={`rounded-xs p-2 ${mapMode === '3d' ? 'bg-geist-100 text-indigo-700' : 'hover:bg-white text-gray-300 hover:text-gray-900 cursor-pointer'}`}
          onClick={() => onModeChange('3d')}
          aria-pressed={mapMode === '3d'}
          aria-label="Aktifkan mode peta 3D"
        >
          <Box className="h-4.5 w-4.5" />
        </button>
        <button
          className={`rounded-xs p-2 ${mapMode === '2d' ? 'bg-geist-100 text-indigo-700' : 'hover:bg-white text-gray-300 hover:text-gray-900 cursor-pointer'}`}
          onClick={() => onModeChange('2d')}
          aria-pressed={mapMode === '2d'}
          aria-label="Aktifkan mode peta 2D"
        >
          <MapIcon className="h-4.5 w-4.5" />
        </button>
      </div>
      <div className="flex flex-col p-1 bg-white rounded-sm shadow-md">
        <button
          className={`flex items-center justify-center gap-2 py-2 px-2 rounded-sm text-xs font-medium ${
            hoverEnabled
              ? 'bg-geist-100 text-indigo-700'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={onToggleHover}
          aria-label="Toggle hover highlight"
          disabled={!mapReady}
        >
          <MousePointer2 strokeWidth={2.5} className="h-4 w-4" />
        </button>
      </div>
      <div className="relative flex flex-col p-1 bg-white rounded-sm shadow-md">
        <MapFilter
          open={filterOpen}
          onOpenChange={onFilterOpenChange}
          filters={filters}
          options={filterOptions}
          onSelect={onSelectFilter}
          onReset={onResetFilters}
          onApply={onApplyFilters}
          onCancel={onCancelFilters}
          hasActiveFilters={hasActiveFilters}
        >
          <button
            type="button"
            className="relative flex items-center justify-center gap-2 py-2 px-2 rounded-sm text-xs font-medium"
            aria-label="Filter ruas jalan"
            aria-pressed={filterOpen}
            disabled={!mapReady}
          >
            <ListFilter strokeWidth={2.5} className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-700" />
            )}
          </button>
        </MapFilter>
      </div>
    </div>

    <div className="absolute p-2 bottom-0 right-0 z-30 space-y-2">
      <div className="flex flex-col bg-white rounded-sm shadow-md">
        <Button
          variant="ghost"
          className="rounded-sm text-gray-900 hover:bg-white"
          onClick={onZoomIn}
          aria-label="Perbesar peta"
          disabled={!mapReady}
        >
          <Plus strokeWidth={2.5} className="h-4.5 w-4.5" />
        </Button>
        <Button
          variant="ghost"
          className="rounded-sm text-gray-900 hover:bg-white"
          onClick={onZoomOut}
          aria-label="Perkecil peta"
          disabled={!mapReady}
        >
          <Minus strokeWidth={2.5} className="h-4.5 w-4.5" />
        </Button>
      </div>
      <div className="flex flex-col p-1 bg-white rounded-sm shadow-md">
        <button
          className="flex items-center justify-center py-2 rounded-sm text-gray-900 hover:bg-white"
          onClick={onReset}
          aria-label="Kembali ke titik awal"
          disabled={!mapReady}
        >
          <Expand strokeWidth={2.5} className="h-4 w-4" />
        </button>
      </div>
    </div>
  </>
);
