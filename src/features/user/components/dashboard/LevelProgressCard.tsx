import { memo } from 'react';

type LevelProgressCardProps = {
  level: number;
  points: number;
  target: number;
  pct: number;
};

const LevelProgressCard = memo(({ level, points, target, pct }: LevelProgressCardProps) => (
  <section className="h-32 px-4">
    <header className="flex flex-col justify-center h-full rounded-xl bg-gradient-to-bl from-brand-500 to-brand-600 bg-brand-700 px-4 space-y-4">
      <div className="flex w-full justify-between">
        <div className="flex flex-col">
          <span className="text-white/80 text-sm">Current Level</span>
          <span className="text-white text-2xl font-semibold">Tree Explorer</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-white/20 px-5 rounded-lg">
          <span className="text-white text-2xl font-semibold">{level}</span>
        </div>
      </div>
      <div className="flex items-center space-x-3 w-full">
        <div
          className="relative flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[11px] font-normal whitespace-nowrap text-white/80">
            {points}/{target} XP
          </span>
        </div>
      </div>
    </header>
  </section>
));

LevelProgressCard.displayName = 'LevelProgressCard';

export default LevelProgressCard;
