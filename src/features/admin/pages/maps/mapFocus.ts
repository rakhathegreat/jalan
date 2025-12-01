export const MAP_FOCUS_STORAGE_KEY = 'adminMapFocus';

export type MapFocusPayload =
  | { type: 'roads'; roadId: string }
  | { type: 'reports'; reportId: number };

export type StoredMapFocusPayload = MapFocusPayload & { ts?: number };
