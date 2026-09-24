import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_EXERCISES, type Exercise } from '@/types';
import { XUNJI_ADDITIONAL_EXERCISES } from '@/data/xunjiExercises';
import { appReducer, mergeExerciseLibrary, mergeWithInitialState } from '@/contexts/AppContext';
import { createInitialState } from './initialState';
import { calculateVolume } from './constants';
import { importData, loadData, saveData } from './storage';
import { formatExerciseSet, formatExerciseSummary, matchesExerciseQuery, resolveExerciseByName } from './exerciseCatalog';
import { SetRow } from '@/components/training/SetRow';

const completedSet = { id: 's1', weight: 10, reps: 8, completed: true };
const find = (name: string): Exercise => {
  const exercise = resolveExerciseByName(name);
  if (!exercise) throw new Error(`Missing exercise: ${name}`);
  return exercise;
};

describe('expanded exercise catalog', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });

  it('extends a 3.0.7 library once while preserving stored workouts and custom entries', () => {
    const oldLibrary = DEFAULT_EXERCISES.filter((ex) => !ex.id.startsWith('xunji_'))
      .map((ex) => ({ ...ex, aliases: undefined, recordingMode: undefined }));
    expect(oldLibrary).toHaveLength(33);
    const custom: Exercise = { id: 'custom', name: '我的动作', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [] };
    const oldPushup = { ...oldLibrary.find((ex) => ex.id === 'pushup')!, sets: [completedSet] };
    const workout = { id: 'old-workout', date: '2026-08-01', name: '旧训练', exercises: [oldPushup], totalVolume: 80, muscleGroups: ['胸'] };
    const oldState = { ...createInitialState(), exerciseLibrary: [...oldLibrary, custom], dailyWorkout: workout, workoutHistory: [workout], notes: [{ id: 'n', title: '原笔记', content: '保留内容', folderId: null, createdAt: 1, updatedAt: 1 }] };
    const merged = mergeWithInitialState(oldState);
    expect(merged.exerciseLibrary).toHaveLength(114);
    expect(merged.exerciseLibrary).toContainEqual(custom);
    expect(merged.workoutHistory).toEqual(oldState.workoutHistory);
    expect(merged.dailyWorkout).toEqual(oldState.dailyWorkout);
    expect(merged.notes).toEqual(oldState.notes);
    expect(merged.bodyMetrics).toEqual(oldState.bodyMetrics);
    expect(mergeExerciseLibrary(merged.exerciseLibrary)).toEqual(merged.exerciseLibrary);
    expect(new Set(merged.exerciseLibrary.map((ex) => ex.id)).size).toBe(114);
  });

  it('resolves known aliases, including punctuation variants, without conflating distinct movements', () => {
    for (const [name, id] of [
      ['上斜哑铃卧推', 'incline_dumbbell_press'],
      ['平躺哑铃卧推', 'dumbbell_benchpress'],
      ['俯身飞鸟', 'bent_over_dumbbell_reverse_fly'],
      ['坐姿髋内收', 'hip_adduction'],
      ['坐姿髋外展', 'hip_abduction'],
      ['侧平举', 'dumbbell_lateral_raise'],
      ['站姿杠铃推举', 'standing_overhead_press'],
      ['杠铃罗马尼亚硬拉', 'romanian_deadlift'],
      ['双杠臂屈伸(辅助)', 'assisted_dip'],
      ['平躺哑铃飞鸟', 'xunji_dumbbell_fly'],
    ]) expect(find(name).id).toBe(id);
    expect(find('宽距下拉').id).not.toBe(find('窄距下拉').id);
    expect(find('哑铃划船（手扶）').id).not.toBe(find('哑铃划船').id);
    expect(find('双杠臂屈伸（负重）').id).not.toBe(find('双杠臂屈伸（辅助）').id);
    expect(resolveExerciseByName('未知器械版本')).toBeUndefined();
    expect(matchesExerciseQuery(find('平躺哑铃卧推'), '平躺')).toBe(true);
  });

  it('supports repetitions, added load, assistance and timed relaxation as distinct recording modes', () => {
    const repsOnly = { ...find('史密斯辅助引体'), sets: [completedSet] };
    expect(calculateVolume(repsOnly)).toBe(0);
    expect(formatExerciseSet(repsOnly, completedSet, 'kg')).toBe('8 次');
    expect(formatExerciseSummary(repsOnly, 'kg')).toBe('8 次');
    const weighted = { ...find('双杠臂屈伸（负重）'), sets: [completedSet] };
    expect(calculateVolume(weighted)).toBe(80);
    expect(calculateVolume(weighted, 'lbs')).toBeCloseTo(36.2873896);
    expect(formatExerciseSet(weighted, completedSet, 'kg')).toBe('附加 10 kg × 8 次');
    expect(formatExerciseSummary(weighted, 'kg')).toBe('附加负重容量 80 kg');
    const assisted = { ...find('引体向上（辅助）'), bodyWeightKg: 50, sets: [completedSet] };
    expect(calculateVolume(assisted)).toBe(320);
    expect(find('上半身松解')).toMatchObject({ category: 'cardio', muscleGroup: '拉伸放松' });
    for (const ex of [repsOnly, weighted, assisted]) {
      const current = { ...createInitialState(), dailyWorkout: { id: 'w', date: '2026-09-24', name: '训练', exercises: [ex], totalVolume: 0, muscleGroups: [ex.muscleGroup] } };
      expect(appReducer(current, { type: 'TOGGLE_LEFT_RIGHT_MODE', payload: { exerciseId: ex.id } }).dailyWorkout?.exercises[0].useLeftRight).toBe(false);
    }
  });

  it('renders only the repetitions input for unweighted movements', () => {
    const html = renderToStaticMarkup(<SetRow set={completedSet} index={0} useLeftRight={false} hideWeight onUpdate={() => {}} onToggleCompleted={() => {}} />);
    expect(html.match(/<input/g)).toHaveLength(1);
    expect(html).toContain('aria-label="次数"');
    expect(html).not.toContain('kg');
  });

  it('persists all new modes and aliases and rejects malformed catalog metadata', async () => {
    expect(XUNJI_ADDITIONAL_EXERCISES).toHaveLength(80);
    expect(DEFAULT_EXERCISES).toHaveLength(113);
    await saveData({ exerciseLibrary: DEFAULT_EXERCISES });
    expect((await loadData())?.exerciseLibrary).toEqual(DEFAULT_EXERCISES);
    for (const invalid of [{ aliases: [1] }, { recordingMode: 'unsupported' }]) {
      expect((await importData(JSON.stringify({ exerciseLibrary: [{ ...DEFAULT_EXERCISES[0], ...invalid }] }))).success).toBe(false);
    }
  });

  it.runIf(Boolean(process.env.MY_KEEP_XUNJI_HISTORY_FILE))('covers every exercise name in the actual page export', () => {
    const data = JSON.parse(readFileSync(process.env.MY_KEEP_XUNJI_HISTORY_FILE!, 'utf8')) as { workouts: { exercises: { name: string }[] }[] };
    const names = [...new Set(data.workouts.flatMap((workout) => workout.exercises.map((ex) => ex.name)))];
    expect(data.workouts).toHaveLength(225);
    expect(names).toHaveLength(105);
    expect(names.filter((name) => !resolveExerciseByName(name))).toEqual([]);
  });
});
