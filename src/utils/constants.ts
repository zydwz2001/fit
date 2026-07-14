import type { Set as ExerciseSet, AppState, BodyMetric, MetricTarget } from '@/types';
export { DESIGN } from '@/types';
export type { AppState, BodyMetric, MetricTarget };

export const FIXED_HEIGHT = 158;

export function calculateBMI(weight: number): number {
  const heightInM = FIXED_HEIGHT / 100;
  return Number((weight / (heightInM * heightInM)).toFixed(1));
}

export function calculateVolume(exercise: { sets: ExerciseSet[] }, weightUnit: 'kg' | 'lbs' = 'kg'): number {
  const toKg = (w: number | undefined): number => {
    if (w === undefined) return 0;
    if (weightUnit === 'lbs') {
      return w * 0.45;
    }
    return w;
  };

  return exercise.sets
    .filter(set => set.completed)
    .reduce((sum, set) => {
      if (set.leftWeight !== undefined && set.rightWeight !== undefined) {
        return sum + (toKg(set.leftWeight) + toKg(set.rightWeight)) * set.reps;
      }
      return sum + toKg(set.weight) * set.reps;
    }, 0);
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDisplayDate(date: Date): string {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 星期${weekDay}`;
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
