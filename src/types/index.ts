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
  weight?: number;
  reps: number;
  leftWeight?: number;
  rightWeight?: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  category: 'strength' | 'cardio';
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
export const MUSCLE_GROUP_NAMES: Record<string, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '臂',
  core: '核心',
};

// 内置动作库 - 完整版本
export const DEFAULT_EXERCISES: Exercise[] = [
  // 腿部
  { id: 'squat', name: '深蹲', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'deadlift', name: '硬拉', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'hip_abduction', name: '髋外展', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'hip_adduction', name: '髋内收', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'bulgarian_squat', name: '保加利亚深蹲', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'single_leg_dumbbell_deadlift', name: '单腿哑铃硬拉', muscleGroup: '腿', category: 'strength', useLeftRight: true, sets: [] },

  // 背部
  { id: 'australian_pullup', name: '澳式引体', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'barbell_row', name: '杠铃划船', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'dumbbell_row', name: '哑铃划船', muscleGroup: '背', category: 'strength', useLeftRight: true, sets: [] },
  { id: 'tbar_row', name: 'T杠划船', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'romanian_deadlift', name: '罗马尼亚硬拉', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'lat_pulldown', name: '高位下拉', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'reverse_lat_pulldown', name: '反手高位下拉', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [] },

  // 胸部
  { id: 'barbell_benchpress', name: '杠铃卧推', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [], gifUrl: '/images/exercises/卧推.gif' },
  { id: 'dumbbell_benchpress', name: '哑铃卧推', muscleGroup: '胸', category: 'strength', useLeftRight: true, sets: [] },
  { id: 'pushup', name: '俯卧撑', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'incline_dumbbell_press', name: '哑铃上斜卧推', muscleGroup: '胸', category: 'strength', useLeftRight: true, sets: [] },
  { id: 'cable_fly', name: '器械飞鸟', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [] },

  // 肩部
  { id: 'dumbbell_lateral_raise', name: '哑铃侧平举', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [] },
  { id: 'cable_lateral_raise', name: '绳索侧平举', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [] },
  { id: 'dumbbell_shoulder_press', name: '哑铃推肩', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [] },
  { id: 'standing_overhead_press', name: '站姿实力推', muscleGroup: '肩', category: 'strength', useLeftRight: false, sets: [] },
  { id: 'reverse_pec_deck', name: '器械反向飞鸟', muscleGroup: '肩', category: 'strength', useLeftRight: false, sets: [] },

  // 有氧
  { id: 'swimming', name: '游泳', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
  { id: 'rock_climbing', name: '攀岩', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
  { id: 'kickboxing', name: '自由搏击', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
  { id: 'hill_climbing', name: '爬坡', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
  { id: 'stair_climber', name: '爬楼机', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
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

  // 设置
  weightUnit: 'kg' | 'lbs';
}
