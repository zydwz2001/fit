import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ExerciseImage } from '@/components/training';
import { formatExerciseSet, formatExerciseSummary, matchesExerciseQuery } from '@/utils/exerciseCatalog';
import { useAppBack } from '@/utils/navigation';
import type { Exercise } from '@/types';
import './trends.css';

const MUSCLE_ORDER = ['胸', '背', '肩', '臂', '腿', '核心'];

function ExercisePicker({ exercises, selectedId, onSelect, onClose }: {
  exercises: Exercise[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('全部');
  const groups = useMemo(() => [...new Set(exercises.map((exercise) => exercise.muscleGroup))]
    .sort((a, b) => {
      const aIndex = MUSCLE_ORDER.indexOf(a);
      const bIndex = MUSCLE_ORDER.indexOf(b);
      return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
    }), [exercises]);
  const filteredExercises = useMemo(() => exercises.filter((exercise) =>
    (muscle === '全部' || exercise.muscleGroup === muscle) && matchesExerciseQuery(exercise, query)
  ), [exercises, muscle, query]);

  const close = (selectedExerciseId?: string) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    searchRef.current?.blur();
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160;
    closeTimer.current = setTimeout(() => {
      dialogRef.current?.close();
      if (selectedExerciseId) onSelect(selectedExerciseId);
      onClose();
    }, delay);
  };

  useAppBack(() => {
    close();
    return true;
  }, 90);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    // Keep search and results inside the visible area when the phone keyboard opens.
    const viewport = window.visualViewport;
    const syncViewport = () => {
      const height = viewport?.height ?? window.innerHeight;
      const bottom = Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0));
      dialog.style.setProperty('--picker-height', `${Math.max(180, Math.min(height - 44, 680))}px`);
      dialog.style.setProperty('--picker-bottom', `${bottom}px`);
    };
    syncViewport();
    viewport?.addEventListener('resize', syncViewport);
    viewport?.addEventListener('scroll', syncViewport);
    window.addEventListener('resize', syncViewport);
    return () => {
      clearTimeout(closeTimer.current);
      viewport?.removeEventListener('resize', syncViewport);
      viewport?.removeEventListener('scroll', syncViewport);
      window.removeEventListener('resize', syncViewport);
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`trend-picker${closing ? ' is-closing' : ''}`}
      aria-label="选择动作"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}
    >
      <div className="trend-picker-handle" aria-hidden="true" />
      <header className="trend-picker-heading">
        <h2>选择动作</h2>
        <button ref={closeRef} type="button" className="trend-icon-button" aria-label="关闭动作选择" onClick={() => close()}>
          <i className="fas fa-times" aria-hidden="true" />
        </button>
      </header>
      <div className="trend-search">
        <i className="fas fa-search" aria-hidden="true" />
        <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索动作" placeholder="搜索动作" autoComplete="off" enterKeyHint="search" />
        {query && (
          <button type="button" aria-label="清空搜索" onClick={() => { setQuery(''); searchRef.current?.focus(); }}>
            <i className="fas fa-times-circle" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="trend-muscle-filters no-scrollbar" role="group" aria-label="肌群筛选">
        {['全部', ...groups].map((group) => (
          <button key={group} type="button" aria-pressed={muscle === group} onClick={() => setMuscle(group)}>{group}</button>
        ))}
      </div>
      <div className="trend-picker-list" key={`${muscle}-${query}`}>
        {filteredExercises.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            className="trend-picker-option"
            aria-label={exercise.name}
            aria-pressed={exercise.id === selectedId}
            onClick={() => close(exercise.id)}
          >
            <ExerciseImage exercise={exercise} className="trend-option-image" />
            <span>{exercise.name}</span>
            <span className="trend-option-check" aria-hidden="true">
              {exercise.id === selectedId && <i className="fas fa-check" />}
            </span>
          </button>
        ))}
        {filteredExercises.length === 0 && <p className="trend-picker-empty" role="status">没有找到动作</p>}
      </div>
    </dialog>
  );
}

export function ExerciseTrendTab() {
  const { state } = useApp();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerTrigger = useRef<HTMLButtonElement>(null);
  const workouts = useMemo(
    () => [...state.workoutHistory, ...(state.dailyWorkout ? [state.dailyWorkout] : [])],
    [state.workoutHistory, state.dailyWorkout]
  );
  const availableExercises = useMemo(() => {
    const completed = new Map<string, Exercise>();
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.category === 'strength' && exercise.sets.some((set) => set.completed)) {
          completed.set(exercise.id, exercise);
        }
      }
    }
    // Library visibility never removes historical movements. Retain historical-only IDs, too.
    const libraryExercises = state.exerciseLibrary.filter((exercise) => completed.has(exercise.id));
    const libraryIds = new Set(libraryExercises.map((exercise) => exercise.id));
    return [...libraryExercises, ...[...completed.values()].filter((exercise) => !libraryIds.has(exercise.id))];
  }, [state.exerciseLibrary, workouts]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(() => availableExercises[0]?.id ?? '');
  const selectedExercise = availableExercises.find((exercise) => exercise.id === selectedExerciseId) ?? availableExercises[0];
  const resolvedExerciseId = selectedExercise?.id;

  const records = useMemo(() => {
    if (!resolvedExerciseId) return [];
    return workouts.flatMap((workout) => workout.exercises.flatMap((exercise, exerciseIndex) => {
      if (exercise.id !== resolvedExerciseId) return [];
      const completedSets = exercise.sets.filter((set) => set.completed);
      if (completedSets.length === 0) return [];
      return [{
        key: `${workout.id}-${exerciseIndex}`,
        date: workout.date,
        exercise: { ...exercise, sets: completedSets },
      }];
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [workouts, resolvedExerciseId]);

  if (!selectedExercise) {
    return <div className="trend-empty"><i className="fas fa-chart-line" aria-hidden="true" /><h2>暂无动作趋势</h2></div>;
  }

  return (
    <div className="exercise-trends">
      <button ref={pickerTrigger} className="trend-selection" type="button" aria-label="选择动作" aria-haspopup="dialog" aria-expanded={pickerOpen} onClick={() => setPickerOpen(true)}>
        <span className="trend-selection-art"><ExerciseImage exercise={selectedExercise} className="trend-selection-image" /></span>
        <span className="trend-selection-name">{selectedExercise.name}</span>
        <span className="trend-selection-arrow" aria-hidden="true"><i className="fas fa-chevron-down" /></span>
      </button>
      <div className="trend-records" key={resolvedExerciseId}>
        {records.map((record) => (
          <article key={record.key} className="trend-record">
            <header className="trend-record-heading">
              <time dateTime={record.date}>{record.date.replace(/-/g, '.')}</time>
              <strong>{formatExerciseSummary(record.exercise, state.weightUnit)}</strong>
            </header>
            <ol className="trend-record-sets">
              {record.exercise.sets.map((set, index) => (
                <li key={set.id}>
                  <span className="trend-set-number" aria-label={`第${index + 1}组`}>{String(index + 1).padStart(2, '0')}</span>
                  <span>{formatExerciseSet(record.exercise, set, state.weightUnit)}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      {pickerOpen && <ExercisePicker
        exercises={availableExercises}
        selectedId={selectedExercise.id}
        onSelect={setSelectedExerciseId}
        onClose={() => {
          setPickerOpen(false);
          pickerTrigger.current?.focus({ preventScroll: true });
        }}
      />}
    </div>
  );
}
