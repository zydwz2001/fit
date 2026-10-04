import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appReducer, mergeExerciseLibrary, mergeWithInitialState } from '@/contexts/AppContext';
import { DEFAULT_EXERCISES, type AppState, type DailyWorkout, type Exercise } from '@/types';
import { curateHiddenExerciseLibrary } from './exerciseLibrary';
import { getExerciseImageUrl } from './exerciseCatalog';
import { createInitialState } from './initialState';
import { exportData, importData, loadData, saveData } from './storage';

function exercise(id: string, overrides: Partial<Exercise> = {}): Exercise {
  return { id, name: id, muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], hidden: true, ...overrides };
}

function workout(id: string, exercises: Exercise[]): DailyWorkout {
  return { id, date: '2026-10-05', name: id, exercises, totalVolume: 0, muscleGroups: ['背'] };
}

describe('explicit exercise library cleanup', () => {
  it('keeps all recorded movements by id or exact normalized names and aliases, including empty and unfinished entries', () => {
    const state: AppState = {
      ...createInitialState(),
      exerciseLibrary: [
        exercise('visible-unused', { hidden: false }),
        exercise('hidden-unused'),
        exercise('empty-record'),
        exercise('unfinished-record'),
        exercise('today-record'),
        exercise('alias-match', { name: '坐姿划船', aliases: ['Ｔ－ＢＡＲ Row'] }),
        exercise('custom-library-id', { name: '我的自定义划船' }),
        exercise('source-name-match', { name: '史密斯深蹲' }),
        exercise('different-variant', { name: '宽握坐姿划船' }),
      ],
      deletedExerciseIds: ['earlier-removal', 'today-record'],
      workoutHistory: [workout('past', [
        exercise('empty-record', { name: '以前的名称' }),
        exercise('unfinished-record', { sets: [{ id: 'unfinished', reps: 0, completed: false }] }),
        exercise('imported-id', { name: ' t-bar  ROW ' }),
        exercise('custom-history-id', { name: '我的 自定义划船' }),
        exercise('imported-source-id', { name: '以前导入名', sourceName: '史密斯深蹲' }),
      ])],
      dailyWorkout: workout('today', [exercise('today-record')]),
      workoutTemplates: [{ id: 'template', name: '保留原模板', exerciseIds: ['hidden-unused'], createdAt: 1 }],
      bodyMetrics: [{ id: 'metric', type: 'weight', value: 60, date: '2026-10-05', timestamp: 1 }],
      folders: [{ id: 'folder', name: '原文件夹', icon: 'fa-book', color: 'green', expanded: true }],
      notes: [{ id: 'note', title: '原笔记', content: '原内容', folderId: 'folder', createdAt: 1, updatedAt: 1 }],
    };
    const before = structuredClone(state);
    const curated = curateHiddenExerciseLibrary(state);

    expect(curated.exerciseLibrary.map((item) => item.id)).toEqual([
      'visible-unused', 'empty-record', 'unfinished-record', 'today-record',
      'alias-match', 'custom-library-id', 'source-name-match',
    ]);
    expect(curated.exerciseLibrary.every((item) => item.hidden === false)).toBe(true);
    expect(curated.deletedExerciseIds).toEqual(['earlier-removal', 'hidden-unused', 'different-variant']);
    for (const key of Object.keys(state) as (keyof AppState)[]) {
      if (key !== 'exerciseLibrary' && key !== 'deletedExerciseIds') expect(curated[key], key).toBe(state[key]);
    }
    expect(curated.exerciseLibrary).toEqual(state.exerciseLibrary
      .filter((item) => !['hidden-unused', 'different-variant'].includes(item.id))
      .map((item) => ({ ...item, hidden: false })));
    expect(state).toEqual(before);
  });

  it('does not run cleanup during ordinary state restore', () => {
    const initial = createInitialState();
    const restored = mergeWithInitialState(initial);
    expect(restored.exerciseLibrary).toHaveLength(initial.exerciseLibrary.length);
    expect(restored.exerciseLibrary.filter((item) => item.hidden)).toHaveLength(80);
  });
});

describe('persistent exercise removals', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });

  it('preserves curated deletions and visibility through save, reload, export, and full import', async () => {
    const used = DEFAULT_EXERCISES.find((item) => item.id === 'xunji_leg_extension')!;
    const state = { ...createInitialState(), workoutHistory: [workout('used', [{ ...used, sets: [] }])] };
    const curated = curateHiddenExerciseLibrary(state);
    expect(curated.exerciseLibrary).toHaveLength(34);
    expect(curated.deletedExerciseIds).toHaveLength(79);
    expect(await saveData(curated)).toBe(true);

    const reloaded = mergeWithInitialState((await loadData())!);
    const result = await importData(await exportData(reloaded));
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.message);
    const restored = mergeWithInitialState(result.data);
    expect(restored.exerciseLibrary.map((item) => item.id)).toEqual(curated.exerciseLibrary.map((item) => item.id));
    expect(restored.exerciseLibrary.every((item) => item.hidden === false)).toBe(true);
    expect(restored.deletedExerciseIds).toEqual(curated.deletedExerciseIds);
    expect(restored.workoutHistory).toEqual(state.workoutHistory);
    expect(mergeExerciseLibrary(DEFAULT_EXERCISES, curated.deletedExerciseIds).map((item) => item.id))
      .toEqual(curated.exerciseLibrary.map((item) => item.id));
    expect(mergeExerciseLibrary(undefined, ['squat']).some((item) => item.id === 'squat')).toBe(false);
  });

  it('tracks explicit replacement removals, preserves history, and clears tombstones when re-adding or resetting', () => {
    const removed = DEFAULT_EXERCISES.find((item) => item.id === 'xunji_leg_extension')!;
    const state = { ...createInitialState(), workoutHistory: [workout('past', [{ ...removed, gifUrl: undefined }])] };
    const next = appReducer(state, {
      type: 'REPLACE_EXERCISE_LIBRARY',
      payload: { exercises: state.exerciseLibrary.filter((item) => item.id !== removed.id) },
    });
    expect(next.deletedExerciseIds).toEqual([removed.id]);
    expect(next.workoutHistory).toBe(state.workoutHistory);
    expect(getExerciseImageUrl(next.workoutHistory[0].exercises[0], next.exerciseLibrary)).toBe(removed.gifUrl);
    expect(mergeWithInitialState(next).exerciseLibrary.some((item) => item.id === removed.id)).toBe(false);

    const readded = appReducer(next, {
      type: 'REPLACE_EXERCISE_LIBRARY', payload: { exercises: [...next.exerciseLibrary, removed] },
    });
    expect(readded.deletedExerciseIds).toEqual([]);
    expect(mergeWithInitialState(readded).exerciseLibrary.some((item) => item.id === removed.id)).toBe(true);
    const reset = appReducer(next, { type: 'RESET_EXERCISE_LIBRARY' });
    expect(reset.deletedExerciseIds).toEqual([]);
    expect(reset.exerciseLibrary).toEqual(DEFAULT_EXERCISES);
    expect(reset.workoutHistory).toBe(state.workoutHistory);
  });

  it('allows explicitly clearing the library without repopulating it', () => {
    const state = createInitialState();
    const cleared = appReducer(state, { type: 'REPLACE_EXERCISE_LIBRARY', payload: { exercises: [] } });
    expect(cleared.exerciseLibrary).toEqual([]);
    expect(cleared.deletedExerciseIds).toHaveLength(state.exerciseLibrary.length);
    expect(mergeWithInitialState(cleared).exerciseLibrary).toEqual([]);
  });

  it('accepts old backups and rejects malformed deletion markers without overwriting storage', async () => {
    const oldBackup = { exerciseLibrary: [], workoutHistory: [] };
    expect((await importData(JSON.stringify(oldBackup))).success).toBe(true);
    expect(mergeWithInitialState(oldBackup).deletedExerciseIds).toEqual([]);
    for (const deletedExerciseIds of [null, 'squat', [1], [' '], [{}]]) {
      expect((await importData(JSON.stringify({ ...oldBackup, deletedExerciseIds }))).success).toBe(false);
      expect(await loadData()).toEqual(oldBackup);
    }
  });
});
