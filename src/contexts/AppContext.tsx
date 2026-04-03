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
  | { type: 'SET_WEIGHT_UNIT'; payload: 'kg' | 'lbs' }
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
  | { type: 'TOGGLE_LEFT_RIGHT_MODE'; payload: { exerciseId: string } }
  | { type: 'ADD_BODY_PHOTO'; payload: { id: string; uri: string; date: string; timestamp: number } }
  | { type: 'REMOVE_BODY_PHOTO'; payload: { photoId: string } }
  | { type: 'ADD_NOTE'; payload: { title: string; content: string; folderId: string | null } }
  | { type: 'UPDATE_NOTE'; payload: { noteId: string; title?: string; content?: string } }
  | { type: 'REMOVE_NOTE'; payload: { noteId: string } }
  | { type: 'ADD_FOLDER'; payload: { name: string; icon: string; color: string } }
  | { type: 'TOGGLE_FOLDER_EXPANDED'; payload: { folderId: string } }
  | { type: 'REMOVE_FOLDER'; payload: { folderId: string } }
  | { type: 'SELECT_FOLDER'; payload: { folderId: string | null } }
  | { type: 'ARCHIVE_DAILY_WORKOUT' };

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
  weightUnit: 'kg',
};

function calculateTotalVolume(exercises: Exercise[], weightUnit: 'kg' | 'lbs' = 'kg'): number {
  return exercises.reduce((sum, ex) => sum + calculateVolume(ex, weightUnit), 0);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_BODY_UNLOCKED':
      return { ...state, bodyUnlocked: action.payload };
    case 'SET_WEIGHT_UNIT': {
      const newUnit = action.payload;
      const oldUnit = state.weightUnit;
      if (newUnit === oldUnit) return state;

      // 转换系数：1 lbs = 0.45 kg
      const convertWeight = (w: number | undefined, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number | undefined => {
        if (w === undefined) return undefined;
        if (from === to) return w;
        if (from === 'lbs' && to === 'kg') {
          return Math.round(w * 0.45 * 10) / 10;
        } else {
          return Math.round(w / 0.45 * 10) / 10;
        }
      };

      // 转换今日训练的重量
      const convertedDailyWorkout = state.dailyWorkout ? {
        ...state.dailyWorkout,
        exercises: state.dailyWorkout.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(set => ({
            ...set,
            weight: convertWeight(set.weight, oldUnit, newUnit),
            leftWeight: convertWeight(set.leftWeight, oldUnit, newUnit),
            rightWeight: convertWeight(set.rightWeight, oldUnit, newUnit),
          }))
        }))
      } : null;

      // 转换历史记录的重量
      const convertedHistory = state.workoutHistory.map(workout => ({
        ...workout,
        exercises: workout.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(set => ({
            ...set,
            weight: convertWeight(set.weight, oldUnit, newUnit),
            leftWeight: convertWeight(set.leftWeight, oldUnit, newUnit),
            rightWeight: convertWeight(set.rightWeight, oldUnit, newUnit),
          }))
        }))
      }));

      return {
        ...state,
        weightUnit: newUnit,
        dailyWorkout: convertedDailyWorkout,
        workoutHistory: convertedHistory,
      };
    }
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
    case 'ADD_BODY_PHOTO': {
      const newPhoto = action.payload;
      return { ...state, bodyPhotos: [...state.bodyPhotos, newPhoto] };
    }
    case 'REMOVE_BODY_PHOTO': {
      return {
        ...state,
        bodyPhotos: state.bodyPhotos.filter((p) => p.id !== action.payload.photoId)
      };
    }
    case 'ADD_NOTE': {
      const newNote = {
        id: generateId(),
        title: action.payload.title,
        content: action.payload.content,
        folderId: action.payload.folderId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return { ...state, notes: [...state.notes, newNote] };
    }
    case 'UPDATE_NOTE': {
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.payload.noteId
            ? {
                ...note,
                title: action.payload.title ?? note.title,
                content: action.payload.content ?? note.content,
                updatedAt: Date.now(),
              }
            : note
        ),
      };
    }
    case 'REMOVE_NOTE': {
      return {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.payload.noteId),
      };
    }
    case 'ADD_FOLDER': {
      const newFolder = {
        id: generateId(),
        name: action.payload.name,
        icon: action.payload.icon,
        color: action.payload.color,
        expanded: false,
      };
      return { ...state, folders: [...state.folders, newFolder] };
    }
    case 'TOGGLE_FOLDER_EXPANDED': {
      return {
        ...state,
        folders: state.folders.map((folder) =>
          folder.id === action.payload.folderId
            ? { ...folder, expanded: !folder.expanded }
            : folder
        ),
      };
    }
    case 'SELECT_FOLDER': {
      return { ...state, selectedFolderId: action.payload.folderId };
    }
    case 'REMOVE_FOLDER': {
      return {
        ...state,
        folders: state.folders.filter((folder) => folder.id !== action.payload.folderId),
        notes: state.notes.filter((note) => note.folderId !== action.payload.folderId),
      };
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
            totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
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
          totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
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
          totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
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
          totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
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
          totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
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
          totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
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
          totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
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
        dailyWorkout: {
          ...state.dailyWorkout,
          exercises: newExercises,
          totalVolume: calculateTotalVolume(newExercises, state.weightUnit),
        },
      };
    }
    case 'ARCHIVE_DAILY_WORKOUT': {
      if (!state.dailyWorkout) return state;
      // 将今日训练归档到历史记录
      const newWorkoutHistory = [...state.workoutHistory, state.dailyWorkout];
      return {
        ...state,
        dailyWorkout: null,
        workoutHistory: newWorkoutHistory,
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loaded, setLoaded] = useState(false);

  // 检查是否需要归档今日训练
  const checkAndArchiveDailyWorkout = (currentState: AppState): AppState => {
    if (!currentState.dailyWorkout) return currentState;

    const today = getTodayString();
    if (currentState.dailyWorkout.date !== today) {
      // 日期不同，需要归档
      const newWorkoutHistory = [...currentState.workoutHistory, currentState.dailyWorkout];
      return {
        ...currentState,
        dailyWorkout: null,
        workoutHistory: newWorkoutHistory,
      };
    }
    return currentState;
  };

  useEffect(() => {
    async function init() {
      try {
        const saved = await loadData();
        if (saved) {
          // 深度修复数据完整性
          let validData = { ...saved };

          // 修复 dailyWorkout
          if (validData.dailyWorkout) {
            if (!validData.dailyWorkout.exercises || !Array.isArray(validData.dailyWorkout.exercises)) {
              validData.dailyWorkout.exercises = [];
            }
            // 修复每个 exercise 的 sets
            validData.dailyWorkout.exercises = validData.dailyWorkout.exercises.map((ex: any) => ({
              ...ex,
              sets: Array.isArray(ex.sets) ? ex.sets : []
            }));
          }

          // 确保其他数组字段存在
          if (!validData.workoutHistory || !Array.isArray(validData.workoutHistory)) {
            validData.workoutHistory = [];
          }
          if (!validData.bodyMetrics || !Array.isArray(validData.bodyMetrics)) {
            validData.bodyMetrics = [];
          }
          if (!validData.metricTargets || !Array.isArray(validData.metricTargets)) {
            validData.metricTargets = initialState.metricTargets;
          }
          if (!validData.bodyPhotos || !Array.isArray(validData.bodyPhotos)) {
            validData.bodyPhotos = [];
          }
          if (!validData.folders || !Array.isArray(validData.folders)) {
            validData.folders = initialState.folders;
          }
          if (!validData.notes || !Array.isArray(validData.notes)) {
            validData.notes = [];
          }

          const initialStateWithData = { ...initialState, ...validData, exerciseLibrary: DEFAULT_EXERCISES };
          // 检查并归档过期的今日训练
          const archivedState = checkAndArchiveDailyWorkout(initialStateWithData);
          setState(archivedState);
        }
      } catch (e) {
        console.error('Failed to load data:', e);
        // 如果加载失败，使用初始状态
      }
      setLoaded(true);
    }
    init();
  }, []);

  // 定期检查是否需要归档今日训练（每分钟检查一次）
  useEffect(() => {
    if (!loaded) return;

    const checkInterval = setInterval(() => {
      setState(prev => checkAndArchiveDailyWorkout(prev));
    }, 60000); // 每分钟检查一次

    return () => clearInterval(checkInterval);
  }, [loaded]);

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
