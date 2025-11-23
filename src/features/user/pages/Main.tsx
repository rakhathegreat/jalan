import { useMemo } from 'react';

import BottomNav from '@features/user/components/BottomNav';
import MissionList from '@features/user/components/dashboard/MissionList';
import RecentBadges from '@features/user/components/dashboard/RecentBadges';
import StatCardsRow from '@features/user/components/dashboard/StatCardsRow';
import LevelProgressCard from '@features/user/components/dashboard/LevelProgressCard';
import WelcomeHeader from '@features/user/components/dashboard/WelcomeHeader';
import { DASHBOARD_METRICS, DASHBOARD_USER, DAILY_MISSIONS, RECENT_BADGES } from '@features/user/data/dashboard';
import { useAuthUser } from '@features/user/hooks/useAuthUser';
import { useScanStats } from '@features/user/hooks/useScanStats';
import { getNextLevelProgress } from '@features/user/utils/progress';

function Main() {
  const { user } = useAuthUser();
  const { totalCount: scanCount } = useScanStats(user?.id);

  const displayName = useMemo(
    () =>
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.user_metadata?.display_name ??
      user?.email ??
      'Explorer',
    [user]
  );

  const firstName = useMemo(() => displayName.split(' ')[0] || 'Explorer', [displayName]);
  const progressNextLevel = useMemo(
    () => getNextLevelProgress(DASHBOARD_USER.points, DASHBOARD_USER.level),
    []
  );

  const treesScanned = scanCount ?? DASHBOARD_METRICS.treesScanned;

  return (
    <div className="min-h-screen bg-brand-50 ">
      <div className="space-y-4 py-4">
        <WelcomeHeader firstName={firstName} points={DASHBOARD_USER.points} />
        <LevelProgressCard
          level={DASHBOARD_USER.level}
          points={DASHBOARD_USER.points}
          target={progressNextLevel.target}
          pct={progressNextLevel.pct}
        />
        <StatCardsRow treesScanned={treesScanned} rankLabel={DASHBOARD_METRICS.rankLabel} />
        <RecentBadges badges={RECENT_BADGES} />
        <MissionList missions={DAILY_MISSIONS} />
        <section className="h-20" />
      </div>

      <BottomNav />
    </div>
  );
}

export default Main;
