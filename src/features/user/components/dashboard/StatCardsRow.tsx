import { memo } from 'react';
import { Sprout, Trophy } from 'lucide-react';

type StatCardsRowProps = {
  treesScanned: number;
  rankLabel: string;
};

const StatCardsRow = memo(({ treesScanned, rankLabel }: StatCardsRowProps) => (
  <section className="px-4">
    <div className="flex space-x-2">
      <div className="w-full p-3 rounded-lg border border-gray-300 bg-white">
        <div className="flex items-center gap-2 ">
          <div className="bg-brand-100 p-2 rounded-lg">
            <Sprout strokeWidth={2.5} className="text-brand-500 w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{treesScanned}</span>
            <span className="text-sm text-gray-500">Trees Scanned</span>
          </div>
        </div>
      </div>
      <div className="w-full p-3 rounded-lg border border-gray-300 bg-white">
        <div className="flex items-center gap-2 ">
          <div className="bg-brand-100 p-2 rounded-lg">
            <Trophy strokeWidth={2.5} className="text-brand-500 w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{rankLabel}</span>
            <span className="text-sm text-gray-500">Rank</span>
          </div>
        </div>
      </div>
    </div>
  </section>
));

StatCardsRow.displayName = 'StatCardsRow';

export default StatCardsRow;
