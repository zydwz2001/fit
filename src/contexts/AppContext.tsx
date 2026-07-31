import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, generateId, getTodayString, calculateBMI, calculateVolume } from '@/utils/constants';
import type { BodyMetric, MetricTarget, MetricType, Exercise, Set as ExerciseSet, DailyWorkout } from '@/types';
import { DEFAULT_EXERCISES } from '@/types';
import { loadData, saveData } from '@/utils/storage';
import { createDemoState } from '@/utils/demoData';

interface AppContextType {
  state: AppState;
  dispatch: (action: Action) => void;
}

type Action =
  | { type: 'SET_BODY_UNLOCKED'; payload: boolean }
  | { type: 'SET_WEIGHT_UNIT'; payload: 'kg' | 'lbs' }
  | { type: 'ADD_BODY_METRIC'; payload: { type: MetricType; value: number } }
  | { type: 'UPDATE_BODY_METRIC'; payload: { metricId: string; value: number } }
  | { type: 'REMOVE_BODY_METRIC'; payload: { metricId: string } }
  | { type: 'SET_METRIC_TARGET'; payload: { type: MetricType; target: number } }
  | { type: 'INIT_DAILY_WORKOUT' }
  | { type: 'ADD_EXERCISE_TO_WORKOUT'; payload: Exercise }
  | { type: 'REMOVE_EXERCISE'; payload: { exerciseId: string } }
  | { type: 'REORDER_EXERCISES'; payload: { exerciseIds: string[] } }
  | { type: 'UPDATE_WORKOUT_NAME'; payload: { name: string } }
  | { type: 'ADD_SET'; payload: { exerciseId: string; set: ExerciseSet } }
  | { type: 'UPDATE_SET'; payload: { exerciseId: string; setId: string; updates: Partial<ExerciseSet> } }
  | {
      type: 'UPDATE_CARDIO_EXERCISE';
      payload: {
        exerciseId: string;
        updates: Partial<Pick<Exercise, 'durationMinutes' | 'distanceKm' | 'intensity'>>;
      };
    }
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
  | { type: 'SAVE_WORKOUT_RECORD'; payload: { workout: DailyWorkout } }
  | { type: 'REMOVE_WORKOUT_RECORD'; payload: { workoutId: string } }
  | { type: 'ADD_WORKOUT_TEMPLATE'; payload: { name: string; exerciseIds: string[] } }
  | { type: 'REMOVE_WORKOUT_TEMPLATE'; payload: { templateId: string } }
  | { type: 'APPLY_WORKOUT_TEMPLATE'; payload: { templateId: string } }
  | { type: 'REPLACE_EXERCISE_LIBRARY'; payload: { exercises: Exercise[] } }
  | { type: 'RESET_EXERCISE_LIBRARY' }
  | { type: 'IMPORT_APP_STATE'; payload: Partial<AppState> }
  | { type: 'ARCHIVE_DAILY_WORKOUT' };

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

const initialState: AppState = createDemoState();

export function mergeWithDemoState(saved: Partial<AppState>): AppState {
  const demoState = createDemoState();
  const savedArray = <T,>(value: T[] | undefined, fallback: T[]): T[] =>
    Array.isArray(value) ? value : fallback;

  return {
    ...demoState,
    ...saved,
    dailyWorkout: saved.dailyWorkout === undefined ? demoState.dailyWorkout : saved.dailyWorkout,
    workoutHistory: savedArray(saved.workoutHistory, demoState.workoutHistory),
    exerciseLibrary: savedArray(saved.exerciseLibrary, DEFAULT_EXERCISES),
    workoutTemplates: savedArray(saved.workoutTemplates, demoState.workoutTemplates),
    bodyMetrics: savedArray(saved.bodyMetrics, demoState.bodyMetrics),
    metricTargets: savedArray(saved.metricTargets, demoState.metricTargets),
    bodyPhotos: savedArray(saved.bodyPhotos, demoState.bodyPhotos),
    folders: savedArray(saved.folders, demoState.folders),
    notes: savedArray(saved.notes, demoState.notes),
    bodyUnlocked: false,
    selectedFolderId: saved.selectedFolderId ?? null,
    weightUnit: saved.weightUnit ?? demoState.weightUnit,
  };
}

function calculateTotalVolume(exercises: Exercise[], weightUnit: 'kg' | 'lbs' = 'kg'): number {
  return exercises.reduce((sum, ex) => sum + calculateVolume(ex, weightUnit), 0);
}

function normalizeWorkout(workout: DailyWorkout, weightUnit: 'kg' | 'lbs'): DailyWorkout {
  const muscleGroups = [...new Set(workout.exercises.map((exercise) => exercise.muscleGroup))];
  const cardioName = workout.exercises.find((exercise) => exercise.category === 'cardio')?.name;

  return {
    ...workout,
    totalVolume: calculateTotalVolume(workout.exercises, weightUnit),
    muscleGroups,
    cardioName,
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_BODY_UNLOCKED':
      return { ...state, bodyUnlocked: action.payload };
    case 'SET_WEIGHT_UNIT': {
      const newUnit = action.payload;
      const oldUnit = state.weightUnit;
      if (newUnit === oldUnit) return state;

      const convertWeight = (w: number | undefined, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number | undefined => {
        if (w === undefined) return undefined;
        if (from === to) return w;
        if (from === 'lbs' && to === 'kg') {
          return Math.round(w * 0.45359237 * 10) / 10;
        } else {
          return Math.round(w / 0.45359237 * 10) / 10;
        }
      };

      const convertWorkout = (workout: DailyWorkout): DailyWorkout => normalizeWorkout({
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
      }, newUnit);

      const convertedDailyWorkout = state.dailyWorkout ? convertWorkout(state.dailyWorkout) : null;
      const convertedHistory = state.workoutHistory.map(convertWorkout);

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
    case 'UPDATE_BODY_METRIC': {
      const metric = state.bodyMetrics.find((m: BodyMetric) => m.id === action.payload.metricId);
      if (!metric || metric.type === 'bmi') return state;

      const updatedMetrics = state.bodyMetrics.map((m: BodyMetric) =>
        m.id === action.payload.metricId
          ? { ...m, value: action.payload.value, timestamp: Date.now() }
          : m
      );

      if (metric.type !== 'weight') {
        return { ...state, bodyMetrics: updatedMetrics };
      }

      const bmiValue = calculateBMI(action.payload.value);
      const bmiIndex = updatedMetrics.findIndex(
        (m: BodyMetric) => m.type === 'bmi' && m.date === metric.date
      );

      if (bmiIndex >= 0) {
        const metricsWithBmi = [...updatedMetrics];
        metricsWithBmi[bmiIndex] = {
          ...metricsWithBmi[bmiIndex],
          value: bmiValue,
          timestamp: Date.now(),
        };
        return { ...state, bodyMetrics: metricsWithBmi };
      }

      return {
        ...state,
        bodyMetrics: [
          ...updatedMetrics,
          {
            id: generateId(),
            type: 'bmi',
            value: bmiValue,
            date: metric.date,
            timestamp: Date.now(),
          },
        ],
      };
    }
    case 'REMOVE_BODY_METRIC': {
      const metric = state.bodyMetrics.find((m: BodyMetric) => m.id === action.payload.metricId);
      if (!metric || metric.type === 'bmi') return state;

      return {
        ...state,
        bodyMetrics: state.bodyMetrics.filter((m: BodyMetric) => {
          if (m.id === action.payload.metricId) return false;
          if (metric.type === 'weight' && m.type === 'bmi' && m.date === metric.date) return false;
          return true;
        }),
      };
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
        selectedFolderId:
          state.selectedFolderId === action.payload.folderId ? null : state.selectedFolderId,
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
          sets: action.payload.category === 'cardio' ? [] : [
            { id: generateId(), weight: 0, reps: 0, completed: false },
          ],
        };
        const workout = normalizeWorkout({
          id: generateId(),
          date: getTodayString(),
          name: getWorkoutName(newExercise.muscleGroup),
          exercises: [newExercise],
          totalVolume: 0,
          muscleGroups: [newExercise.muscleGroup],
        }, state.weightUnit);
        return { ...state, dailyWorkout: workout };
      }

      const exists = state.dailyWorkout.exercises.some(
        (ex) => ex.id === action.payload.id
      );
      if (exists) {
        const newExercises = state.dailyWorkout.exercises.filter(
          (ex) => ex.id !== action.payload.id
        );
        const name = newExercises.length > 0 ? getWorkoutName(newExercises[0].muscleGroup) : '今日训练';
        return {
          ...state,
          dailyWorkout: normalizeWorkout({
            ...state.dailyWorkout,
            exercises: newExercises,
            name,
          }, state.weightUnit),
        };
      }

      const newExercise = {
        ...action.payload,
        sets: action.payload.category === 'cardio' ? [] : [
          { id: generateId(), weight: 0, reps: 0, completed: false },
        ],
      };
      const newExercises = [...state.dailyWorkout.exercises, newExercise];
      return {
        ...state,
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
          name: getWorkoutName(newExercises[0].muscleGroup),
        }, state.weightUnit),
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
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
          name,
        }, state.weightUnit),
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
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
          name,
        }, state.weightUnit),
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
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
        }, state.weightUnit),
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
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
        }, state.weightUnit),
      };
    }
    case 'UPDATE_CARDIO_EXERCISE': {
      if (!state.dailyWorkout) return state;
      const exercises = state.dailyWorkout.exercises.map((exercise) =>
        exercise.id === action.payload.exerciseId
          ? { ...exercise, ...action.payload.updates }
          : exercise
      );
      return {
        ...state,
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises,
        }, state.weightUnit),
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
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
        }, state.weightUnit),
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
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
        }, state.weightUnit),
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
              return {
                id: set.id,
                weight: set.leftWeight ?? set.rightWeight ?? 0,
                reps: set.reps,
                completed: set.completed,
              };
            }
          });
          return { ...ex, useLeftRight: newUseLeftRight, sets: newSets };
        }
        return ex;
      });
      return {
        ...state,
        dailyWorkout: normalizeWorkout({
          ...state.dailyWorkout,
          exercises: newExercises,
        }, state.weightUnit),
      };
    }
    case 'SAVE_WORKOUT_RECORD': {
      const workout = normalizeWorkout(action.payload.workout, state.weightUnit);

      if (state.dailyWorkout?.id === workout.id) {
        return { ...state, dailyWorkout: workout };
      }

      const existingIndex = state.workoutHistory.findIndex((item) => item.id === workout.id);
      if (existingIndex >= 0) {
        const workoutHistory = [...state.workoutHistory];
        workoutHistory[existingIndex] = workout;
        return { ...state, workoutHistory };
      }

      return {
        ...state,
        workoutHistory: [...state.workoutHistory, workout],
      };
    }
    case 'REMOVE_WORKOUT_RECORD': {
      if (state.dailyWorkout?.id === action.payload.workoutId) {
        return { ...state, dailyWorkout: null };
      }

      return {
        ...state,
        workoutHistory: state.workoutHistory.filter(
          (workout) => workout.id !== action.payload.workoutId
        ),
      };
    }
    case 'ADD_WORKOUT_TEMPLATE': {
      const name = action.payload.name.trim();
      const exerciseIds = [...new Set(action.payload.exerciseIds)].filter((id) =>
        state.exerciseLibrary.some((exercise) => exercise.id === id)
      );
      if (!name || exerciseIds.length === 0) return state;

      return {
        ...state,
        workoutTemplates: [
          ...state.workoutTemplates,
          {
            id: generateId(),
            name,
            exerciseIds,
            createdAt: Date.now(),
          },
        ],
      };
    }
    case 'REMOVE_WORKOUT_TEMPLATE':
      return {
        ...state,
        workoutTemplates: state.workoutTemplates.filter(
          (template) => template.id !== action.payload.templateId
        ),
      };
    case 'APPLY_WORKOUT_TEMPLATE': {
      const template = state.workoutTemplates.find(
        (item) => item.id === action.payload.templateId
      );
      if (!template) return state;

      const exercises = template.exerciseIds
        .map((id) => state.exerciseLibrary.find((exercise) => exercise.id === id))
        .filter((exercise): exercise is Exercise => exercise !== undefined)
        .map((exercise) => ({
          ...exercise,
          sets: exercise.category === 'cardio'
            ? []
            : [{ id: generateId(), weight: 0, reps: 0, completed: false }],
        }));
      if (exercises.length === 0) return state;

      const workout = normalizeWorkout({
        id: state.dailyWorkout?.id ?? generateId(),
        date: getTodayString(),
        name: template.name,
        exercises,
        totalVolume: 0,
        muscleGroups: [],
      }, state.weightUnit);
      return { ...state, dailyWorkout: workout };
    }
    case 'REPLACE_EXERCISE_LIBRARY': {
      const seen = new Set<string>();
      const exercises = action.payload.exercises
        .filter((exercise) => {
          const normalizedId = typeof exercise?.id === 'string' ? exercise.id.trim() : '';
          const valid = Boolean(
            exercise &&
            normalizedId &&
            !seen.has(normalizedId) &&
            typeof exercise.name === 'string' &&
            exercise.name.trim() &&
            typeof exercise.muscleGroup === 'string' &&
            exercise.muscleGroup.trim() &&
            (exercise.category === 'strength' || exercise.category === 'cardio')
          );
          if (valid) seen.add(normalizedId);
          return valid;
        })
        .map((exercise) => {
          return {
            ...exercise,
            id: exercise.id.trim(),
            name: exercise.name.trim(),
            muscleGroup: exercise.muscleGroup.trim(),
            useLeftRight: Boolean(exercise.useLeftRight),
            sets: [],
          };
        });
      return exercises.length > 0 ? { ...state, exerciseLibrary: exercises } : state;
    }
    case 'RESET_EXERCISE_LIBRARY':
      return { ...state, exerciseLibrary: DEFAULT_EXERCISES };
    case 'IMPORT_APP_STATE':
      return mergeWithDemoState(action.payload);
    case 'ARCHIVE_DAILY_WORKOUT': {
      if (!state.dailyWorkout) return state;
      const archivedWorkout = normalizeWorkout(state.dailyWorkout, state.weightUnit);
      const newWorkoutHistory = [...state.workoutHistory, archivedWorkout];
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

  const checkAndArchiveDailyWorkout = (currentState: AppState): AppState => {
    if (!currentState.dailyWorkout) return currentState;

    const today = getTodayString();
    if (currentState.dailyWorkout.date !== today) {
      const archivedWorkout = normalizeWorkout(
        currentState.dailyWorkout,
        currentState.weightUnit
      );
      const newWorkoutHistory = [...currentState.workoutHistory, archivedWorkout];
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
          const validData = { ...saved };

          if (validData.dailyWorkout) {
            if (!validData.dailyWorkout.exercises || !Array.isArray(validData.dailyWorkout.exercises)) {
              validData.dailyWorkout.exercises = [];
            }
            validData.dailyWorkout.exercises = validData.dailyWorkout.exercises.map((ex: Exercise) => ({
              ...ex,
              sets: Array.isArray(ex.sets) ? ex.sets : []
            }));
          }

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

          const initialStateWithData = mergeWithDemoState(validData);
          const archivedState = checkAndArchiveDailyWorkout(initialStateWithData);
          setState(archivedState);
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      }
      setLoaded(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const checkInterval = setInterval(() => {
      setState(prev => checkAndArchiveDailyWorkout(prev));
    }, 60000);

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
