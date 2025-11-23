import { Leaf, LocateFixed, Sparkles } from 'lucide-react';

import type { BadgeMeta, DashboardUser, Mission, NearbyTree } from '../types/dashboard';

export const DASHBOARD_USER: DashboardUser = {
  id: 'u1',
  points: 420,
  streak_days: 5,
  level: 2,
  badges_count: 6,
};

export const DASHBOARD_METRICS = {
  treesScanned: 247,
  rankLabel: '#1',
};

export const NEARBY_TREES: NearbyTree[] = [
  { id: 't1', common_name: 'Trembesi Lapangan', species: 'Samanea saman', lat: -6.8631, lng: 107.9236 },
  { id: 't2', common_name: 'Eboni Gerbang Utara', species: 'Diospyros celebica', lat: -6.8637, lng: 107.9241 },
  { id: 't3', common_name: 'Kesambi Barat', species: 'Schleichera oleosa', lat: -6.8629, lng: 107.9229 },
  { id: 't4', common_name: 'Puspa Plaza', species: 'Schima wallichii', lat: -6.864, lng: 107.9249 },
];

export const DAILY_MISSIONS: Mission[] = [
  { id: 'm1', title: 'Scan 3 spesies berbeda', type: 'daily', progress: 2, goal: 3, reward_points: 40 },
  { id: 'm2', title: 'Kunjungi hotspot Subang', type: 'event', progress: 0, goal: 1, reward_points: 50 },
  { id: 'm3', title: 'Baca 5 fakta botani', type: 'species', progress: 4, goal: 5, reward_points: 20 },
];

export const RECENT_BADGES: BadgeMeta[] = [
  { id: 'b2', name: 'Guardian Roots', icon: Sparkles, points: 20 },
  { id: 'b3', name: 'Tree Lover', icon: Leaf, points: 30 },
  { id: 'b4', name: 'Tree Whisperer', icon: LocateFixed, points: 40 },
  { id: 'b5', name: 'Soil Keeper', icon: Sparkles, points: 25 },
];
