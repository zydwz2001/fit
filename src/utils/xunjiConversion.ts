import type { DailyWorkout, Exercise, Set as ExerciseSet } from '@/types';
import { calculateVolume } from './constants';
import { resolveExerciseByName } from './exerciseCatalog';
import { WORKOUT_IMPORT_FORMAT } from './workoutImport';

interface PageSet extends Record<string, unknown> {
  index: number;
  setLabel: string;
  reps: number | null;
  completed: boolean;
  warmup: boolean;
  weight?: number;
  leftWeight?: number;
  rightWeight?: number;
  weightUnit?: 'kg' | 'lbs' | null;
  weightMode?: ExerciseSet['weightMode'];
  restSeconds?: number;
  sourcePage: string;
  emptyDisplayedSet?: boolean;
}
interface PageExercise extends Record<string, unknown> {
  name: string;
  sets: PageSet[];
  notes?: string[];
  durationSeconds?: number;
}
interface PageWorkout extends Record<string, unknown> {
  ordinal: number;
  date: string;
  title?: string | null;
  category: 'strength' | 'cardio';
  exercises: PageExercise[];
  durationMinutes?: number;
  durationSeconds?: number;
}
export interface XunjiPageExport {
  schemaVersion: number;
  method: string;
  sourceApp: string;
  workoutCount: number;
  workouts: PageWorkout[];
}

export function convertXunjiPageExport(data: XunjiPageExport, archiveId: string) {
  if (data.schemaVersion !== 1 || data.method !== 'visible_app_pages' || data.sourceApp !== '训记' ||
      data.workoutCount !== data.workouts.length || !/^[a-zA-Z0-9-]+$/.test(archiveId)) {
    throw new Error('Unsupported or incomplete page export');
  }
  const workouts: DailyWorkout[] = data.workouts.map((original) => {
    const id = `xunji-${archiveId}-${original.ordinal}-${original.date}`;
    const exercises: Exercise[] = original.exercises.map((pageExercise, exerciseIndex) => {
      const definition = resolveExerciseByName(pageExercise.name);
      if (!definition) throw new Error(`Unmapped exercise: ${pageExercise.name}`);
      const sets: ExerciseSet[] = pageExercise.sets.map((pageSet) => ({
        id: `${id}-e${exerciseIndex + 1}-s${pageSet.index}`,
        reps: pageSet.reps, completed: pageSet.completed,
        weight: pageSet.weight, leftWeight: pageSet.leftWeight, rightWeight: pageSet.rightWeight,
        weightUnit: pageSet.weightUnit ?? null, weightMode: pageSet.weightMode,
        warmup: pageSet.warmup, restSeconds: pageSet.restSeconds,
        sourceLabel: pageSet.setLabel, sourcePage: pageSet.sourcePage,
        emptyDisplayedSet: pageSet.emptyDisplayedSet,
      }));
      // Historical modes follow what was displayed, not the catalog's new-workout defaults.
      const recordingMode = sets.length > 0 && sets.every((set) => set.weightMode === 'not_displayed')
        ? 'reps-only'
        : sets.some((set) => set.weightMode === 'additional_to_bodyweight') ? 'additional-weight' : undefined;
      return {
        ...definition, sets, sourceName: pageExercise.name, notes: pageExercise.notes ?? [],
        recordingMode, bodyWeightKg: undefined,
        useLeftRight: sets.some((set) => set.leftWeight !== undefined || set.rightWeight !== undefined),
        durationMinutes: pageExercise.durationSeconds === undefined ? undefined : pageExercise.durationSeconds / 60,
      };
    });
    if (new Set(exercises.map((exercise) => exercise.id)).size !== exercises.length) {
      throw new Error(`Multiple source movements map to one exercise in record ${original.ordinal}`);
    }
    return {
      id, date: original.date,
      name: original.title?.trim() || `训记 · ${original.category === 'cardio' ? exercises[0]?.name ?? '有氧' : '训练'} #${original.ordinal}`,
      exercises,
      totalVolume: exercises.reduce((sum, exercise) => sum + calculateVolume(exercise), 0),
      muscleGroups: [...new Set(exercises.map((exercise) => exercise.muscleGroup))],
      cardioName: exercises.find((exercise) => exercise.category === 'cardio')?.name,
      durationMinutes: original.durationMinutes ?? (original.durationSeconds === undefined ? undefined : original.durationSeconds / 60),
      source: { app: 'xunji', recordId: id, original },
    };
  });
  if (new Set(workouts.map((workout) => workout.id)).size !== workouts.length) throw new Error('Duplicate source record IDs');
  return { format: WORKOUT_IMPORT_FORMAT, version: 1, mode: 'merge', sourceArchiveId: archiveId, data: { workoutHistory: workouts } };
}
