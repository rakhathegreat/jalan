import { memo, useMemo } from 'react';
import { Award, Star } from 'lucide-react';

import type { Mission } from '../../types/dashboard';

type MissionListProps = {
  missions: Mission[];
};

const MissionList = memo(({ missions }: MissionListProps) => {
  const progressList = useMemo(
    () =>
      missions.map((mission) => ({
        ...mission,
        pct: Math.min(100, Math.round((mission.progress / mission.goal) * 100)),
      })),
    [missions]
  );

  return (
    <section className="px-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-brand-700">Daily Missions</span>
        </div>
        <div>
          <div className="grid grid-cols-1 space-y-2">
            {progressList.map(({ id, title, progress, goal, reward_points, pct }) => (
              <div key={id} className="bg-white border border-gray-300 flex flex-col rounded-lg p-4 space-y-2">
                <div className="flex gap-3 items-center">
                  <div>
                    <div className="bg-brand-100 p-5 rounded-lg">
                      <Award strokeWidth={2.5} className="text-brand-500 w-7 h-7" />
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <span className="text-sm font-medium text-brand-700">{title}</span>
                    <div className="flex items-center gap-3">
                      <div
                        className="relative flex-1 h-1 rounded-full bg-brand-50 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-brand-600">
                        {progress}/{goal}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-xs inline-flex bg-brand-100 gap-1 items-center text-brand-700 font-medium py-1 px-3 rounded-full">
                        <Star fill="#2d4f3d" strokeWidth={2.5} className="w-3 h-3" />
                        {reward_points} points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

MissionList.displayName = 'MissionList';

export default MissionList;
