import type { LucideIcon } from 'lucide-react';

export type PermissionState = 'granted' | 'denied' | 'prompt';

export type NearbyTree = {
  id: string;
  common_name: string;
  species?: string;
  lat: number;
  lng: number;
  distance_m?: number;
};

export type Mission = {
  id: string;
  title: string;
  type: 'daily' | 'event' | 'species';
  progress: number;
  goal: number;
  reward_points: number;
  ends_at?: string;
};

export type RewardTeaser = {
  id: string;
  name: string;
  cost_points: number;
  can_redeem: boolean;
};

export type ActivityItem = {
  id: string;
  type: 'scan' | 'badge' | 'mission';
  title: string;
  ts: string;
  delta_points?: number;
};

export type BadgeMeta = {
  id: string;
  name: string;
  icon: LucideIcon;
  points: number;
};

export type DashboardUser = {
  id: string;
  points: number;
  streak_days: number;
  level: number;
  badges_count: number;
};
