import type { AppState, BodyMetric, DailyWorkout, Exercise, Folder, Note, Set as ExerciseSet } from '@/types';
import { DEFAULT_EXERCISES } from '@/types';
import { calculateBMI, calculateVolume, formatDate, getTodayString } from '@/utils/constants';

const metricDates = [-35, -28, -21, -14, -7, 0];

function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function timestamp(date: string, hour = 8): number {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime();
}

function set(id: string, weight: number, reps: number, completed = true): ExerciseSet {
  return { id, weight, reps, completed };
}

function sideSet(id: string, leftWeight: number, rightWeight: number, reps: number, completed = true): ExerciseSet {
  return { id, weight: 0, leftWeight, rightWeight, reps, completed };
}

function exercise(id: string, sets: ExerciseSet[]): Exercise {
  const base = DEFAULT_EXERCISES.find((item) => item.id === id);
  if (!base) {
    throw new Error(`Missing demo exercise: ${id}`);
  }
  return { ...base, sets };
}

function workout(id: string, date: string, name: string, exercises: Exercise[], cardioName?: string): DailyWorkout {
  const muscleGroups = [...new Set(exercises.map((item) => item.muscleGroup))];
  return {
    id,
    date,
    name,
    exercises,
    totalVolume: exercises.reduce((sum, item) => sum + calculateVolume(item), 0),
    muscleGroups,
    cardioName,
  };
}

function bodyMetrics(): BodyMetric[] {
  const weight = [55.8, 55.4, 55.0, 54.6, 54.2, 53.9];
  const waist = [69.5, 68.8, 68.2, 67.6, 67.0, 66.5];
  const arm = [27.4, 27.5, 27.7, 27.9, 28.0, 28.2];
  const chest = [83.0, 83.3, 83.6, 84.0, 84.1, 84.4];
  const hip = [91.8, 91.6, 91.3, 91.0, 90.7, 90.4];
  const thigh = [53.2, 53.0, 52.8, 52.6, 52.3, 52.0];

  return metricDates.flatMap((offset, index) => {
    const date = dateOffset(offset);
    return [
      { id: `demo-weight-${index}`, type: 'weight', value: weight[index], date, timestamp: timestamp(date, 8) },
      { id: `demo-bmi-${index}`, type: 'bmi', value: calculateBMI(weight[index]), date, timestamp: timestamp(date, 8) + 1 },
      { id: `demo-waist-${index}`, type: 'waist', value: waist[index], date, timestamp: timestamp(date, 9) },
      { id: `demo-arm-${index}`, type: 'arm', value: arm[index], date, timestamp: timestamp(date, 9) + 1 },
      { id: `demo-chest-${index}`, type: 'chest', value: chest[index], date, timestamp: timestamp(date, 9) + 2 },
      { id: `demo-hip-${index}`, type: 'hip', value: hip[index], date, timestamp: timestamp(date, 9) + 3 },
      { id: `demo-thigh-${index}`, type: 'thigh', value: thigh[index], date, timestamp: timestamp(date, 9) + 4 },
    ] satisfies BodyMetric[];
  });
}

function knowledgeFolders(): Folder[] {
  return [
    { id: 'demo-folder-nutrition', name: '营养补剂', icon: 'fa-bowl-food', color: 'amber', expanded: true },
    { id: 'demo-folder-training', name: '训练计划', icon: 'fa-dumbbell', color: 'blue', expanded: true },
    { id: 'demo-folder-technique', name: '动作要点', icon: 'fa-book', color: 'green', expanded: true },
    { id: 'demo-folder-recovery', name: '恢复拉伸', icon: 'fa-heart-pulse', color: 'pink', expanded: false },
  ];
}

function knowledgeNotes(): Note[] {
  const now = Date.now();
  return [
    {
      id: 'demo-note-protein',
      title: '蛋白质摄入备忘',
      content: '训练日优先保证正餐蛋白，每餐 25-35g。晚训后用酸奶、鸡蛋或乳清补齐缺口。',
      folderId: 'demo-folder-nutrition',
      createdAt: now - 7 * 86400000,
      updatedAt: now - 2 * 86400000,
    },
    {
      id: 'demo-note-creatine',
      title: '肌酸与电解质',
      content: '肌酸每日 3-5g 即可，不需要冲击期。夏天训练出汗多时补钠和水，避免后半程掉状态。',
      folderId: 'demo-folder-nutrition',
      createdAt: now - 6 * 86400000,
      updatedAt: now - 2 * 86400000,
    },
    {
      id: 'demo-note-split',
      title: '七月四练拆分',
      content: '周一背，周三腿，周五胸肩，周日有氧加核心。每周保留一次灵活调整给攀岩或游泳。',
      folderId: 'demo-folder-training',
      createdAt: now - 5 * 86400000,
      updatedAt: now - 1 * 86400000,
    },
    {
      id: 'demo-note-deload',
      title: '减量周规则',
      content: '当连续两次主项完成度低于 80%，下一周总组数减 30%，保留动作模式但降低重量。',
      folderId: 'demo-folder-training',
      createdAt: now - 4 * 86400000,
      updatedAt: now - 1 * 86400000,
    },
    {
      id: 'demo-note-row',
      title: '划船发力提示',
      content: '先沉肩，再把肘往髋部带。顶峰停 0.5 秒，避免耸肩和用腰甩重量。',
      folderId: 'demo-folder-technique',
      createdAt: now - 3 * 86400000,
      updatedAt: now - 12 * 3600000,
    },
    {
      id: 'demo-note-squat',
      title: '深蹲检查清单',
      content: '热身组拍一条侧面视频：脚跟稳定、膝盖方向一致、底部不要松背。',
      folderId: 'demo-folder-technique',
      createdAt: now - 2 * 86400000,
      updatedAt: now - 10 * 3600000,
    },
    {
      id: 'demo-note-sleep',
      title: '睡眠恢复记录',
      content: '晚训后 30 分钟内结束高刺激内容，拉伸 8 分钟，睡前不再加咖啡因。',
      folderId: 'demo-folder-recovery',
      createdAt: now - 86400000,
      updatedAt: now - 6 * 3600000,
    },
  ];
}

export function createDemoState(): AppState {
  const today = getTodayString();
  const dailyWorkout = workout('demo-today', today, '练背日', [
    exercise('lat_pulldown', [
      set('demo-today-lat-1', 42.5, 12),
      set('demo-today-lat-2', 45, 10),
      set('demo-today-lat-3', 47.5, 8, false),
    ]),
    exercise('dumbbell_row', [
      sideSet('demo-today-row-1', 18, 18, 12),
      sideSet('demo-today-row-2', 20, 20, 10),
      sideSet('demo-today-row-3', 20, 20, 8, false),
    ]),
    exercise('stair_climber', []),
  ], '爬楼机');

  const history = [
    workout('demo-history-1', dateOffset(-13), '练腿日', [
      exercise('squat', [
        set('demo-h1-squat-1', 55, 10),
        set('demo-h1-squat-2', 57.5, 8),
        set('demo-h1-squat-3', 60, 6),
      ]),
      exercise('bulgarian_squat', [
        set('demo-h1-bul-1', 16, 10),
        set('demo-h1-bul-2', 16, 8),
      ]),
    ]),
    workout('demo-history-2', dateOffset(-10), '练胸日', [
      exercise('barbell_benchpress', [
        set('demo-h2-bench-1', 35, 10),
        set('demo-h2-bench-2', 37.5, 8),
        set('demo-h2-bench-3', 40, 6),
      ]),
      exercise('cable_fly', [
        set('demo-h2-fly-1', 20, 12),
        set('demo-h2-fly-2', 20, 10),
      ]),
    ]),
    workout('demo-history-3', dateOffset(-8), '游泳恢复', [
      exercise('swimming', []),
    ], '游泳'),
    workout('demo-history-4', dateOffset(-6), '练肩日', [
      exercise('dumbbell_shoulder_press', [
        sideSet('demo-h4-press-1', 10, 10, 12),
        sideSet('demo-h4-press-2', 12, 12, 10),
        sideSet('demo-h4-press-3', 12, 12, 8),
      ]),
      exercise('dumbbell_lateral_raise', [
        sideSet('demo-h4-raise-1', 5, 5, 15),
        sideSet('demo-h4-raise-2', 5, 5, 12),
      ]),
    ]),
    workout('demo-history-5', dateOffset(-4), '练背日', [
      exercise('barbell_row', [
        set('demo-h5-row-1', 40, 10),
        set('demo-h5-row-2', 42.5, 8),
      ]),
      exercise('reverse_lat_pulldown', [
        set('demo-h5-pulldown-1', 40, 12),
        set('demo-h5-pulldown-2', 42.5, 10),
      ]),
    ]),
    workout('demo-history-6', dateOffset(-2), '核心有氧', [
      exercise('hill_climbing', []),
    ], '爬坡'),
  ];

  return {
    dailyWorkout,
    workoutHistory: history,
    exerciseLibrary: DEFAULT_EXERCISES,
    bodyMetrics: bodyMetrics(),
    metricTargets: [
      { type: 'weight', target: 53.0 },
      { type: 'waist', target: 65.0 },
      { type: 'arm', target: 29.0 },
      { type: 'hip', target: 90.0 },
    ],
    bodyPhotos: [],
    bodyUnlocked: true,
    folders: knowledgeFolders(),
    notes: knowledgeNotes(),
    selectedFolderId: null,
    weightUnit: 'kg',
  };
}
