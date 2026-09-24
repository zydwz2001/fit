import { DEFAULT_EXERCISES, type Exercise, type Set as ExerciseSet } from '@/types';
import { calculateVolume } from './constants';

function normalizeName(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

/** Resolve only known names and aliases; equipment and posture variants stay separate. */
export function resolveExerciseByName(name: string, library = DEFAULT_EXERCISES): Exercise | undefined {
  const normalized = normalizeName(name);
  return library.find((exercise) =>
    [exercise.name, ...(exercise.aliases ?? [])].some((candidate) => normalizeName(candidate) === normalized)
  );
}

export function matchesExerciseQuery(exercise: Exercise, query: string): boolean {
  const normalized = normalizeName(query);
  return [exercise.name, exercise.muscleGroup, ...(exercise.aliases ?? [])]
    .some((candidate) => normalizeName(candidate).includes(normalized));
}

export function formatExerciseSet(
  exercise: Pick<Exercise, 'useLeftRight' | 'volumeMode' | 'bodyWeightKg' | 'recordingMode'>,
  set: ExerciseSet,
  weightUnit: 'kg' | 'lbs'
): string {
  if (exercise.recordingMode === 'reps-only') return `${set.reps} 次`;
  const load = exercise.volumeMode === 'assisted-bodyweight'
    ? `体重 ${exercise.bodyWeightKg ?? '未记录'} kg / 辅助 ${set.weight ?? 0} kg`
    : exercise.recordingMode === 'additional-weight'
    ? `附加 ${set.weight ?? 0} ${weightUnit}`
    : exercise.useLeftRight
    ? `左 ${set.leftWeight ?? 0} / 右 ${set.rightWeight ?? 0} ${weightUnit}`
    : `${set.weight ?? 0} ${weightUnit}`;
  return `${load} × ${set.reps} 次`;
}

export function formatExerciseSummary(
  exercise: Pick<Exercise, 'sets' | 'recordingMode' | 'volumeMode' | 'bodyWeightKg'>,
  weightUnit: 'kg' | 'lbs'
): string {
  if (exercise.recordingMode === 'reps-only') {
    return `${exercise.sets.filter((set) => set.completed).reduce((sum, set) => sum + set.reps, 0)} 次`;
  }
  const prefix = exercise.recordingMode === 'additional-weight' ? '附加负重容量 ' : '';
  return `${prefix}${calculateVolume(exercise, weightUnit).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
}
