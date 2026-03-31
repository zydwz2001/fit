import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, generateId, getTodayString, calculateBMI, calculateVolume } from '@/utils/constants';
import type { BodyMetric, MetricTarget, Exercise, Set as ExerciseSet, DailyWorkout } from '@/types';
import { DEFAULT_EXERCISES } from '@/types';
import { loadData, saveData } from '@/utils/storage';

interface AppContextType {
  state: AppState;
  dispatch: (action: Action) => void;
}

type Action =
  | { type: 'SET_BODY_UNLOCKED'; payload: boolean }
  | { type: 'ADD_BODY_METRIC'; payload: { type: any; value: number } }
  | { type: 'SET_METRIC_TARGET'; payload: { type: any; target: number } }
  | { type: 'INIT_DAILY_WORKOUT' }
  | { type: 'ADD_EXERCISE_TO_WORKOUT'; payload: Exercise }
  | { type: 'REMOVE_EXERCISE'; payload: { exerciseId: string } }
  | { type: 'REORDER_EXERCISES'; payload: { exerciseIds: string[] } }
  | { type: 'UPDATE_WORKOUT_NAME'; payload: { name: string } }
  | { type: 'ADD_SET'; payload: { exerciseId: string; set: ExerciseSet } }
  | { type: 'UPDATE_SET'; payload: { exerciseId: string; setId: string; updates: Partial<ExerciseSet> } }
  | { type: 'REMOVE_SET'; payload: { exerciseId: string; setId: string } }
  | { type: 'TOGGLE_SET_COMPLETED'; payload: { exerciseId: string; setId: string } }
  | { type: 'TOGGLE_LEFT_RIGHT_MODE'; payload: { exerciseId: string } };

// 肌肉群到训练日名称的映射
function getWorkoutName(firstMuscleGroup: string): string {
  const map: Record<string, string> = {
    '胸': '练胸日',
    '背': '练背日',
    '腿': '练腿日',
    '肩': '练肩日',
    '臂': '练臂日',
    '核心': '核心日',
    '背阔肌': '练背日',
    '胸大肌': '练胸日',
    '股四头肌': '练腿日',
  };
  return map[firstMuscleGroup] || '今日训练';
}

const initialState: AppState = {
  dailyWorkout: null,
  workoutHistory: [],
  exerciseLibrary: DEFAULT_EXERCISES,
  bodyMetrics: [],
  metricTargets: [
    { type: 'weight', target: 53.0 },
    { type: 'waist', target: 65.0 },
    { type: 'arm', target: 35.0 },
  ],
  bodyPhotos: [],
  bodyUnlocked: false,
  folders: [
    { id: 'f1', name: '营养补剂', icon: 'fa-folder', color: 'amber', expanded: false },
    { id: 'f2', name: '训练计划', icon: 'fa-folder', color: 'blue', expanded: false },
  ],
  notes: [],
  selectedFolderId: null,
};

function calculateTotalVolume(exercises: Exercise[]): number {
  return exercises.reduce((sum, ex) => sum + calculateVolume(ex), 0);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_BODY_UNLOCKED':
      return { ...state, bodyUnlocked: action.payload };
    case 'ADD_BODY_METRIC': {
      const { type, value } = action.payload;
      const today = getTodayString();
      const newMetric = {
        id: generateId(),
        type,
        value,
        date: today,
        timestamp: Date.now(),
      };
      const newMetrics = state.bodyMetrics.filter((m: BodyMetric) => !(m.type === type && m.date === today));
      newMetrics.push(newMetric);

      if (type === 'weight') {
        const bmi = calculateBMI(value);
        const bmiMetric = {
          id: generateId(),
          type: 'bmi' as const,
          value: bmi,
          date: today,
          timestamp: Date.now(),
        };
        const filteredMetrics = newMetrics.filter((m: BodyMetric) => !(m.type === 'bmi' && m.date === today));
        filteredMetrics.push(bmiMetric);
        return { ...state, bodyMetrics: filteredMetrics };
      }

      return { ...state, bodyMetrics: newMetrics };
    }
    case 'SET_METRIC_TARGET': {
      const { type, target } = action.payload;
      const newTargets = [...state.metricTargets];
      const existingIndex = newTargets.findIndex((t: MetricTarget) => t.type === type);
      if (existingIndex >= 0) {
        newTargets[existingIndex] = { type, target };
      } else {
        newTargets.push({ type, target });
      }
      return { ...state, metricTargets: newTargets };
    }
    case 'INIT_DAILY_WORKOUT': {
      const workout: DailyWorkout = {
        id: generateId(),
        date: getTodayString(),
        name: '今日训练',
        exercises: [],
        totalVolume: 0,
        muscleGroups: [],
      };
      return { ...state, dailyWorkout: workout };
    }
    case 'ADD_EXERCISE_TO_WORKOUT': {
      if (!state.dailyWorkout) {
        const newExercise = {
          ...action.payload,
          sets: [
            { id: generateId(), weight: 0, reps: 0, completed: false },
          ],
        };
        const workout: DailyWorkout = {
          id: generateId(),
          date: getTodayString(),
          name: getWorkoutName(newExercise.muscleGroup),
          exercises: [newExercise],
          totalVolume: 0,
          muscleGroups: [newExercise.muscleGroup],
        };
        return { ...state, dailyWorkout: workout };
      }

      // 检查是否已存在
      const exists = state.dailyWorkout.exercises.some(
        (ex) => ex.id === action.payload.id
      );
      if (exists) {
        // 移除已存在的
        const newExercises = state.dailyWorkout.exercises.filter(
          (ex) => ex.id !== action.payload.id
        );
        const name = newExercises.length > 0 ? getWorkoutName(newExercises[0].muscleGroup) : '今日训练';
        return {
          ...state,
          dailyWorkout: {
            ...state.dailyWorkout,
            exercises: newExercises,
            name,
            totalVolume: calculateTotalVolume(newExercises),
          },
        };
      }

      // 添加新的
      const newExercise = {
        ...action.payload,
        sets: [
          { id: generateId(), weight: 0, reps: 0, completed: false },
        ],
      };
      const newExercises = [...state.dailyWorkout.exercises, newExercise];
      return {
        ...state,
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          name: getWorkoutName(newExercises[0].muscleGroup),
          totalVolume: calculateTotalVolume(newExercises),
        },
      };
    }
    case 'REMOVE_EXERCISE': {
      if (!state.dailyWorkout) return state;
      const newExercises = state.dailyWorkout.exercises.filter(
        (ex) => ex.id !== action.payload.exerciseId
      );
      const name = newExercises.length > 0 ? getWorkoutName(newExercises[0].muscleGroup) : '今日训练';
      return {
        ...state,
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          name,
          totalVolume: calculateTotalVolume(newExercises),
        },
      };
    }
    case 'REORDER_EXERCISES': {
      if (!state.dailyWorkout) return state;
      const { exerciseIds } = action.payload;
      const exerciseMap = new Map(
        state.dailyWorkout.exercises.map((ex) => [ex.id, ex])
      );
      const newExercises = exerciseIds
        .map((id) => exerciseMap.get(id))
        .filter((ex): ex is Exercise => ex !== undefined);
      const name = newExercises.length > 0 ? getWorkoutName(newExercises[0].muscleGroup) : '今日训练';
      return {
        ...state,
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          name,
        },
      };
    }
    case 'UPDATE_WORKOUT_NAME': {
      if (!state.dailyWorkout) return state;
      return {
        ...state,
        dailyWorkout: { ...state.dailyWorkout, name: action.payload.name },
      };
    }
    case 'ADD_SET': {
      if (!state.dailyWorkout) return state;
      const newExercises = state.dailyWorkout.exercises.map((ex) => {
        if (ex.id === action.payload.exerciseId) {
          return { ...ex, sets: [...ex.sets, action.payload.set] };
        }
        return ex;
      });
      return {
        ...state,
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          totalVolume: calculateTotalVolume(newExercises),
        },
      };
    }
    case 'UPDATE_SET': {
      if (!state.dailyWorkout) return state;
      const newExercises = state.dailyWorkout.exercises.map((ex) => {
        if (ex.id === action.payload.exerciseId) {
          const newSets = ex.sets.map((set) => {
            if (set.id === action.payload.setId) {
              return { ...set, ...action.payload.updates };
            }
            return set;
          });
          return { ...ex, sets: newSets };
        }
        return ex;
      });
      return {
        ...state,
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          totalVolume: calculateTotalVolume(newExercises),
        },
      };
    }
    case 'REMOVE_SET': {
      if (!state.dailyWorkout) return state;
      const newExercises = state.dailyWorkout.exercises.map((ex) => {
        if (ex.id === action.payload.exerciseId) {
          return { ...ex, sets: ex.sets.filter((s) => s.id !== action.payload.setId) };
        }
        return ex;
      });
      return {
        ...state,
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          totalVolume: calculateTotalVolume(newExercises),
        },
      };
    }
    case 'TOGGLE_SET_COMPLETED': {
      if (!state.dailyWorkout) return state;
      const newExercises = state.dailyWorkout.exercises.map((ex) => {
        if (ex.id === action.payload.exerciseId) {
          const newSets = ex.sets.map((set) => {
            if (set.id === action.payload.setId) {
              return { ...set, completed: !set.completed };
            }
            return set;
          });
          return { ...ex, sets: newSets };
        }
        return ex;
      });
      return {
        ...state,
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          totalVolume: calculateTotalVolume(newExercises),
        },
      };
    }
    case 'TOGGLE_LEFT_RIGHT_MODE': {
      if (!state.dailyWorkout) return state;
      const newExercises = state.dailyWorkout.exercises.map((ex) => {
        if (ex.id === action.payload.exerciseId) {
          const newUseLeftRight = !ex.useLeftRight;
          const newSets = ex.sets.map((set) => {
            if (newUseLeftRight) {
              return {
                ...set,
                leftWeight: set.weight,
                rightWeight: set.weight,
              };
            } else {
              const { leftWeight, rightWeight, ...rest } = set;
              return { ...rest, weight: leftWeight || 0 };
            }
          });
          return { ...ex, useLeftRight: newUseLeftRight, sets: newSets };
        }
        return ex;
      });
      return {
        ...state,
        dailyWorkout: { ...state.dailyWorkout, exercises: newExercises },
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      const saved = await loadData();
      if (saved) {
        setState({ ...initialState, ...saved, exerciseLibrary: DEFAULT_EXERCISES });
      }
      setLoaded(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (loaded) {
      saveData(state);
    }
  }, [state, loaded]);

  const dispatch = (action: Action) => {
    setState((prev: AppState) => appReducer(prev, action));
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
