import type { AppState } from '@/types';
import { mergeCrossSourceWorkoutHistory } from './workoutHistoryMerge';

export const HISTORY_MERGE_BACKUP_KEY = 'vibe-fitness-history-before-cross-source-merge-v1';

// Keep the live pre-migration state on this device. Source record snapshots also
// travel with the merged record in normal exports. Never overwrite the first backup.
export function migrateSavedWorkoutHistory(
  saved: Partial<AppState>, storage: Storage = localStorage,
): Partial<AppState> {
  const result = mergeCrossSourceWorkoutHistory(saved.workoutHistory ?? []);
  if (result.workoutHistory === saved.workoutHistory || !saved.workoutHistory) return saved;
  try {
    if (storage.getItem(HISTORY_MERGE_BACKUP_KEY) === null) {
      storage.setItem(HISTORY_MERGE_BACKUP_KEY, JSON.stringify(saved));
    }
  } catch {
    return saved;
  }
  return { ...saved, workoutHistory: result.workoutHistory };
}
