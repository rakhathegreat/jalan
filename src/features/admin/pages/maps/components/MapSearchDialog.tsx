import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';
import { forwardRef, memo, useMemo } from 'react';
import type { RoadRow, RecentSearchItem } from '../types';
import { getRoadPrimaryLabel, getRoadSecondaryLabel } from '../mapHelpers';

type MapSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  searchResults: RoadRow[];
  recentSearches: RecentSearchItem[];
  onSelectRoad: (road: RoadRow) => void;
  findRoadById: (id: string) => RoadRow | null;
};

const MapSearchDialogComponent = forwardRef<HTMLInputElement, MapSearchDialogProps>(
  (
    {
      open,
      onOpenChange,
      searchTerm,
      onSearchTermChange,
      searchResults,
      recentSearches,
      onSelectRoad,
      findRoadById,
    },
    searchInputRef
  ) => {
    const trimmedSearchTerm = searchTerm.trim();

    const resolvedRecentSearches = useMemo(
      () =>
        recentSearches.map((item) => {
          const road = findRoadById(item.id);
          return {
            id: item.id,
            label: road ? getRoadPrimaryLabel(road) : item.label,
            secondary: road ? getRoadSecondaryLabel(road) : item.secondary,
            road,
          };
        }),
      [findRoadById, recentSearches]
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="w-full max-h-[75vh] overflow-y-auto max-w-2xl gap-0 p-0 pb-2 border bg-background shadow-2xl sm:rounded-lg">
          <div className="sticky top-0 z-10 bg-white flex items-center border-b border-gray-200 px-3">
            <SearchIcon strokeWidth={2.5} className="w-4 h-4 text-gray-500" />
            <Input
              ref={searchInputRef}
              placeholder="Search road name, address, or OSM ID ..."
              className="py-7 pr-6"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onOpenChange(false);
                  return;
                }
                if (e.key === 'Enter' && searchResults[0]) {
                  onSelectRoad(searchResults[0]);
                }
              }}
            />
            <span className="text-sm border border-gray-200 px-2 py-1 rounded-sm text-gray-500">
              esc
            </span>
          </div>
          <div className="flex flex-col overflow-y-auto flex-1 min-h-0 bg-white w-full p-4 space-y-2">
            {!trimmedSearchTerm ? (
              resolvedRecentSearches.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Ketik nama jalan, alamat, atau OSM ID untuk mencari ruas.
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Recent
                  </p>
                  {resolvedRecentSearches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-start justify-between gap-2 rounded-md border border-transparent px-3 py-2 text-left hover:border-gray-200 hover:bg-gray-50 focus:outline-none disabled:opacity-60"
                      onClick={() => item.road && onSelectRoad(item.road)}
                      disabled={!item.road}
                    >
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {item.secondary}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs text-gray-700">
                        Recent
                      </Badge>
                    </button>
                  ))}
                </>
              )
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada hasil ditemukan.</p>
            ) : (
              searchResults.map((road) => {
                const label = getRoadPrimaryLabel(road);
                const secondary = getRoadSecondaryLabel(road);
                return (
                  <button
                    key={road.id}
                    type="button"
                    className="flex w-full items-start justify-between gap-2 rounded-md border border-transparent px-3 py-2 text-left hover:border-gray-200 hover:bg-gray-50 focus:outline-none"
                    onClick={() => onSelectRoad(road)}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {secondary}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-700 uppercase">
                      {road.osm_id ? `${road.osm_id}` : 'OSM unknown'}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

MapSearchDialogComponent.displayName = 'MapSearchDialog';

export const MapSearchDialog = memo(MapSearchDialogComponent);
MapSearchDialog.displayName = 'MapSearchDialog';
