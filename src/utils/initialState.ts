import type { AppState } from '@/types';
import { DEFAULT_EXERCISES } from '@/types';

export function createInitialState(): AppState {
  return {
    dailyWorkout: null,
    workoutHistory: [],
    exerciseLibrary: DEFAULT_EXERCISES.map((exercise) => ({
      ...exercise,
      sets: [],
    })),
    workoutTemplates: [],
    bodyMetrics: [],
    metricTargets: [],
    bodyPhotos: [],
    bodyUnlocked: false,
    folders: [],
    notes: [],
    selectedFolderId: null,
    weightUnit: 'kg',
  };
}
