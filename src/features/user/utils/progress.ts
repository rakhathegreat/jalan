export const getNextLevelProgress = (points: number, level: number) => {
  const target = 500 * (level + 1);
  const pct = Math.min(100, Math.round((points / target) * 100));
  return { pct, target };
};
