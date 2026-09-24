import type { AppState, DailyWorkout } from '@/types';

export const WORKOUT_IMPORT_FORMAT = 'my-keep-workout-history';

// Deduplicate by stable record ID, never by date; retain edits to imported records.
export function mergeWorkoutHistory(
  existing: DailyWorkout[], incoming: DailyWorkout[], activeWorkout?: DailyWorkout | null
): DailyWorkout[] {
  const seen = new Set([...existing.map((workout) => workout.id), ...(activeWorkout ? [activeWorkout.id] : [])]);
  return [...existing, ...incoming.filter((workout) => {
    if (seen.has(workout.id)) return false;
    seen.add(workout.id);
    return true;
  })];
}

export function withImportedWorkouts(state: AppState, incoming: DailyWorkout[]): AppState {
  return { ...state, workoutHistory: mergeWorkoutHistory(state.workoutHistory, incoming, state.dailyWorkout) };
}

export function getWorkoutsForDate(workouts: DailyWorkout[], date: string): DailyWorkout[] {
  return workouts.filter((workout) => workout.date === date);
}
