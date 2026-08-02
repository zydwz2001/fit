import type { AppState } from '@/types';

const STORAGE_KEY = 'vibe-fitness-data';

type ImportResult =
  | { success: true; data: Partial<AppState> }
  | { success: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasValidArray(value: Record<string, unknown>, key: string): boolean {
  return value[key] === undefined || Array.isArray(value[key]);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalFiniteNumber(value: unknown): value is number | undefined {
  return value === undefined || isFiniteNumber(value);
}

function isValidSet(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    isFiniteNumber(value.reps) &&
    value.reps >= 0 &&
    typeof value.completed === 'boolean' &&
    isOptionalFiniteNumber(value.weight) &&
    isOptionalFiniteNumber(value.leftWeight) &&
    isOptionalFiniteNumber(value.rightWeight)
  );
}

function isValidExercise(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.muscleGroup === 'string' &&
    (value.category === 'strength' || value.category === 'cardio') &&
    typeof value.useLeftRight === 'boolean' &&
    Array.isArray(value.sets) &&
    value.sets.every(isValidSet) &&
    (value.gifUrl === undefined || typeof value.gifUrl === 'string') &&
    isOptionalFiniteNumber(value.durationMinutes) &&
    isOptionalFiniteNumber(value.distanceKm) &&
    isOptionalFiniteNumber(value.intensity)
  );
}

function isValidWorkout(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    typeof value.name === 'string' &&
    (value.templateId === undefined || typeof value.templateId === 'string') &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isValidExercise) &&
    isFiniteNumber(value.totalVolume) &&
    Array.isArray(value.muscleGroups) &&
    value.muscleGroups.every((group) => typeof group === 'string') &&
    (value.cardioName === undefined || typeof value.cardioName === 'string')
  );
}

function isValidWorkoutTemplate(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.exerciseIds) &&
    value.exerciseIds.every((id) => typeof id === 'string') &&
    isFiniteNumber(value.createdAt)
  );
}

const METRIC_TYPES = new Set(['weight', 'bmi', 'waist', 'arm', 'chest', 'hip', 'thigh']);

function isMetricType(value: unknown): boolean {
  return typeof value === 'string' && METRIC_TYPES.has(value);
}

function isValidBodyMetric(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    isMetricType(value.type) &&
    isFiniteNumber(value.value) &&
    typeof value.date === 'string' &&
    isFiniteNumber(value.timestamp)
  );
}

function isValidMetricTarget(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isMetricType(value.type) && isFiniteNumber(value.target);
}

function isValidBodyPhoto(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.uri === 'string' &&
    typeof value.date === 'string' &&
    isFiniteNumber(value.timestamp)
  );
}

function isValidFolder(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.icon === 'string' &&
    typeof value.color === 'string' &&
    typeof value.expanded === 'boolean'
  );
}

function isValidNote(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.content === 'string' &&
    (value.folderId === null || typeof value.folderId === 'string') &&
    isFiniteNumber(value.createdAt) &&
    isFiniteNumber(value.updatedAt)
  );
}

function hasValidItems(
  value: Record<string, unknown>,
  key: string,
  validator: (item: unknown) => boolean
): boolean {
  return hasValidArray(value, key) &&
    (!Array.isArray(value[key]) || value[key].every(validator));
}

function isValidBackup(value: unknown): value is Partial<AppState> {
  if (!isRecord(value)) return false;

  const knownKeys = [
    'dailyWorkout',
    'workoutHistory',
    'workoutTemplates',
    'exerciseLibrary',
    'bodyMetrics',
    'metricTargets',
    'bodyPhotos',
    'folders',
    'notes',
    'weightUnit',
  ];
  if (!knownKeys.some((key) => key in value)) return false;

  if (value.dailyWorkout !== undefined && value.dailyWorkout !== null && !isValidWorkout(value.dailyWorkout)) {
    return false;
  }
  if (!hasValidItems(value, 'workoutHistory', isValidWorkout)) return false;
  if (!hasValidItems(value, 'workoutTemplates', isValidWorkoutTemplate)) return false;
  if (!hasValidItems(value, 'exerciseLibrary', isValidExercise)) return false;
  if (!hasValidItems(value, 'bodyMetrics', isValidBodyMetric)) return false;
  if (!hasValidItems(value, 'metricTargets', isValidMetricTarget)) return false;
  if (!hasValidItems(value, 'bodyPhotos', isValidBodyPhoto)) return false;
  if (!hasValidItems(value, 'folders', isValidFolder)) return false;
  if (!hasValidItems(value, 'notes', isValidNote)) return false;

  if (value.weightUnit !== undefined && value.weightUnit !== 'kg' && value.weightUnit !== 'lbs') {
    return false;
  }
  if (value.bodyUnlocked !== undefined && typeof value.bodyUnlocked !== 'boolean') return false;
  if (
    value.selectedFolderId !== undefined &&
    value.selectedFolderId !== null &&
    typeof value.selectedFolderId !== 'string'
  ) {
    return false;
  }

  return true;
}

export async function loadData(): Promise<Partial<AppState> | null> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed: unknown = JSON.parse(data);
    return isValidBackup(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveData(data: Partial<AppState>): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
}

export async function exportData(data?: Partial<AppState>): Promise<string> {
  const payload = data ?? await loadData();
  if (!payload) {
    throw new Error('没有可导出的数据');
  }
  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonString: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, message: 'JSON 格式无效，请检查文件内容。' };
  }

  if (!isValidBackup(parsed)) {
    return { success: false, message: '这不是有效的 Vibe Fitness 备份文件。' };
  }

  const saved = await saveData(parsed);
  if (!saved) {
    return { success: false, message: '浏览器存储空间不足，导入未完成。' };
  }

  return { success: true, data: parsed };
}
