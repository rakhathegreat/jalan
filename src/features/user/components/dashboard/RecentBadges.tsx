import { memo } from 'react';

import type { BadgeMeta } from '../../types/dashboard';

type RecentBadgesProps = {
  badges: BadgeMeta[];
};

const RecentBadges = memo(({ badges }: RecentBadgesProps) => (
  <section className="px-4">
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-brand-700">Recent Badges</span>
        <span className="text-sm font-medium text-brand-700">View All</span>
      </div>
      <div>
        <div className="grid grid-cols-4 space-x-2">
          {badges.map(({ id, icon: Icon, name: _name }) => (
            <div key={id} className="bg-white border border-gray-300 flex flex-col rounded-lg px-2 py-4 space-y-2">
              <div className="flex justify-center">
                <div className="bg-gradient-to-bl from-brand-500 to-brand-600 p-4 rounded-full">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              {/* <span className='text-[13px] text-center font-medium text-brand-700'>{name}</span> */}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
));

RecentBadges.displayName = 'RecentBadges';

export default RecentBadges;
