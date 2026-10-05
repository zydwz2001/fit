import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyWorkout, Exercise } from '@/types';
import { appReducer } from '@/contexts/AppContext';
import { createInitialState } from './initialState';
import { importData, loadData } from './storage';
import { countNewWorkoutRecords, mergeWorkoutHistory, withImportedWorkouts, WORKOUT_IMPORT_FORMAT } from './workoutImport';
import { getWorkoutRecordIds, mergeCrossSourceWorkoutHistory } from './workoutHistoryMerge';

const exercise = (id: string): Exercise => ({
  id, name: id, muscleGroup: '腿', category: 'strength', useLeftRight: false,
  notes: ['原备注'],
  sets: [
    { id: `${id}-1`, weight: 20, reps: 8, completed: true, weightUnit: 'kg', restSeconds: 60, sourcePage: 'page-1' },
    { id: `${id}-2`, weight: 30, reps: 9, completed: false, weightUnit: 'lbs', warmup: true, sourceLabel: 'W' },
    { id: `${id}-3`, reps: null, completed: false, emptyDisplayedSet: true, weightUnit: null },
  ],
});
const localWorkout = (): DailyWorkout => ({
  id: 'local-record', date: '2026-09-17', name: 'My Keep · 2026-09-17',
  exercises: [exercise('squat')], totalVolume: 2000, muscleGroups: ['腿'],
});
const importedWorkout = (): DailyWorkout => ({
  id: 'xunji-record', date: '2026-09-17', name: '训记 · 训练 #2',
  exercises: [exercise('leg-extension')], totalVolume: 800, muscleGroups: ['腿'], durationMinutes: 1,
  source: { app: 'xunji', recordId: 'xunji-record', original: { durationMinutes: 1, displayedVolumeKg: 800, sourcePages: ['page-1'], notes: ['原始训练备注'] } },
});

describe('cross-source history consolidation', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
  });

  it('combines one local/Xunji pair without changing any source content or unrelated workout', () => {
    const local = { ...localWorkout(), customTimestamp: 123, customNotes: ['retain unknown metadata'] };
    const imported = importedWorkout();
    const unrelated = { ...localWorkout(), id: 'other-day', date: '2026-09-18' };
    const before = structuredClone([local, imported, unrelated]);
    const result = mergeCrossSourceWorkoutHistory([local, imported, unrelated]);
    expect(result.workoutHistory).toHaveLength(2);
    const merged = result.workoutHistory[0];
    expect(merged).toMatchObject({ id: local.id, date: local.date, name: '训练记录', totalVolume: 2800, muscleGroups: ['腿'] });
    expect(merged.exercises).toEqual([...local.exercises, ...imported.exercises]);
    expect(merged.mergedFrom).toEqual([local, imported]);
    expect(merged.mergedFrom![0]).not.toBe(local);
    expect(merged.durationMinutes).toBeUndefined();
    expect(merged.mergedFrom![1].durationMinutes).toBe(1);
    expect(result.workoutHistory[1]).toBe(unrelated);
    expect([local, imported, unrelated]).toEqual(before);
    expect(result.merged).toEqual([{ date: local.date, recordId: local.id, sourceRecordIds: [local.id, imported.id], exerciseCount: 2, setCount: 6 }]);
    expect(result.skipped).toEqual([]);
  });

  it('is idempotent and removes only source IDs already represented by a merged record', () => {
    const local = localWorkout();
    const imported = importedWorkout();
    const first = mergeCrossSourceWorkoutHistory([local, imported]);
    expect(mergeCrossSourceWorkoutHistory(first.workoutHistory)).toEqual({ workoutHistory: first.workoutHistory, merged: [], skipped: [] });
    expect(mergeCrossSourceWorkoutHistory(first.workoutHistory).workoutHistory).toBe(first.workoutHistory);
    const edited = { ...first.workoutHistory[0], name: '我的修改', totalVolume: 1234 };
    const unrelated = { ...imported, id: 'another-record' };
    expect(mergeCrossSourceWorkoutHistory([local, imported, edited, unrelated]).workoutHistory).toEqual([edited, unrelated]);
    expect(getWorkoutRecordIds(edited)).toEqual([local.id, imported.id]);
    expect(mergeWorkoutHistory([edited], [local, imported, unrelated])).toEqual([edited, unrelated]);
    expect(mergeWorkoutHistory([], [local, imported], edited)).toEqual([]);
  });

  it('leaves same-source pairs, single records, and three-record dates separate', () => {
    const local = localWorkout();
    const imported = importedWorkout();
    const cases = [
      [local], [imported],
      [local, { ...local, id: 'local-2' }],
      [imported, { ...imported, id: 'imported-2' }],
      [local, imported, { ...imported, id: 'imported-2' }],
      [local, { ...imported, date: '2026-09-18' }],
    ];
    for (const records of cases) {
      expect(mergeCrossSourceWorkoutHistory(records)).toEqual({ workoutHistory: records, merged: [], skipped: [] });
      expect(mergeCrossSourceWorkoutHistory(records).workoutHistory).toBe(records);
    }
  });

  it('preserves every repeated set and note when compatible exercise IDs overlap', () => {
    const local = { ...localWorkout(), durationMinutes: 10 };
    const imported = { ...importedWorkout(), exercises: [exercise('squat')] };
    const result = mergeCrossSourceWorkoutHistory([local, imported]).workoutHistory[0];
    expect(result.durationMinutes).toBe(11);
    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0].notes).toEqual(['原备注', '原备注']);
    const sets = result.exercises[0].sets;
    expect(sets).toHaveLength(6);
    expect(new Set(sets.map((set) => set.id)).size).toBe(6);
    sets.forEach((set, index) => {
      const original = [...local.exercises[0].sets, ...imported.exercises[0].sets][index];
      expect({ ...set, id: original.id }).toEqual(original);
    });
    expect(result.mergedFrom).toEqual([local, imported]);
    expect(mergeCrossSourceWorkoutHistory([local, imported]).workoutHistory[0]).toEqual(result);
  });

  it.each([
    { useLeftRight: true }, { recordingMode: 'reps-only' as const },
    { volumeMode: 'assisted-bodyweight' as const }, { bodyWeightKg: 60 },
    { category: 'cardio' as const }, { durationMinutes: 15 },
  ])('keeps incompatible exercise metadata intact and reports it: %j', (change) => {
    const local = localWorkout();
    const imported = { ...importedWorkout(), exercises: [{ ...exercise('squat'), ...change }] };
    const records = [local, imported];
    const result = mergeCrossSourceWorkoutHistory(records);
    expect(result.workoutHistory).toBe(records);
    expect(result.merged).toEqual([]);
    expect(result.skipped).toEqual([{ date: local.date, recordIds: [local.id, imported.id], reason: 'incompatible-exercise-metadata', exerciseIds: ['squat'] }]);
  });

  it('keeps two cardio activities separate even when their duration and distance match', () => {
    const cardio: Exercise = { ...exercise('cycling'), category: 'cardio', durationMinutes: 20, distanceKm: 5, intensity: 3, sets: [] };
    const records = [
      { ...localWorkout(), exercises: [cardio] },
      { ...importedWorkout(), exercises: [structuredClone(cardio)] },
    ];
    const result = mergeCrossSourceWorkoutHistory(records);
    expect(result.workoutHistory).toBe(records);
    expect(result.merged).toEqual([]);
    expect(result.skipped[0].exerciseIds).toEqual(['cycling']);
  });

  it('imports a new source once even when consolidation does not increase the history length', async () => {
    const local = localWorkout();
    const imported = importedWorkout();
    const state = { ...createInitialState(), workoutHistory: [local] };
    const packet = JSON.stringify({ format: WORKOUT_IMPORT_FORMAT, version: 1, mode: 'merge', data: { workoutHistory: [imported] } });
    expect(countNewWorkoutRecords([local], [imported])).toBe(1);
    const result = await importData(packet, state);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.addedCount).toBe(1);
    const merged = withImportedWorkouts(state, [imported]);
    expect(merged.workoutHistory).toHaveLength(1);
    expect(result.data).toEqual(merged);
    expect(await loadData()).toEqual(merged);
    expect(appReducer(state, { type: 'IMPORT_WORKOUT_HISTORY', payload: result.data.workoutHistory! })).toEqual(merged);
    const edited = { ...merged, workoutHistory: [{ ...merged.workoutHistory[0], name: '改过的训练' }] };
    const again = await importData(packet, edited);
    expect(again.success && again.addedCount).toBe(0);
    expect(again.success && again.data).toEqual(edited);
  });

  it('round-trips complete merge provenance in backups and rejects malformed provenance without writing', async () => {
    const state = withImportedWorkouts({ ...createInitialState(), workoutHistory: [localWorkout()] }, [importedWorkout()]);
    expect((await importData(JSON.stringify(state))).success).toBe(true);
    expect(await loadData()).toEqual(state);
    const sentinel = localStorage.getItem('vibe-fitness-data');
    const changes = [
      (record: Record<string, unknown>) => { record.mergedFrom = 'invalid'; },
      (record: Record<string, unknown>) => { record.mergedFrom = [localWorkout()]; },
      (record: Record<string, unknown>) => { record.mergedFrom = [localWorkout(), localWorkout()]; },
      (record: Record<string, unknown>) => { record.mergedFrom = [{ ...localWorkout(), mergedFrom: [importedWorkout()] }, importedWorkout()]; },
      (record: Record<string, unknown>) => { record.mergedFrom = [{ ...localWorkout(), exercises: 'invalid' }, importedWorkout()]; },
    ];
    for (const change of changes) {
      const invalid = structuredClone(state);
      change(invalid.workoutHistory[0] as unknown as Record<string, unknown>);
      expect((await importData(JSON.stringify(invalid))).success).toBe(false);
      expect(localStorage.getItem('vibe-fitness-data')).toBe(sentinel);
    }
  });

  it.runIf(Boolean(process.env.MY_KEEP_HISTORY_MERGE_FILE))('merges external history without losing any recorded fields', () => {
    const state = JSON.parse(readFileSync(process.env.MY_KEEP_HISTORY_MERGE_FILE!, 'utf8'));
    const history: DailyWorkout[] = state.workoutHistory;
    const before = structuredClone(history);
    const dates = [...new Set(history.map((workout) => workout.date))];
    const candidatePairs = dates.map((date) => history.filter((workout) => workout.date === date))
      .filter((records) => records.length === 2 && records.every((record) => !record.mergedFrom?.length) &&
        records.filter((record) => record.source?.app === 'xunji').length === 1 && records[0].id !== records[1].id);
    expect(candidatePairs.length).toBeGreaterThan(0);
    const result = mergeCrossSourceWorkoutHistory(history);
    expect(result.merged.length).toBeGreaterThan(0);
    expect(result.merged.length + result.skipped.length).toBe(candidatePairs.length);
    for (const diagnostic of result.merged) {
      const pair = candidatePairs.find((records) => records[0].date === diagnostic.date)!;
      const originals = [pair.find((record) => record.source?.app !== 'xunji')!, pair.find((record) => record.source?.app === 'xunji')!];
      const merged = result.workoutHistory.find((workout) => workout.id === diagnostic.recordId)!;
      const originalExercises = originals.flatMap((workout) => workout.exercises);
      expect(merged.mergedFrom).toEqual(originals);
      expect(merged.totalVolume).toBe(originals.reduce((sum, workout) => sum + workout.totalVolume, 0));
      expect(diagnostic.sourceRecordIds).toEqual(originals.map((workout) => workout.id));
      expect(diagnostic.exerciseCount).toBe(new Set(originalExercises.map((exercise) => exercise.id)).size);
      expect(diagnostic.setCount).toBe(originalExercises.reduce((sum, exercise) => sum + exercise.sets.length, 0));
      for (const exercise of merged.exercises) {
        const sources = originalExercises.filter((original) => original.id === exercise.id);
        const sets = sources.flatMap((original) => original.sets);
        expect(exercise.sets).toHaveLength(sets.length);
        exercise.sets.forEach((set, index) => expect({ ...set, id: sets[index].id }).toEqual(sets[index]));
        expect(exercise.notes ?? []).toEqual(sources.flatMap((original) => original.notes ?? []));
        if (sources.length === 1) expect(exercise).toEqual(sources[0]);
      }
    }
    const affectedIds = new Set(result.merged.flatMap((record) => record.sourceRecordIds));
    const previouslyAbsorbedIds = new Set(history.flatMap((record) => record.mergedFrom?.map((original) => original.id) ?? []));
    const unaffected = history.filter((record) => !affectedIds.has(record.id) && (record.mergedFrom?.length || !previouslyAbsorbedIds.has(record.id)));
    expect(result.workoutHistory.filter((record) => !affectedIds.has(record.id))).toEqual(unaffected);
    expect(result.workoutHistory).toHaveLength(unaffected.length + result.merged.length);
    expect(history).toEqual(before);
    expect(withImportedWorkouts({ ...state, workoutHistory: result.workoutHistory }, candidatePairs.flat()).workoutHistory).toEqual(result.workoutHistory);
  });
});
