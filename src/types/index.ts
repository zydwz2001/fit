export const DESIGN = {
  BRAND_COLOR: '#10B981',
  COMPONENT_HEIGHT: 40,
  BORDER_RADIUS: 12,
  BODY_PASSWORD: '1127',
  FIXED_HEIGHT: 158,
} as const;

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
  durationMinutes?: number;
  distanceKm?: number;
  intensity?: number;
  volumeMode?: 'assisted-bodyweight';
  bodyWeightKg?: number;
}

export interface DailyWorkout {
  id: string;
  date: string;
  name: string;
  templateId?: string;
  exercises: Exercise[];
  totalVolume: number;
  muscleGroups: string[];
  cardioName?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: number;
}

export type MetricType = 'weight' | 'bmi' | 'waist' | 'arm' | 'chest' | 'hip' | 'thigh';

export interface BodyMetric {
  id: string;
  type: MetricType;
  value: number;
  date: string;
  timestamp: number;
}

export interface MetricTarget {
  type: MetricType;
  target: number;
}

export interface BodyPhoto {
  id: string;
  uri: string;
  date: string;
  timestamp: number;
}

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

export const MUSCLE_GROUP_NAMES: Record<string, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '臂',
  core: '核心',
};

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: 'squat', name: '深蹲', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/squat.png' },
  { id: 'deadlift', name: '硬拉', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/deadlift.png' },
  { id: 'hip_abduction', name: '髋外展', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/hip_abduction.png' },
  { id: 'hip_adduction', name: '髋内收', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/hip_adduction.png' },
  { id: 'bulgarian_squat', name: '保加利亚深蹲', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/bulgarian_squat.png' },
  { id: 'single_leg_dumbbell_deadlift', name: '单腿哑铃硬拉', muscleGroup: '腿', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/single_leg_dumbbell_deadlift.png' },

  { id: 'australian_pullup', name: '澳式引体', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/australian_pullup.png' },
  { id: 'pullup', name: '引体向上', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/pullup.png' },
  { id: 'barbell_row', name: '杠铃划船', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/barbell_row.png' },
  { id: 'dumbbell_row', name: '哑铃划船', muscleGroup: '背', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/dumbbell_row.png' },
  { id: 'tbar_row', name: 'T杠划船', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/tbar_row.png' },
  { id: 'romanian_deadlift', name: '罗马尼亚硬拉', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/romanian_deadlift.png' },
  { id: 'lat_pulldown', name: '高位下拉', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/lat_pulldown.png' },
  { id: 'reverse_lat_pulldown', name: '反手高位下拉', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/reverse_lat_pulldown.png' },

  { id: 'barbell_benchpress', name: '杠铃卧推', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/barbell_benchpress.png' },
  { id: 'dumbbell_benchpress', name: '哑铃卧推', muscleGroup: '胸', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/dumbbell_benchpress.png' },
  { id: 'pushup', name: '俯卧撑', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/pushup.png' },
  { id: 'incline_dumbbell_press', name: '哑铃上斜卧推', muscleGroup: '胸', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/incline_dumbbell_press.png' },
  { id: 'cable_fly', name: '器械飞鸟', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/cable_fly.png' },
  { id: 'assisted_dip', name: '双杠臂屈伸', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/assisted_dip.png', volumeMode: 'assisted-bodyweight' },

  { id: 'dumbbell_lateral_raise', name: '哑铃侧平举', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/dumbbell_lateral_raise.png' },
  { id: 'dumbbell_shoulder_press', name: '哑铃推肩', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/dumbbell_shoulder_press.png' },
  { id: 'standing_overhead_press', name: '站姿实力推', muscleGroup: '肩', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/standing_overhead_press.png' },
  { id: 'bent_over_dumbbell_reverse_fly', name: '俯身侧平举', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/bent_over_dumbbell_reverse_fly.png' },

  { id: 'dumbbell_curl', name: '哑铃弯举', muscleGroup: '臂', category: 'strength', useLeftRight: true, sets: [], gifUrl: 'images/exercises/dumbbell_curl.png' },
  { id: 'barbell_curl', name: '杠铃弯举', muscleGroup: '臂', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/barbell_curl.png' },
  { id: 'rope_pushdown', name: '绳索下压', muscleGroup: '臂', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/rope_pushdown.png' },

  { id: 'crunch', name: '吊杠屈腿卷腹', muscleGroup: '核心', category: 'strength', useLeftRight: false, sets: [], gifUrl: 'images/exercises/crunch.png' },

  { id: 'swimming', name: '游泳', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [], gifUrl: 'images/exercises/swimming.png' },
  { id: 'rock_climbing', name: '攀岩', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [], gifUrl: 'images/exercises/rock_climbing.png' },
  { id: 'kickboxing', name: '自由搏击', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [], gifUrl: 'images/exercises/kickboxing.png' },
  { id: 'hill_climbing', name: '爬坡', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [], gifUrl: 'images/exercises/hill_climbing.png' },
  { id: 'stair_climber', name: '爬楼机', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [], gifUrl: 'images/exercises/stair_climber.png' },
];

export interface AppState {
  dailyWorkout: DailyWorkout | null;
  workoutHistory: DailyWorkout[];
  exerciseLibrary: Exercise[];
  workoutTemplates: WorkoutTemplate[];

  bodyMetrics: BodyMetric[];
  metricTargets: MetricTarget[];
  bodyPhotos: BodyPhoto[];
  bodyUnlocked: boolean;

  folders: Folder[];
  notes: Note[];
  selectedFolderId: string | null;

  weightUnit: 'kg' | 'lbs';
}
