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
  const annotations = [set.warmup ? '热身' : '', set.restSeconds === undefined ? '' : `休息 ${set.restSeconds} 秒`].filter(Boolean);
  const annotate = (text: string) => annotations.length > 0 ? `${text}（${annotations.join(' · ')}）` : text;
  if (set.reps === null) return annotate('未填写');
  if (set.weightMode === 'not_displayed' || exercise.recordingMode === 'reps-only') return annotate(`${set.reps} 次`);
  const unit = set.weightUnit === null ? '单位未记' : set.weightUnit ?? weightUnit;
  const leftRight = set.weightUnit !== undefined
    ? set.leftWeight !== undefined || set.rightWeight !== undefined : exercise.useLeftRight;
  const load = exercise.volumeMode === 'assisted-bodyweight'
    ? `${exercise.bodyWeightKg === undefined ? '体重未记录' : `体重 ${exercise.bodyWeightKg} kg`} / 辅助 ${set.weight ?? 0} ${set.weightUnit === undefined ? 'kg' : unit}`
    : exercise.recordingMode === 'additional-weight' || set.weightMode === 'additional_to_bodyweight'
    ? `附加 ${set.weight ?? 0} ${unit}`
    : leftRight
    ? `左 ${set.leftWeight ?? 0} / 右 ${set.rightWeight ?? 0} ${unit}`
    : `${set.weight ?? 0} ${unit}`;
  return annotate(`${load} × ${set.reps} 次`);
}

export function formatExerciseSummary(
  exercise: Pick<Exercise, 'sets' | 'recordingMode' | 'volumeMode' | 'bodyWeightKg'>,
  weightUnit: 'kg' | 'lbs'
): string {
  if (exercise.recordingMode === 'reps-only') {
    return `${exercise.sets.filter((set) => set.completed).reduce((sum, set) => sum + (set.reps ?? 0), 0)} 次`;
  }
  const volume = calculateVolume(exercise, weightUnit);
  if (exercise.sets.some((set) => set.weightUnit === null && set.weightMode === 'numeric_load_without_displayed_unit')) {
    return volume > 0 ? `${volume.toLocaleString()} kg（部分单位未记）` : '单位未记，未计容量';
  }
  if (exercise.volumeMode === 'assisted-bodyweight' && exercise.bodyWeightKg === undefined) return '体重未记录，未计容量';
  const prefix = exercise.recordingMode === 'additional-weight' ? '附加负重容量 ' : '';
  return `${prefix}${volume.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
}
