// 设计系统常量
export const DESIGN = {
  BRAND_COLOR: '#10B981',
  COMPONENT_HEIGHT: 40,
  BORDER_RADIUS: 12,
  BODY_PASSWORD: '1127',
  FIXED_HEIGHT: 158, // cm
} as const;

// 训练相关类型
export interface Set {
  id: string;
  weight: number;
  reps: number;
  leftWeight?: number;
  rightWeight?: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  gifUrl?: string;
  sets: Set[];
  useLeftRight: boolean;
}

export interface DailyWorkout {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  exercises: Exercise[];
  totalVolume: number;
  muscleGroups: string[];
  cardioName?: string;
}

// 身体数据相关类型
export type MetricType = 'weight' | 'bmi' | 'waist' | 'arm' | 'chest' | 'hip' | 'thigh';

export interface BodyMetric {
  id: string;
  type: MetricType;
  value: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface MetricTarget {
  type: MetricType;
  target: number;
}

export interface BodyPhoto {
  id: string;
  uri: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

// 知识模块类型
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  expanded: boolean;
}

// 肌肉群映射
export const MUSCLE_GROUPS: Record<string, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '臂',
  core: '核心',
};

// 内置动作库
export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'squat',
    name: '深蹲',
    muscleGroup: '腿',
    useLeftRight: false,
    sets: [],
  },
  {
    id: 'pullup',
    name: '引体向上',
    muscleGroup: '背',
    useLeftRight: false,
    sets: [],
  },
  {
    id: 'benchpress',
    name: '卧推',
    muscleGroup: '胸',
    useLeftRight: false,
    sets: [],
  },
];

// 应用状态类型
export interface AppState {
  // 训练模块
  dailyWorkout: DailyWorkout | null;
  workoutHistory: DailyWorkout[];
  exerciseLibrary: Exercise[];

  // 身体模块
  bodyMetrics: BodyMetric[];
  metricTargets: MetricTarget[];
  bodyPhotos: BodyPhoto[];
  bodyUnlocked: boolean;

  // 知识模块
  folders: Folder[];
  notes: Note[];
  selectedFolderId: string | null;
}
