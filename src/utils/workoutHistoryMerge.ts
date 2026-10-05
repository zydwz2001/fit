import type { DailyWorkout, Exercise, Set as ExerciseSet } from '@/types';

export interface WorkoutHistoryMergeResult {
  workoutHistory: DailyWorkout[];
  merged: {
    date: string;
    recordId: string;
    sourceRecordIds: string[];
    exerciseCount: number;
    setCount: number;
  }[];
  skipped: {
    date: string;
    recordIds: string[];
    reason: 'incompatible-exercise-metadata';
    exerciseIds: string[];
  }[];
}

export function getWorkoutRecordIds(workout: DailyWorkout): string[] {
  return [...new Set([workout.id, ...(workout.mergedFrom ?? []).map((original) => original.id)])];
}

const recordingFields = [
  'name', 'muscleGroup', 'category', 'useLeftRight', 'recordingMode',
  'volumeMode', 'bodyWeightKg', 'durationMinutes', 'distanceKm', 'intensity',
] as const;

function hasCompatibleRecording(left: Exercise, right: Exercise): boolean {
  // Cardio time/distance belongs to each activity, not to sets. Combining such
  // entries would need a separate representation to preserve both activities.
  if (left.category === 'cardio' || right.category === 'cardio') return false;
  return recordingFields.every((field) => left[field] === right[field]);
}

function appendSets(existing: ExerciseSet[], incoming: ExerciseSet[], recordId: string): ExerciseSet[] {
  const seen = new Set(existing.map((set) => set.id));
  return [...existing, ...incoming.map((set, index) => {
    let id = set.id;
    let suffix = 0;
    while (seen.has(id)) {
      id = `${set.id}--merged-${encodeURIComponent(recordId)}-${index + 1}-${suffix++}`;
    }
    seen.add(id);
    return id === set.id ? set : { ...set, id };
  })];
}

function mergeExercises(workouts: DailyWorkout[]): { exercises: Exercise[]; incompatible: string[] } {
  const exercises: Exercise[] = [];
  const positions = new Map<string, number>();
  const incompatible = new Set<string>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const position = positions.get(exercise.id);
      if (position === undefined) {
        positions.set(exercise.id, exercises.length);
        exercises.push(exercise);
        continue;
      }
      const previous = exercises[position];
      if (!hasCompatibleRecording(previous, exercise)) {
        incompatible.add(exercise.id);
        continue;
      }
      exercises[position] = {
        ...previous,
        ...(previous.gifUrl === undefined && exercise.gifUrl !== undefined ? { gifUrl: exercise.gifUrl } : {}),
        sets: appendSets(previous.sets, exercise.sets, workout.id),
        ...(previous.notes || exercise.notes ? { notes: [...(previous.notes ?? []), ...(exercise.notes ?? [])] } : {}),
        ...(previous.aliases || exercise.aliases ? { aliases: [...new Set([...(previous.aliases ?? []), ...(exercise.aliases ?? [])])] } : {}),
      };
    }
  }
  return { exercises, incompatible: [...incompatible] };
}

/** Merge only an unambiguous local/Xunji pair; never infer duplicate exercises or sets by content. */
export function mergeCrossSourceWorkoutHistory(history: DailyWorkout[]): WorkoutHistoryMergeResult {
  const merged: WorkoutHistoryMergeResult['merged'] = [];
  const skipped: WorkoutHistoryMergeResult['skipped'] = [];
  // A restored backup may contain a merged record alongside its original source records.
  const absorbedIds = new Set(history.flatMap((workout) =>
    (workout.mergedFrom ?? []).map((original) => original.id)
  ));
  const retained = history.filter((workout) => workout.mergedFrom?.length || !absorbedIds.has(workout.id));
  const byDate = new Map<string, DailyWorkout[]>();
  for (const workout of retained) {
    const records = byDate.get(workout.date) ?? [];
    records.push(workout);
    byDate.set(workout.date, records);
  }

  const replacements = new Map<string, DailyWorkout>();
  const removedIds = new Set<string>();
  for (const [date, records] of byDate) {
    if (records.length !== 2 || records.some((record) => record.mergedFrom?.length)) continue;
    const xunji = records.filter((record) => record.source?.app === 'xunji');
    const local = records.filter((record) => record.source?.app !== 'xunji');
    if (xunji.length !== 1 || local.length !== 1 || xunji[0].id === local[0].id) continue;
    const originals = [local[0], xunji[0]];
    const { exercises, incompatible } = mergeExercises(originals);
    if (incompatible.length) {
      skipped.push({ date, recordIds: originals.map((record) => record.id), reason: 'incompatible-exercise-metadata', exerciseIds: incompatible });
      continue;
    }
    const workout: DailyWorkout = {
      ...local[0],
      name: '训练记录',
      exercises,
      totalVolume: local[0].totalVolume + xunji[0].totalVolume,
      muscleGroups: [...new Set(originals.flatMap((record) => record.muscleGroups))],
      mergedFrom: structuredClone(originals),
    };
    // A partial source duration is not the duration of the combined workout.
    if (originals.every((record) => record.durationMinutes !== undefined)) {
      workout.durationMinutes = originals.reduce((sum, record) => sum + record.durationMinutes!, 0);
    } else {
      delete workout.durationMinutes;
    }
    replacements.set(local[0].id, workout);
    removedIds.add(xunji[0].id);
    merged.push({
      date, recordId: workout.id, sourceRecordIds: originals.map((record) => record.id),
      exerciseCount: exercises.length, setCount: exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
    });
  }
  const workoutHistory = retained.filter((workout) => !removedIds.has(workout.id))
    .map((workout) => replacements.get(workout.id) ?? workout);
  return {
    workoutHistory: workoutHistory.length === history.length && workoutHistory.every((workout, index) => workout === history[index])
      ? history : workoutHistory,
    merged,
    skipped,
  };
}
