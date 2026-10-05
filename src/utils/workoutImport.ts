import type { AppState, DailyWorkout } from '@/types';
import { getWorkoutRecordIds, mergeCrossSourceWorkoutHistory } from './workoutHistoryMerge';

export const WORKOUT_IMPORT_FORMAT = 'my-keep-workout-history';

// Deduplicate by stable record ID (including merged sources), retaining local edits.
export function mergeWorkoutHistory(
  existing: DailyWorkout[], incoming: DailyWorkout[], activeWorkout?: DailyWorkout | null
): DailyWorkout[] {
  const seen = new Set([...existing.flatMap(getWorkoutRecordIds), ...(activeWorkout ? getWorkoutRecordIds(activeWorkout) : [])]);
  const result = [...existing];
  for (const workout of incoming) {
    // Import results may already be consolidated while the reducer still has the
    // original records. Add missing sources and keep the current source edits.
    const candidates = workout.mergedFrom?.length && getWorkoutRecordIds(workout).some((id) => seen.has(id))
      ? workout.mergedFrom : [workout];
    for (const candidate of candidates) {
      if (seen.has(candidate.id)) continue;
      result.push(candidate);
      getWorkoutRecordIds(candidate).forEach((id) => seen.add(id));
    }
  }
  return result;
}

export function countNewWorkoutRecords(
  existing: DailyWorkout[], incoming: DailyWorkout[], activeWorkout?: DailyWorkout | null
): number {
  return mergeWorkoutHistory(existing, incoming, activeWorkout).length - existing.length;
}

export function withImportedWorkouts(state: AppState, incoming: DailyWorkout[]): AppState {
  const imported = mergeWorkoutHistory(state.workoutHistory, incoming, state.dailyWorkout);
  return { ...state, workoutHistory: mergeCrossSourceWorkoutHistory(imported).workoutHistory };
}

export function getWorkoutsForDate(workouts: DailyWorkout[], date: string): DailyWorkout[] {
  return workouts.filter((workout) => workout.date === date);
}
