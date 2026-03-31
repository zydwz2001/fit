export { DESIGN } from '@/types';
export type { AppState, BodyMetric, MetricTarget } from '@/types';
import type { Set as ExerciseSet } from '@/types';

// 身高固定 158cm
export const FIXED_HEIGHT = 158;

// 计算 BMI
export function calculateBMI(weight: number): number {
  const heightInM = FIXED_HEIGHT / 100;
  return Number((weight / (heightInM * heightInM)).toFixed(1));
}

// 计算训练容量
export function calculateVolume(exercise: { sets: ExerciseSet[] }): number {
  return exercise.sets
    .filter(set => set.completed)
    .reduce((sum, set) => {
      if (set.leftWeight !== undefined && set.rightWeight !== undefined) {
        return sum + (set.leftWeight + set.rightWeight) * set.reps;
      }
      return sum + set.weight * set.reps;
    }, 0);
}

// 格式化日期
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 获取今日日期字符串
export function getTodayString(): string {
  return formatDate(new Date());
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
