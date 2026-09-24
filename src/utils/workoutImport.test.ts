import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appReducer } from '@/contexts/AppContext';
import { createInitialState } from './initialState';
import { importData, loadData } from './storage';
import { calculateVolume } from './constants';
import { formatExerciseSet } from './exerciseCatalog';
import { convertXunjiPageExport, type XunjiPageExport } from './xunjiConversion';
import { getWorkoutsForDate, withImportedWorkouts } from './workoutImport';

const pageExport = (): XunjiPageExport => ({
  schemaVersion: 1, method: 'visible_app_pages', sourceApp: '训记', workoutCount: 2,
  workouts: [1, 2].map((ordinal) => ({
    ordinal, date: '2024-03-10', category: 'strength', displayedVolumeKg: 999,
    exercises: [{ name: '杠铃划船', notes: ['来源备注'], sets: [
      { index: 1, setLabel: '1', reps: 2, completed: true, warmup: false, weight: 10, weightUnit: 'lbs', restSeconds: 60, sourcePage: 'page-1', rawValues: ['10', 'lbs', '2'] },
      { index: 2, setLabel: 'W', reps: 5, completed: true, warmup: true, weight: 50, weightUnit: 'kg', sourcePage: 'page-1' },
      { index: 3, setLabel: '3', reps: 8, completed: false, warmup: false, weight: 30, weightUnit: 'kg', sourcePage: 'page-2' },
      { index: 4, setLabel: '4', reps: 9, completed: true, warmup: false, weight: 35, weightUnit: null, weightMode: 'numeric_load_without_displayed_unit', sourcePage: 'page-2' },
    ] }],
  })),
});
const envelope = () => convertXunjiPageExport(pageExport(), 'test-archive');
const currentState = () => ({ ...createInitialState(), notes: [{ id: 'note', title: '原笔记', content: '保留', folderId: null, createdAt: 1, updatedAt: 1 }],
  bodyMetrics: [{ id: 'body', type: 'weight' as const, value: 50, date: '2024-03-10', timestamp: 1 }],
});

describe('incremental workout imports', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) });
  });

  it('adds both same-day workouts, preserves every other collection, and keeps local edits on reimport', async () => {
    const packet = envelope();
    const existing = { ...packet.data.workoutHistory[0], id: 'existing-workout' };
    const state = { ...currentState(), dailyWorkout: existing, workoutHistory: [existing] };
    const result = await importData(JSON.stringify(packet), state);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.kind).toBe('workouts');
    expect(result.addedCount).toBe(2);
    const next = appReducer(state, { type: 'IMPORT_WORKOUT_HISTORY', payload: result.data.workoutHistory! });
    expect(next).toEqual({ ...state, workoutHistory: [existing, ...packet.data.workoutHistory] });
    expect(await loadData()).toEqual(next);
    expect(getWorkoutsForDate(next.workoutHistory, '2024-03-10')).toHaveLength(3);
    next.workoutHistory[1] = { ...next.workoutHistory[1], name: '我的修改' };
    const again = await importData(JSON.stringify(packet), next);
    expect(again.success && again.addedCount).toBe(0);
    expect(again.success && again.data.workoutHistory).toEqual(next.workoutHistory);
  });

  it('does not duplicate a source ID already present in the active workout', () => {
    const workouts = envelope().data.workoutHistory;
    const state = { ...currentState(), dailyWorkout: workouts[0] };
    expect(withImportedWorkouts(state, workouts).workoutHistory).toEqual([workouts[1]]);
  });

  it('preserves original units and raw data and calculates only known completed non-warmup loads', () => {
    const packet = envelope();
    const workout = packet.data.workoutHistory[0];
    const exercise = workout.exercises[0];
    expect(workout.source?.original).toEqual(pageExport().workouts[0]);
    expect(workout.source?.original.displayedVolumeKg).toBe(999);
    expect(calculateVolume(exercise)).toBeCloseTo(9.0718474);
    expect(calculateVolume(exercise, 'lbs')).toBeCloseTo(9.0718474);
    expect(formatExerciseSet(exercise, exercise.sets[0], 'kg')).toContain('10 lbs × 2 次');
    expect(formatExerciseSet(exercise, exercise.sets[0], 'kg')).toContain('休息 60 秒');
    expect(formatExerciseSet(exercise, exercise.sets[1], 'kg')).toContain('热身');
    expect(formatExerciseSet(exercise, exercise.sets[3], 'kg')).toContain('35 单位未记 × 9 次');
    const state = withImportedWorkouts(currentState(), packet.data.workoutHistory);
    const changed = appReducer(state, { type: 'SET_WEIGHT_UNIT', payload: 'lbs' });
    expect(changed.workoutHistory).toEqual(state.workoutHistory);
    expect(convertXunjiPageExport(pageExport(), 'test-archive')).toEqual(packet);
  });

  it('rejects unsupported versions, invalid dates, duplicate IDs, and invalid sets without writing', async () => {
    const sentinel = JSON.stringify(currentState());
    localStorage.setItem('vibe-fitness-data', sentinel);
    const changes = [
      (packet: ReturnType<typeof envelope>) => { packet.version = 2; },
      (packet: ReturnType<typeof envelope>) => { packet.data.workoutHistory[0].date = '2024-02-30'; },
      (packet: ReturnType<typeof envelope>) => { packet.data.workoutHistory.push(packet.data.workoutHistory[0]); },
      (packet: ReturnType<typeof envelope>) => { packet.data.workoutHistory[0].exercises[0].sets[0].reps = -1; },
      (packet: ReturnType<typeof envelope>) => { packet.data.workoutHistory[0].exercises[0].sets[0].weightUnit = undefined; },
      (packet: ReturnType<typeof envelope>) => { packet.data.workoutHistory[0].source!.recordId = 'wrong'; },
    ];
    for (const change of changes) {
      const packet = envelope();
      change(packet);
      expect((await importData(JSON.stringify(packet), currentState())).success).toBe(false);
      expect(localStorage.getItem('vibe-fitness-data')).toBe(sentinel);
    }
    expect((await importData(JSON.stringify(envelope()))).success).toBe(false);
    expect('workoutHistory' in envelope()).toBe(false);
  });

  it('reports a storage failure instead of claiming the import succeeded', async () => {
    const sentinel = JSON.stringify(currentState());
    vi.stubGlobal('localStorage', { getItem: () => sentinel, setItem: () => { throw new Error('Quota exceeded'); } });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await importData(JSON.stringify(envelope()), currentState())).success).toBe(false);
      expect(localStorage.getItem('vibe-fitness-data')).toBe(sentinel);
    } finally { error.mockRestore(); }
  });

  it.runIf(Boolean(process.env.MY_KEEP_XUNJI_IMPORT_FILE))('imports all 225 actual records losslessly and repeatably', async () => {
    const file = readFileSync(process.env.MY_KEEP_XUNJI_IMPORT_FILE!, 'utf8');
    const packet = JSON.parse(file);
    const state = currentState();
    const result = await importData(file, state);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.addedCount).toBe(225);
    const next = appReducer(state, { type: 'IMPORT_WORKOUT_HISTORY', payload: result.data.workoutHistory! });
    const workouts = next.workoutHistory;
    const exercises = workouts.flatMap(workout => workout.exercises);
    const sets = exercises.flatMap(exercise => exercise.sets);
    expect(exercises).toHaveLength(827);
    expect(sets).toHaveLength(2847);
    expect(sets.filter(set => set.warmup)).toHaveLength(6);
    expect(sets.filter(set => !set.completed)).toHaveLength(197);
    expect(sets.filter(set => set.weightUnit === 'lbs')).toHaveLength(207);
    expect(sets.filter(set => set.weightMode === 'numeric_load_without_displayed_unit')).toHaveLength(135);
    expect(workouts.filter(workout => workout.exercises.length === 0)).toHaveLength(2);
    expect(workouts.filter(workout => workout.source?.original.category === 'cardio')).toHaveLength(19);
    expect(getWorkoutsForDate(workouts, '2026-01-25')).toHaveLength(2);
    expect(workouts).toEqual(packet.data.workoutHistory);
    expect(await loadData()).toEqual(next);
    expect(next).toEqual({ ...state, workoutHistory: workouts });
    const reimport = await importData(file, next);
    expect(reimport.success && reimport.addedCount).toBe(0);
    expect(appReducer(next, { type: 'SET_WEIGHT_UNIT', payload: 'lbs' }).workoutHistory).toEqual(workouts);
    if (process.env.MY_KEEP_XUNJI_HISTORY_FILE) {
      const original = JSON.parse(readFileSync(process.env.MY_KEEP_XUNJI_HISTORY_FILE, 'utf8'));
      expect(workouts.map(workout => workout.source?.original)).toEqual(original.workouts);
      for (const workout of workouts) {
        const sourceExercises = workout.source!.original.exercises as { sets: Record<string, unknown>[] }[];
        workout.exercises.forEach((exercise, index) => exercise.sets.forEach((set, setIndex) => {
          const sourceSet = sourceExercises[index].sets[setIndex];
          for (const field of ['weight', 'leftWeight', 'rightWeight', 'reps', 'completed', 'warmup', 'restSeconds', 'weightMode', 'emptyDisplayedSet'] as const) {
            expect(set[field]).toEqual(sourceSet[field]);
          }
          expect(set.weightUnit).toEqual(sourceSet.weightUnit ?? null);
        }));
      }
    }
  });
});
