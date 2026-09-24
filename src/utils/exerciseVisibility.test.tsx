import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_EXERCISES, type Exercise } from '@/types';
import { createInitialState } from './initialState';
import { AppProvider, appReducer, mergeWithInitialState } from '@/contexts/AppContext';
import { getLibraryExercises, getExerciseImageUrl, resolveExerciseByName } from './exerciseCatalog';
import { exportData, importData, loadData, saveData } from './storage';
import { ExerciseImage } from '@/components/training/ExerciseImage';

describe('exercise visibility and historical images', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) });
  });

  it('defaults the 80 added exercises to hidden on fresh installs and upgrades from 3.0.9', () => {
    expect(getLibraryExercises(DEFAULT_EXERCISES)).toHaveLength(33);
    expect(getLibraryExercises(DEFAULT_EXERCISES, true)).toHaveLength(80);
    const oldLibrary = DEFAULT_EXERCISES.map((exercise) => ({ ...exercise, hidden: undefined, gifUrl: exercise.id.startsWith('xunji_') ? undefined : exercise.gifUrl }));
    const next = mergeWithInitialState({ exerciseLibrary: oldLibrary });
    expect(getLibraryExercises(next.exerciseLibrary)).toHaveLength(33);
    expect(getLibraryExercises(next.exerciseLibrary, true)).toHaveLength(80);
    expect(next.exerciseLibrary.every((exercise) => exercise.gifUrl)).toBe(true);
  });

  it('hides and restores any exercise without changing workout records, templates or other data', async () => {
    const exercise = DEFAULT_EXERCISES.find((item) => item.id === 'squat')!;
    const workout = { id: 'workout', date: '2026-08-01', name: '原训练', exercises: [{ ...exercise, sets: [{ id: 's', weight: 30, reps: 8, completed: true }] }], totalVolume: 240, muscleGroups: ['腿'] };
    const state = { ...createInitialState(), dailyWorkout: workout, workoutHistory: [workout], workoutTemplates: [{ id: 't', name: '原模板', exerciseIds: [exercise.id], createdAt: 1 }] };
    const hidden = appReducer(state, { type: 'SET_EXERCISE_HIDDEN', payload: { exerciseId: exercise.id, hidden: true } });
    expect(hidden).toEqual({ ...state, exerciseLibrary: state.exerciseLibrary.map((item) => item.id === exercise.id ? { ...item, hidden: true } : item) });
    expect(getLibraryExercises(hidden.exerciseLibrary, false, exercise.name)).not.toContainEqual(expect.objectContaining({ id: exercise.id }));
    expect(hidden.workoutHistory).toBe(state.workoutHistory);
    expect(hidden.dailyWorkout).toBe(state.dailyWorkout);
    const restored = appReducer(hidden, { type: 'SET_EXERCISE_HIDDEN', payload: { exerciseId: exercise.id, hidden: false } });
    expect(getLibraryExercises(restored.exerciseLibrary).some((item) => item.id === exercise.id)).toBe(true);
    await saveData(hidden);
    expect((await loadData())?.exerciseLibrary?.find((item) => item.id === exercise.id)?.hidden).toBe(true);
  });

  it('keeps a restored new exercise visible after reload and backup import', async () => {
    const id = 'xunji_seated_leg_curl';
    const restored = appReducer(createInitialState(), { type: 'SET_EXERCISE_HIDDEN', payload: { exerciseId: id, hidden: false } });
    const reloaded = mergeWithInitialState(restored);
    expect(reloaded.exerciseLibrary.find((item) => item.id === id)?.hidden).toBe(false);
    const result = await importData(await exportData(restored));
    expect(result.success).toBe(true);
    if (result.success) expect(mergeWithInitialState(result.data).exerciseLibrary.find((item) => item.id === id)?.hidden).toBe(false);
  });

  it('resolves and renders artwork for hidden historical movements even when absent from a custom library', () => {
    const exercise = resolveExerciseByName('坐姿腿弯举')!;
    const historical: Exercise = { ...exercise, gifUrl: undefined, hidden: undefined };
    expect(getExerciseImageUrl(historical, [])).toBe('images/exercises/xunji_seated_leg_curl.png');
    const html = renderToStaticMarkup(<AppProvider><ExerciseImage exercise={historical} /></AppProvider>);
    expect(html).toContain('src="images/exercises/xunji_seated_leg_curl.png"');
    expect(html).toContain('alt="坐姿腿弯举"');
    expect(resolveExerciseByName('坐姿腿弯举')).toBe(exercise);
  });

  it('rejects malformed hidden flags and requires real artwork for all catalog entries', async () => {
    expect((await importData(JSON.stringify({ exerciseLibrary: [{ ...DEFAULT_EXERCISES[0], hidden: 'yes' }] }))).success).toBe(false);
    for (const exercise of DEFAULT_EXERCISES) {
      expect(exercise.gifUrl, exercise.name).toBeTruthy();
      expect(existsSync(resolve(process.cwd(), 'public', exercise.gifUrl!)), exercise.name).toBe(true);
    }
  });
});
