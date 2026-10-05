import { describe, expect, it, vi } from 'vitest';
import type { DailyWorkout } from '@/types';
import { appReducer } from '@/contexts/AppContext';
import { createInitialState } from './initialState';
import { HISTORY_MERGE_BACKUP_KEY, migrateSavedWorkoutHistory } from './workoutHistoryMigration';

const local: DailyWorkout = {
  id: 'local', date: '2026-09-17', name: '训练', exercises: [], totalVolume: 0, muscleGroups: [],
};
const imported: DailyWorkout = {
  ...local, id: 'imported', source: { app: 'xunji', recordId: 'imported', original: { notes: '保留来源' } },
};

describe('history migration backup', () => {
  it('backs up the complete incoming state before merging and never replaces the first backup', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } as unknown as Storage;
    const state = { workoutHistory: [local, imported], notes: [], weightUnit: 'kg' as const };
    const migrated = migrateSavedWorkoutHistory(state, storage);
    expect(JSON.parse(values.get(HISTORY_MERGE_BACKUP_KEY)!)).toEqual(state);
    expect(migrated.workoutHistory).toHaveLength(1);
    expect(migrateSavedWorkoutHistory(migrated, storage)).toBe(migrated);
    migrateSavedWorkoutHistory({ ...state, weightUnit: 'lbs' }, storage);
    expect(JSON.parse(values.get(HISTORY_MERGE_BACKUP_KEY)!)).toEqual(state);
  });

  it('leaves records untouched if the backup cannot be stored', () => {
    const storage = { getItem: () => null, setItem: vi.fn(() => { throw new Error('quota'); }) } as unknown as Storage;
    const state = { workoutHistory: [local, imported] };
    expect(migrateSavedWorkoutHistory(state, storage)).toBe(state);
    expect(state.workoutHistory).toHaveLength(2);
  });

  it('keeps original source names in snapshots when a full import refreshes built-in names', () => {
    const original = { ...local, exercises: [{
      id: 'crunch', name: '原来的腹部动作名称', muscleGroup: '核心', category: 'strength' as const,
      useLeftRight: false, sets: [],
    }] };
    const result = appReducer(createInitialState(), {
      type: 'IMPORT_APP_STATE', payload: { workoutHistory: [original, imported] },
    });
    expect(result.workoutHistory).toHaveLength(1);
    expect(result.workoutHistory[0].mergedFrom).toEqual([original, imported]);
    expect(result.workoutHistory[0].exercises[0].name).toBe('吊杠屈腿卷腹');
  });
});
