import { describe, expect, it } from 'vitest';
import { appReducer, mergeExerciseLibrary, mergeWithInitialState } from './AppContext';
import { createInitialState } from '@/utils/initialState';
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

describe('mergeWithInitialState', () => {
  it('starts with empty user data while retaining the built-in exercise library', () => {
    const initial = createInitialState();

    expect(initial.dailyWorkout).toBeNull();
    expect(initial.workoutHistory).toEqual([]);
    expect(initial.workoutTemplates).toEqual([]);
    expect(initial.bodyMetrics).toEqual([]);
    expect(initial.metricTargets).toEqual([]);
    expect(initial.bodyPhotos).toEqual([]);
    expect(initial.folders).toEqual([]);
    expect(initial.notes).toEqual([]);
    expect(initial.exerciseLibrary.length).toBeGreaterThan(0);
  });

  it('preserves intentionally cleared collections and a null daily workout', () => {
    const merged = mergeWithInitialState({
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
    const merged = mergeWithInitialState({ bodyUnlocked: true });
    expect(merged.bodyUnlocked).toBe(false);
  });

  it('removes legacy seeded records without deleting user-created records', () => {
    const userWorkout: DailyWorkout = {
      id: 'user-workout',
      date: '2026-08-02',
      name: '用户训练',
      exercises: [strengthExercise()],
      totalVolume: 400,
      muscleGroups: ['背'],
    };
    const merged = mergeWithInitialState({
      dailyWorkout: {
        ...userWorkout,
        id: 'demo-today',
      },
      workoutHistory: [
        { ...userWorkout, id: 'demo-history-1' },
        userWorkout,
      ],
      bodyMetrics: [
        { id: 'demo-weight-0', type: 'weight', value: 55, date: '2026-07-01', timestamp: 1 },
        { id: 'user-weight', type: 'weight', value: 52, date: '2026-08-01', timestamp: 2 },
      ],
      metricTargets: [
        { type: 'weight', target: 53 },
        { type: 'chest', target: 85 },
      ],
      folders: [
        { id: 'demo-folder-training', name: '样例', icon: 'fa-folder', color: 'green', expanded: true },
        { id: 'user-folder', name: '我的文件夹', icon: 'fa-folder', color: 'green', expanded: true },
      ],
      notes: [
        { id: 'demo-note-1', title: '样例', content: '', folderId: null, createdAt: 1, updatedAt: 1 },
        { id: 'user-note', title: '我的笔记', content: '', folderId: 'user-folder', createdAt: 2, updatedAt: 2 },
      ],
    });

    expect(merged.dailyWorkout).toBeNull();
    expect(merged.workoutHistory.map((item) => item.id)).toEqual(['user-workout']);
    expect(merged.bodyMetrics.map((item) => item.id)).toEqual(['user-weight']);
    expect(merged.metricTargets).toEqual([{ type: 'chest', target: 85 }]);
    expect(merged.folders.map((item) => item.id)).toEqual(['user-folder']);
    expect(merged.notes.map((item) => item.id)).toEqual(['user-note']);
  });

  it('refreshes renamed built-in exercises in saved workout records', () => {
    const renamedExercise = strengthExercise({
      id: 'bent_over_dumbbell_reverse_fly',
      name: '俯身哑铃侧平举',
    });
    const workout: DailyWorkout = {
      id: 'renamed-exercise-workout',
      date: '2026-08-01',
      name: '肩部训练',
      exercises: [renamedExercise],
      totalVolume: 400,
      muscleGroups: ['肩'],
    };
    const merged = mergeWithInitialState({
      workoutHistory: [workout],
    });

    expect(merged.workoutHistory[0].exercises[0].name).toBe('俯身侧平举');
  });
});

describe('mergeExerciseLibrary', () => {
  it('adds new built-in exercises and refreshes media paths for an existing built-in library', () => {
    const oldLibrary = createInitialState().exerciseLibrary
      .filter((exercise) => ![
        'pullup',
        'crunch',
        'dumbbell_curl',
        'barbell_curl',
        'rope_pushdown',
        'assisted_dip',
      ].includes(exercise.id))
      .map((exercise) => exercise.id === 'barbell_benchpress'
        ? { ...exercise, gifUrl: 'images/exercises/卧推.gif' }
        : exercise.id === 'bent_over_dumbbell_reverse_fly'
          ? { ...exercise, name: '俯身哑铃侧平举', gifUrl: undefined }
          : { ...exercise, gifUrl: undefined });
    oldLibrary.push(
      strengthExercise({ id: 'cable_lateral_raise', name: '绳索侧平举' }),
      strengthExercise({ id: 'reverse_pec_deck', name: '器械反向飞鸟' })
    );

    const merged = mergeExerciseLibrary(oldLibrary);

    expect(merged.find((exercise) => exercise.id === 'barbell_benchpress')?.gifUrl)
      .toBe('images/exercises/barbell_benchpress.png');
    expect(merged.find((exercise) => exercise.id === 'bent_over_dumbbell_reverse_fly')?.name)
      .toBe('俯身侧平举');
    expect(merged).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'pullup' }),
      expect.objectContaining({ id: 'bent_over_dumbbell_reverse_fly' }),
      expect.objectContaining({ id: 'crunch', name: '吊杠屈腿卷腹' }),
      expect.objectContaining({ id: 'dumbbell_curl' }),
      expect.objectContaining({ id: 'barbell_curl' }),
      expect.objectContaining({ id: 'rope_pushdown' }),
      expect.objectContaining({ id: 'assisted_dip', name: '双杠臂屈伸', volumeMode: 'assisted-bodyweight' }),
    ]));
    expect(merged.some((exercise) => exercise.id === 'cable_lateral_raise')).toBe(false);
    expect(merged.some((exercise) => exercise.id === 'reverse_pec_deck')).toBe(false);
    const muscleGroups = [...new Set(merged.map((exercise) => exercise.muscleGroup))];
    expect(muscleGroups[muscleGroups.length - 1]).toBe('有氧');
  });

  it('keeps an intentionally empty or small custom library custom', () => {
    expect(mergeExerciseLibrary([])).toEqual([]);

    const custom = [strengthExercise({ id: 'custom-only', gifUrl: 'custom.gif' })];
    expect(mergeExerciseLibrary(custom)).toEqual(custom);
  });
});

describe('body metrics reducer', () => {
  it('adds weight and recalculates BMI for the same day', () => {
    const state = { ...createInitialState(), bodyMetrics: [] };
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
    const state = { ...createInitialState(), bodyPhotos: [photo] };
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
    const state = { ...createInitialState(), dailyWorkout: null, workoutHistory: [] };
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

  it('calculates assisted dip volume from body weight minus assistance in kg', () => {
    const assistedDip: Exercise = {
      id: 'assisted_dip',
      name: '双杠臂屈伸',
      muscleGroup: '胸',
      category: 'strength',
      useLeftRight: false,
      volumeMode: 'assisted-bodyweight',
      bodyWeightKg: 60,
      sets: [
        { id: 'assisted-1', weight: 20, reps: 10, completed: true },
        { id: 'assisted-2', weight: 70, reps: 8, completed: true },
        { id: 'assisted-3', weight: 10, reps: 5, completed: false },
      ],
    };

    expect(calculateVolume(assistedDip)).toBe(400);
    expect(calculateVolume(assistedDip, 'lbs')).toBe(400);
  });

  it('prefills assisted dip body weight from the latest body metric as an integer', () => {
    const assistedDip = createInitialState().exerciseLibrary.find(
      (exercise) => exercise.id === 'assisted_dip'
    );
    expect(assistedDip).toBeDefined();

    const state = {
      ...createInitialState(),
      dailyWorkout: null,
      bodyMetrics: [
        { id: 'weight-old', type: 'weight' as const, value: 58, date: '2026-07-01', timestamp: 1 },
        { id: 'weight-new', type: 'weight' as const, value: 56.5, date: '2026-08-01', timestamp: 2 },
      ],
    };
    const next = appReducer(state, {
      type: 'ADD_EXERCISE_TO_WORKOUT',
      payload: assistedDip!,
    });

    expect(next.dailyWorkout?.exercises[0].bodyWeightKg).toBe(57);
    expect(next.dailyWorkout?.exercises[0].sets[0].weight).toBe(0);
  });

  it('refreshes the current assisted dip when the latest body weight is saved', () => {
    const assistedDip: Exercise = {
      id: 'assisted_dip',
      name: '双杠臂屈伸',
      muscleGroup: '胸',
      category: 'strength',
      useLeftRight: false,
      volumeMode: 'assisted-bodyweight',
      bodyWeightKg: 50,
      sets: [{ id: 'assisted-live', weight: 20, reps: 10, completed: true }],
    };
    const state = {
      ...createInitialState(),
      bodyMetrics: [],
      dailyWorkout: {
        id: 'assisted-live-workout',
        date: getTodayString(),
        name: '胸部训练',
        exercises: [assistedDip],
        totalVolume: 300,
        muscleGroups: ['胸'],
      },
    };

    const next = appReducer(state, {
      type: 'ADD_BODY_METRIC',
      payload: { type: 'weight', value: 61.6 },
    });

    expect(next.dailyWorkout?.exercises[0].bodyWeightKg).toBe(62);
    expect(next.dailyWorkout?.totalVolume).toBe(420);
  });

  it('removes a persisted historical workout by id', () => {
    const workout: DailyWorkout = {
      id: 'history-to-remove',
      date: '2026-08-01',
      name: '待删除训练',
      exercises: [strengthExercise()],
      totalVolume: 400,
      muscleGroups: ['背'],
    };
    const state = { ...createInitialState(), workoutHistory: [workout] };
    const next = appReducer(state, {
      type: 'REMOVE_WORKOUT_RECORD',
      payload: { workoutId: workout.id },
    });

    expect(next.workoutHistory.some((item) => item.id === workout.id)).toBe(false);
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
          distanceKm: 3.2,
          intensity: 6,
        },
      ],
      totalVolume: 1030,
      muscleGroups: ['背', '有氧'],
      cardioName: '爬坡',
    };
    const state = {
      ...createInitialState(),
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
    expect(next.dailyWorkout?.exercises[1].distanceKm).toBeUndefined();
    expect(next.dailyWorkout?.exercises[1].intensity).toBeUndefined();
    expect(next.workoutHistory[0]).toEqual(historyWorkout);
  });

  it('records only cardio duration without creating fake strength volume', () => {
    const cardio: Exercise = {
      id: 'swimming',
      name: '游泳',
      muscleGroup: '有氧',
      category: 'cardio',
      useLeftRight: false,
      sets: [],
      distanceKm: 1.8,
      intensity: 7,
    };
    const state = {
      ...createInitialState(),
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
        updates: { durationMinutes: 45 },
      },
    });

    expect(next.dailyWorkout?.exercises[0].durationMinutes).toBe(45);
    expect(next.dailyWorkout?.exercises[0].distanceKm).toBeUndefined();
    expect(next.dailyWorkout?.exercises[0].intensity).toBeUndefined();
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
      ...createInitialState(),
      weightUnit: 'kg' as const,
      dailyWorkout: workout,
      workoutHistory: [],
    };
    const next = appReducer(state, { type: 'SET_WEIGHT_UNIT', payload: 'lbs' });

    expect(next.dailyWorkout?.exercises[0].sets[0].weight).toBe(22);
    expect(next.dailyWorkout?.totalVolume).toBeCloseTo(99.79, 1);
  });

  it('keeps assisted dip body weight and assistance fixed in kg when global units change', () => {
    const assistedDip: Exercise = {
      id: 'assisted_dip',
      name: '双杠臂屈伸',
      muscleGroup: '胸',
      category: 'strength',
      useLeftRight: false,
      volumeMode: 'assisted-bodyweight',
      bodyWeightKg: 60,
      sets: [{ id: 'assisted-set', weight: 20, reps: 10, completed: true }],
    };
    const state = {
      ...createInitialState(),
      weightUnit: 'kg' as const,
      dailyWorkout: {
        id: 'assisted-unit-test',
        date: '2026-08-04',
        name: '胸部训练',
        exercises: [assistedDip],
        totalVolume: 400,
        muscleGroups: ['胸'],
      },
      workoutHistory: [],
    };
    const next = appReducer(state, { type: 'SET_WEIGHT_UNIT', payload: 'lbs' });

    expect(next.dailyWorkout?.exercises[0].bodyWeightKg).toBe(60);
    expect(next.dailyWorkout?.exercises[0].sets[0].weight).toBe(20);
    expect(next.dailyWorkout?.totalVolume).toBe(400);
  });
});

describe('workout templates reducer', () => {
  it('adds, applies, and removes a template using only library exercises', () => {
    const initial = {
      ...createInitialState(),
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
      ...createInitialState(),
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

  it('inherits each exercise from its own latest workout while preserving template order', () => {
    const template = {
      id: 'template-mixed',
      name: '胸背组合',
      exerciseIds: ['barbell_row', 'squat'],
      createdAt: 1,
    };
    const olderSquatWorkout: DailyWorkout = {
      id: 'older-squat',
      date: '2026-07-20',
      name: '腿部训练',
      exercises: [strengthExercise({
        id: 'squat',
        name: '深蹲',
        muscleGroup: '腿',
        sets: [
          { id: 'squat-1', weight: 50, reps: 10, completed: true },
          { id: 'squat-2', weight: 55, reps: 8, completed: true },
        ],
      })],
      totalVolume: 940,
      muscleGroups: ['腿'],
    };
    const newerRowWorkout: DailyWorkout = {
      id: 'newer-row',
      date: '2026-08-01',
      name: '背部训练',
      exercises: [strengthExercise({
        id: 'barbell_row',
        name: '杠铃划船',
        muscleGroup: '背',
        sets: [
          { id: 'row-1', weight: 30, reps: 12, completed: true },
          { id: 'row-2', weight: 35, reps: 10, completed: true },
          { id: 'row-3', weight: 35, reps: 8, completed: true },
        ],
      })],
      totalVolume: 990,
      muscleGroups: ['背'],
    };
    const state = {
      ...createInitialState(),
      dailyWorkout: null,
      workoutHistory: [newerRowWorkout, olderSquatWorkout],
      workoutTemplates: [template],
    };

    const applied = appReducer(state, {
      type: 'APPLY_WORKOUT_TEMPLATE',
      payload: { templateId: template.id },
    });

    expect(applied.dailyWorkout?.exercises.map((exercise) => exercise.id)).toEqual([
      'barbell_row',
      'squat',
    ]);
    expect(applied.dailyWorkout?.exercises[0].sets).toHaveLength(3);
    expect(applied.dailyWorkout?.exercises[0].sets.map((set) => [set.weight, set.reps])).toEqual([
      [30, 12],
      [35, 10],
      [35, 8],
    ]);
    expect(applied.dailyWorkout?.exercises[1].sets).toHaveLength(2);
    expect(applied.dailyWorkout?.exercises[1].sets.map((set) => [set.weight, set.reps])).toEqual([
      [50, 10],
      [55, 8],
    ]);
    expect(applied.dailyWorkout?.exercises.flatMap((exercise) => exercise.sets).every(
      (set) => !set.completed
    )).toBe(true);
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
    const state = createInitialState();
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
