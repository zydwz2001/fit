import type { AppState, Exercise } from '@/types';

function exerciseNames(exercise: Exercise): string[] {
  return [exercise.name, exercise.sourceName ?? '', ...(exercise.aliases ?? [])]
    .map((name) => name.normalize('NFKC').replace(/\s+/g, '').toLowerCase())
    .filter(Boolean);
}

/** Explicit cleanup only: even empty or unfinished workout entries count as use. */
export function curateHiddenExerciseLibrary(state: AppState): AppState {
  const recordedExercises = [
    ...state.workoutHistory.flatMap((workout) => workout.exercises),
    ...(state.dailyWorkout?.exercises ?? []),
  ];
  const usedIds = new Set(recordedExercises.map((exercise) => exercise.id));
  const usedNames = new Set(recordedExercises.flatMap(exerciseNames));
  const retained = state.exerciseLibrary.filter((exercise) =>
    !exercise.hidden || usedIds.has(exercise.id) ||
    exerciseNames(exercise).some((name) => usedNames.has(name))
  );
  const retainedIds = new Set(retained.map((exercise) => exercise.id));
  const deletedExerciseIds = [...new Set([
    ...(state.deletedExerciseIds ?? []),
    ...state.exerciseLibrary.filter((exercise) => !retainedIds.has(exercise.id)).map((exercise) => exercise.id),
  ])].filter((id) => !retainedIds.has(id));

  return {
    ...state,
    exerciseLibrary: retained.map((exercise) => ({ ...exercise, hidden: false })),
    deletedExerciseIds,
  };
}
