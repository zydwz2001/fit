import { describe, expect, it } from 'vitest';
import { appReducer, mergeWithDemoState } from './AppContext';
import { createDemoState } from '@/utils/demoData';
import { calculateBMI, calculateVolume, getTodayString } from '@/utils/constants';
import type { DailyWorkout, Exercise } from '@/types';

function strengthExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-strength',
    name: '测试力量动作',
    muscleGroup: '背',
    category: 'strength',
    useLeftRight: false,
    sets: [
      { id: 'set-1', weight: 40, reps: 10, completed: true },
      { id: 'set-2', weight: 50, reps: 8, completed: false },
    ],
    ...overrides,
  };
}

describe('mergeWithDemoState', () => {
  it('preserves intentionally cleared collections and a null daily workout', () => {
    const merged = mergeWithDemoState({
      dailyWorkout: null,
      workoutHistory: [],
      bodyMetrics: [],
      metricTargets: [],
      bodyPhotos: [],
      folders: [],
      notes: [],
    });

    expect(merged.dailyWorkout).toBeNull();
    expect(merged.workoutHistory).toEqual([]);
    expect(merged.bodyMetrics).toEqual([]);
    expect(merged.metricTargets).toEqual([]);
    expect(merged.bodyPhotos).toEqual([]);
    expect(merged.folders).toEqual([]);
    expect(merged.notes).toEqual([]);
  });

  it('always locks body data after restoring a backup', () => {
    const merged = mergeWithDemoState({ bodyUnlocked: true });
    expect(merged.bodyUnlocked).toBe(false);
  });
});

describe('body metrics reducer', () => {
  it('adds weight and recalculates BMI for the same day', () => {
    const state = { ...createDemoState(), bodyMetrics: [] };
    const next = appReducer(state, {
      type: 'ADD_BODY_METRIC',
      payload: { type: 'weight', value: 52.4 },
    });

    expect(next.bodyMetrics).toHaveLength(2);
    expect(next.bodyMetrics.find((metric) => metric.type === 'weight')?.value).toBe(52.4);
    expect(next.bodyMetrics.find((metric) => metric.type === 'bmi')?.value).toBe(calculateBMI(52.4));
  });
});

describe('body photos reducer', () => {
  it('updates an editable photo date without changing its upload timestamp', () => {
    const photo = {
      id: 'photo-1',
      uri: 'data:image/jpeg;base64,test',
      date: '2026-07-31',
      timestamp: 12345,
    };
    const state = { ...createDemoState(), bodyPhotos: [photo] };
    const next = appReducer(state, {
      type: 'UPDATE_BODY_PHOTO',
      payload: { photoId: photo.id, date: '2026-07-20' },
    });

    expect(next.bodyPhotos[0].date).toBe('2026-07-20');
    expect(next.bodyPhotos[0].timestamp).toBe(12345);
  });
});

describe('workout reducer', () => {
  it('persists a workout and derives volume, muscle groups, and cardio name', () => {
    const cardio: Exercise = {
      id: 'test-cardio',
      name: '游泳',
      muscleGroup: '有氧',
      category: 'cardio',
      useLeftRight: false,
      sets: [{ id: 'cardio-set', weight: 100, reps: 100, completed: true }],
    };
    const workout: DailyWorkout = {
      id: 'history-test',
      date: '2026-07-20',
      name: '测试训练',
      exercises: [strengthExercise(), cardio],
      totalVolume: 999999,
      muscleGroups: [],
    };
    const state = { ...createDemoState(), dailyWorkout: null, workoutHistory: [] };
    const next = appReducer(state, {
      type: 'SAVE_WORKOUT_RECORD',
      payload: { workout },
    });

    expect(next.workoutHistory).toHaveLength(1);
    expect(next.workoutHistory[0].totalVolume).toBe(400);
    expect(next.workoutHistory[0].muscleGroups).toEqual(['背', '有氧']);
    expect(next.workoutHistory[0].cardioName).toBe('游泳');
  });

  it('never counts cardio sets toward strength volume', () => {
    const cardio = strengthExercise({ category: 'cardio' });
    expect(calculateVolume(cardio)).toBe(0);
  });

  it('removes a persisted historical workout by id', () => {
    const state = createDemoState();
    const workoutId = state.workoutHistory[0].id;
    const next = appReducer(state, {
      type: 'REMOVE_WORKOUT_RECORD',
      payload: { workoutId },
    });

    expect(next.workoutHistory.some((workout) => workout.id === workoutId)).toBe(false);
  });

  it('copies a historical workout to today without changing the original record', () => {
    const historyWorkout: DailyWorkout = {
      id: 'history-copy-source',
      date: '2026-07-20',
      name: '背部和爬坡',
      exercises: [
        strengthExercise({
          sets: [
            { id: 'history-set-1', weight: 55, reps: 10, completed: true },
            { id: 'history-set-2', weight: 60, reps: 8, completed: true },
          ],
        }),
        {
          id: 'hill_climbing',
          name: '爬坡',
          muscleGroup: '有氧',
          category: 'cardio',
          useLeftRight: false,
          sets: [],
          durationMinutes: 30,
        },
      ],
      totalVolume: 1030,
      muscleGroups: ['背', '有氧'],
      cardioName: '爬坡',
    };
    const state = {
      ...createDemoState(),
      dailyWorkout: null,
      workoutHistory: [historyWorkout],
    };
    const next = appReducer(state, {
      type: 'COPY_WORKOUT_TO_TODAY',
      payload: { workout: historyWorkout },
    });

    expect(next.dailyWorkout?.date).toBe(getTodayString());
    expect(next.dailyWorkout?.id).not.toBe(historyWorkout.id);
    expect(next.dailyWorkout?.name).toBe(historyWorkout.name);
    expect(next.dailyWorkout?.totalVolume).toBe(0);
    expect(next.dailyWorkout?.exercises[0].sets.map((set) => set.completed)).toEqual([false, false]);
    expect(next.dailyWorkout?.exercises[0].sets.map((set) => set.id)).not.toEqual([
      'history-set-1',
      'history-set-2',
    ]);
    expect(next.dailyWorkout?.exercises[1].durationMinutes).toBe(30);
    expect(next.workoutHistory[0]).toEqual(historyWorkout);
  });

  it('updates structured cardio fields without creating fake strength volume', () => {
    const cardio: Exercise = {
      id: 'swimming',
      name: '游泳',
      muscleGroup: '有氧',
      category: 'cardio',
      useLeftRight: false,
      sets: [],
    };
    const state = {
      ...createDemoState(),
      dailyWorkout: {
        id: 'today-cardio',
        date: '2026-07-30',
        name: '有氧日',
        exercises: [cardio],
        totalVolume: 0,
        muscleGroups: ['有氧'],
      },
    };
    const next = appReducer(state, {
      type: 'UPDATE_CARDIO_EXERCISE',
      payload: {
        exerciseId: 'swimming',
        updates: { durationMinutes: 45, distanceKm: 1.8, intensity: 7 },
      },
    });

    expect(next.dailyWorkout?.exercises[0]).toMatchObject({
      durationMinutes: 45,
      distanceKm: 1.8,
      intensity: 7,
    });
    expect(next.dailyWorkout?.totalVolume).toBe(0);
  });

  it('converts workout weights between kg and lbs while retaining kg-normalized volume', () => {
    const workout: DailyWorkout = {
      id: 'unit-test',
      date: '2026-07-30',
      name: '单位测试',
      exercises: [strengthExercise({
        sets: [{ id: 'set-kg', weight: 10, reps: 10, completed: true }],
      })],
      totalVolume: 100,
      muscleGroups: ['背'],
    };
    const state = {
      ...createDemoState(),
      weightUnit: 'kg' as const,
      dailyWorkout: workout,
      workoutHistory: [],
    };
    const next = appReducer(state, { type: 'SET_WEIGHT_UNIT', payload: 'lbs' });

    expect(next.dailyWorkout?.exercises[0].sets[0].weight).toBe(22);
    expect(next.dailyWorkout?.totalVolume).toBeCloseTo(99.79, 1);
  });
});

describe('workout templates reducer', () => {
  it('adds, applies, and removes a template using only library exercises', () => {
    const initial = {
      ...createDemoState(),
      dailyWorkout: null,
      workoutTemplates: [],
    };
    const added = appReducer(initial, {
      type: 'ADD_WORKOUT_TEMPLATE',
      payload: {
        name: '  游泳加深蹲  ',
        exerciseIds: ['swimming', 'squat', 'swimming', 'missing'],
      },
    });

    expect(added.workoutTemplates).toHaveLength(1);
    expect(added.workoutTemplates[0]).toMatchObject({
      name: '游泳加深蹲',
      exerciseIds: ['swimming', 'squat'],
    });

    const applied = appReducer(added, {
      type: 'APPLY_WORKOUT_TEMPLATE',
      payload: { templateId: added.workoutTemplates[0].id },
    });
    expect(applied.dailyWorkout?.name).toBe('游泳加深蹲');
    expect(applied.dailyWorkout?.templateId).toBe(added.workoutTemplates[0].id);
    expect(applied.dailyWorkout?.exercises.map((exercise) => exercise.id)).toEqual([
      'swimming',
      'squat',
    ]);
    expect(applied.dailyWorkout?.exercises[0].sets).toEqual([]);
    expect(applied.dailyWorkout?.exercises[1].sets).toHaveLength(1);

    const removed = appReducer(applied, {
      type: 'REMOVE_WORKOUT_TEMPLATE',
      payload: { templateId: added.workoutTemplates[0].id },
    });
    expect(removed.workoutTemplates).toEqual([]);
  });

  it('inherits the latest weights, reps, and set count when applying a template again', () => {
    const template = {
      id: 'template-squat',
      name: '深蹲训练',
      exerciseIds: ['squat'],
      createdAt: 1,
    };
    const previousWorkout: DailyWorkout = {
      id: 'previous-template-workout',
      date: '2026-07-30',
      name: template.name,
      templateId: template.id,
      exercises: [strengthExercise({
        id: 'squat',
        name: '深蹲',
        muscleGroup: '腿',
        sets: [
          { id: 'old-set-1', weight: 60, reps: 10, completed: true },
          { id: 'old-set-2', weight: 65, reps: 8, completed: true },
          { id: 'old-set-3', weight: 65, reps: 6, completed: false },
        ],
      })],
      totalVolume: 1120,
      muscleGroups: ['腿'],
    };
    const state = {
      ...createDemoState(),
      dailyWorkout: null,
      workoutHistory: [previousWorkout],
      workoutTemplates: [template],
    };

    const applied = appReducer(state, {
      type: 'APPLY_WORKOUT_TEMPLATE',
      payload: { templateId: template.id },
    });
    const sets = applied.dailyWorkout?.exercises[0].sets ?? [];

    expect(sets).toHaveLength(3);
    expect(sets.map(({ weight, reps, completed }) => ({ weight, reps, completed }))).toEqual([
      { weight: 60, reps: 10, completed: false },
      { weight: 65, reps: 8, completed: false },
      { weight: 65, reps: 6, completed: false },
    ]);
    expect(sets.map((set) => set.id)).not.toEqual(['old-set-1', 'old-set-2', 'old-set-3']);
  });
});

describe('exercise library reducer', () => {
  it('trims values, removes normalized duplicate ids, and clears imported sets', () => {
    const imported = [
      strengthExercise({
        id: ' custom ',
        name: ' 自定义划船 ',
        muscleGroup: ' 背 ',
      }),
      strengthExercise({
        id: 'custom',
        name: '重复动作',
      }),
    ];
    const state = createDemoState();
    const next = appReducer(state, {
      type: 'REPLACE_EXERCISE_LIBRARY',
      payload: { exercises: imported },
    });

    expect(next.exerciseLibrary).toEqual([
      expect.objectContaining({
        id: 'custom',
        name: '自定义划船',
        muscleGroup: '背',
        sets: [],
      }),
    ]);
  });
});
