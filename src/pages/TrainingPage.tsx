import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { SubTabBar, Card, Button } from '@/components';
import { ExerciseCard } from '@/components/training';
import { CustomKeyboard } from '@/components/training';
import { generateId, formatDate, formatDisplayDate, calculateVolume } from '@/utils/constants';
import { useAppBack } from '@/utils/navigation';
import type { Set as ExerciseSet, Exercise, DailyWorkout } from '@/types';
import { DEFAULT_EXERCISES } from '@/types';

const SUB_TABS = [
  { id: 'today', label: '今日健身' },
  { id: 'history', label: '月视图回顾' },
  { id: 'library', label: '动作库' },
  { id: 'trends', label: '动作趋势' },
];

export function TrainingPage() {
  const { state } = useApp();
  const [subTab, setSubTab] = useState('today');
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [showDayDetailModal, setShowDayDetailModal] = useState<{ date: string; hasWorkout: boolean } | null>(null);

  useAppBack(() => {
    if (showDayDetailModal) {
      setShowDayDetailModal(null);
      return true;
    }
    if (showHistoryModal) {
      setShowHistoryModal(null);
      return true;
    }
    if (subTab !== 'today') {
      setSubTab('today');
      return true;
    }
    return false;
  }, 50);

  return (
    <div className="training-page flex flex-col min-h-0">
      <SubTabBar
        tabs={SUB_TABS}
        activeTab={subTab}
        onTabChange={setSubTab}
        className="flex-shrink-0"
      />
      {subTab === 'today' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6">
          <TodayTab
            onGoToLibrary={() => setSubTab('library')}
            onShowHistory={(exerciseId) => setShowHistoryModal(exerciseId)}
          />
        </div>
      )}
      {subTab === 'history' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6">
          <HistoryTab onShowDayDetail={(date, hasWorkout) => setShowDayDetailModal({ date, hasWorkout })} />
        </div>
      )}
      {subTab === 'trends' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6">
          <ExerciseTrendTab />
        </div>
      )}
      {subTab === 'library' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <LibraryTab
            onGoToToday={() => setSubTab('today')}
            hasTodayWorkout={!!state.dailyWorkout}
          />
        </div>
      )}

      {showHistoryModal && (
        <ExerciseHistoryModal
          exerciseId={showHistoryModal}
          onClose={() => setShowHistoryModal(null)}
        />
      )}

      {showDayDetailModal && (
        <DayDetailModal
          date={showDayDetailModal.date}
          hasWorkout={showDayDetailModal.hasWorkout}
          onClose={() => setShowDayDetailModal(null)}
          onCopyToToday={() => {
            setShowDayDetailModal(null);
            setSubTab('today');
          }}
        />
      )}
    </div>
  );
}

interface TodayTabProps {
  onGoToLibrary: () => void;
  onShowHistory: (exerciseId: string) => void;
}

function TodayTab({ onGoToLibrary, onShowHistory }: TodayTabProps) {
  const { state, dispatch } = useApp();
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [keyboardState, setKeyboardState] = useState<{
    exerciseId: string;
    setId: string;
    inputType: 'weight' | 'leftWeight' | 'rightWeight' | 'reps';
    value: string;
  } | null>(null);

  useAppBack(() => {
    if (keyboardState) {
      setKeyboardState(null);
      return true;
    }
    if (showTemplates) {
      setShowTemplates(false);
      return true;
    }
    return false;
  }, 100);

  const displayDate = useMemo(() => formatDisplayDate(new Date()), []);

  const orderedExercises = state.dailyWorkout?.exercises ?? [];

  const toggleExpanded = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId] === false,
    }));
  };

  const handleAddSet = (exerciseId: string) => {
    const exercise = state.dailyWorkout?.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: ExerciseSet = {
      id: generateId(),
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      leftWeight: lastSet?.leftWeight,
      rightWeight: lastSet?.rightWeight,
      completed: false,
    };

    dispatch({ type: 'ADD_SET', payload: { exerciseId, set: newSet } });
  };

  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    dispatch({ type: 'UPDATE_SET', payload: { exerciseId, setId, updates } });
  };

  const handleToggleSetCompleted = (exerciseId: string, setId: string) => {
    dispatch({ type: 'TOGGLE_SET_COMPLETED', payload: { exerciseId, setId } });
  };

  const handleToggleLeftRight = (exerciseId: string) => {
    dispatch({ type: 'TOGGLE_LEFT_RIGHT_MODE', payload: { exerciseId } });
  };

  const handleUpdateCardio = (
    exerciseId: string,
    updates: Partial<Pick<Exercise, 'durationMinutes' | 'distanceKm' | 'intensity'>>
  ) => {
    dispatch({ type: 'UPDATE_CARDIO_EXERCISE', payload: { exerciseId, updates } });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    dispatch({ type: 'REMOVE_EXERCISE', payload: { exerciseId } });
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    dispatch({ type: 'REMOVE_SET', payload: { exerciseId, setId } });
  };

  const handleDragStart = (e: React.DragEvent, exerciseId: string) => {
    setDraggingId(exerciseId);
    e.dataTransfer.setData('text/plain', exerciseId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const newOrder = orderedExercises.map((exercise) => exercise.id);
    const sourceIndex = newOrder.indexOf(sourceId);
    const targetIndex = newOrder.indexOf(targetId);
    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, sourceId);
    setDraggingId(null);
    dispatch({ type: 'REORDER_EXERCISES', payload: { exerciseIds: newOrder } });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleMoveExercise = (exerciseId: string, direction: -1 | 1) => {
    const currentOrder = orderedExercises.map((exercise) => exercise.id);
    const currentIndex = currentOrder.indexOf(exerciseId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const newOrder = [...currentOrder];
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    dispatch({ type: 'REORDER_EXERCISES', payload: { exerciseIds: newOrder } });
  };

  const getCurrentEditingData = () => {
    if (!keyboardState || !state.dailyWorkout) return null;
    const exercise = state.dailyWorkout.exercises.find(e => e.id === keyboardState.exerciseId);
    if (!exercise) return null;
    const setIndex = exercise.sets.findIndex(s => s.id === keyboardState.setId);
    if (setIndex === -1) return null;
    return {
      exercise,
      setIndex,
      prevSet: setIndex > 0 ? exercise.sets[setIndex - 1] : undefined,
      nextSet: setIndex < exercise.sets.length - 1 ? exercise.sets[setIndex + 1] : undefined,
    };
  };

  const handleKeyboardUpdate = (value: string) => {
    if (!keyboardState) return;
    handleUpdateSet(keyboardState.exerciseId, keyboardState.setId, {
      [keyboardState.inputType]: keyboardState.inputType === 'reps' ? parseInt(value) || 0 : parseFloat(value) || 0
    });
    setKeyboardState(prev => prev ? { ...prev, value } : null);
  };

  const handleWeightUnitChange = (nextUnit: 'kg' | 'lbs') => {
    setKeyboardState((current) => {
      if (!current || current.inputType === 'reps') return current;
      const numericValue = Number.parseFloat(current.value);
      if (!Number.isFinite(numericValue)) return current;

      const convertedValue = state.weightUnit === 'kg' && nextUnit === 'lbs'
        ? numericValue / 0.45359237
        : numericValue * 0.45359237;
      const value = String(Math.round(convertedValue * 10) / 10);
      return { ...current, value };
    });
  };

  const handleFillUp = () => {
    const data = getCurrentEditingData();
    if (!data || !keyboardState) return;
    const currentValue = data.exercise.sets[data.setIndex][keyboardState.inputType];
    if (currentValue === undefined) return;

    for (let i = 0; i < data.setIndex; i++) {
      const set = data.exercise.sets[i];
      handleUpdateSet(keyboardState.exerciseId, set.id, {
        [keyboardState.inputType]: currentValue,
      });
    }
  };

  const handleFillDown = () => {
    const data = getCurrentEditingData();
    if (!data || !keyboardState) return;
    const currentValue = data.exercise.sets[data.setIndex][keyboardState.inputType];
    if (currentValue === undefined) return;

    for (let i = data.setIndex + 1; i < data.exercise.sets.length; i++) {
      const set = data.exercise.sets[i];
      handleUpdateSet(keyboardState.exerciseId, set.id, {
        [keyboardState.inputType]: currentValue,
      });
    }
  };

  if (!state.dailyWorkout || state.dailyWorkout.exercises.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
          <div className="w-20 h-20 bg-vibe-green/10 rounded-full flex items-center justify-center">
            <i className="fas fa-dumbbell text-vibe-green text-2xl"></i>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black mb-2">开始今日训练</h3>
            <p className="text-slate-400 text-sm mb-6">选择动作或套用训练模板</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={onGoToLibrary}>
              <i className="fas fa-plus mr-2"></i>
              选择动作
            </Button>
            <Button onClick={() => setShowTemplates(true)} variant="secondary">
              <i className="fas fa-layer-group mr-2"></i>
              使用模板
            </Button>
          </div>
        </div>
        {showTemplates && <WorkoutTemplateModal onClose={() => setShowTemplates(false)} />}
      </>
    );
  }

  return (
    <div className={keyboardState ? 'pb-[390px]' : ''}>
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-2xl font-bold truncate">{displayDate}</h2>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-xs font-semibold text-slate-500">训练容量</p>
          <p className="text-xl font-bold text-vibe-green">
            {(state.dailyWorkout?.totalVolume || 0).toLocaleString()} kg
          </p>
        </div>
      </div>

      {orderedExercises.map((exercise, index) => (
        <div
          key={exercise.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, exercise.id)}
          className={`transition-all ${draggingId === exercise.id ? 'opacity-50' : ''}`}
        >
          <ExerciseCard
            exercise={exercise}
            expanded={expandedExercises[exercise.id] !== false}
            onToggleExpand={() => toggleExpanded(exercise.id)}
            onUpdateSet={(setId, updates) => handleUpdateSet(exercise.id, setId, updates)}
            onToggleSetCompleted={(setId) => handleToggleSetCompleted(exercise.id, setId)}
            onAddSet={() => handleAddSet(exercise.id)}
            onToggleLeftRight={() => handleToggleLeftRight(exercise.id)}
            onUpdateCardio={(updates) => handleUpdateCardio(exercise.id, updates)}
            onRemove={() => handleRemoveExercise(exercise.id)}
            onRemoveSet={(setId) => handleRemoveSet(exercise.id, setId)}
            onShowHistory={() => onShowHistory(exercise.id)}
            onDragStart={(e) => handleDragStart(e, exercise.id)}
            onDragEnd={handleDragEnd}
            showDragHandle={orderedExercises.length > 1}
            onMoveUp={index > 0 ? () => handleMoveExercise(exercise.id, -1) : undefined}
            onMoveDown={index < orderedExercises.length - 1 ? () => handleMoveExercise(exercise.id, 1) : undefined}
            onKeyboardShow={(setId, inputType, value) => setKeyboardState({ exerciseId: exercise.id, setId, inputType, value })}
            showKeyboard={keyboardState?.exerciseId === exercise.id}
            activeInputType={keyboardState?.exerciseId === exercise.id ? keyboardState.inputType : null}
            activeSetId={keyboardState?.exerciseId === exercise.id ? keyboardState.setId : null}
          />
        </div>
      ))}

      <div className="py-4 flex justify-center gap-3">
        <Button onClick={onGoToLibrary} variant="secondary">
          <i className="fas fa-plus mr-2"></i>
          添加动作
        </Button>
        <Button onClick={() => setShowTemplates(true)} variant="ghost">
          <i className="fas fa-layer-group mr-2"></i>
          模板
        </Button>
      </div>

      {keyboardState && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            <CustomKeyboard
              value={keyboardState.value}
              onChange={handleKeyboardUpdate}
              onFillUp={handleFillUp}
              onFillDown={handleFillDown}
              hasFillUp={!!getCurrentEditingData()?.prevSet}
              hasFillDown={!!getCurrentEditingData()?.nextSet}
              allowDecimal={keyboardState.inputType !== 'reps'}
              onWeightUnitChange={handleWeightUnitChange}
            />
            <button
              onClick={() => setKeyboardState(null)}
              className="w-full h-12 bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm"
            >
              完成
            </button>
        </div>
      )}
      {showTemplates && <WorkoutTemplateModal onClose={() => setShowTemplates(false)} />}
    </div>
  );
}

function WorkoutTemplateModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [templateName, setTemplateName] = useState(state.dailyWorkout?.name ?? '');
  const currentExerciseIds = state.dailyWorkout?.exercises.map((exercise) => exercise.id) ?? [];

  const applyTemplate = (templateId: string) => {
    if (
      state.dailyWorkout?.exercises.length &&
      !confirm('套用模板会替换当前训练动作，确定继续吗？')
    ) {
      return;
    }
    dispatch({ type: 'APPLY_WORKOUT_TEMPLATE', payload: { templateId } });
    onClose();
  };

  const saveCurrentTemplate = () => {
    if (!templateName.trim() || currentExerciseIds.length === 0) return;
    dispatch({
      type: 'ADD_WORKOUT_TEMPLATE',
      payload: { name: templateName, exerciseIds: currentExerciseIds },
    });
    setTemplateName('');
  };

  const removeTemplate = (templateId: string, name: string) => {
    if (!confirm(`确定删除模板“${name}”吗？`)) return;
    dispatch({ type: 'REMOVE_WORKOUT_TEMPLATE', payload: { templateId } });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-vibe-xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-black">训练模板</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1">自动沿用上次的重量、组数和次数</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-3">
          {state.workoutTemplates.map((template) => {
            const exerciseNames = template.exerciseIds
              .map((id) => state.exerciseLibrary.find((exercise) => exercise.id === id)?.name)
              .filter((name): name is string => Boolean(name));
            return (
              <div key={template.id} className="bg-slate-50 rounded-vibe p-4">
                <div className="flex justify-between gap-3">
                  <button className="flex-1 text-left min-w-0" onClick={() => applyTemplate(template.id)}>
                    <p className="font-black text-sm">{template.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 truncate">
                      {exerciseNames.join(' · ')}
                    </p>
                  </button>
                  <button
                    onClick={() => removeTemplate(template.id, template.name)}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400"
                    aria-label={`删除模板 ${template.name}`}
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {currentExerciseIds.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-black mb-2">保存当前动作为模板</p>
            <div className="flex gap-2">
              <input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="模板名称"
                className="flex-1 h-10 bg-slate-100 rounded-vibe px-3 text-sm outline-none"
              />
              <Button
                onClick={saveCurrentTemplate}
                disabled={!templateName.trim()}
              >
                保存
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface LibraryTabProps {
  onGoToToday: () => void;
  hasTodayWorkout: boolean;
}

function LibraryTab({ onGoToToday, hasTodayWorkout }: LibraryTabProps) {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('');
  const exerciseListRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const isExerciseSelected = (exerciseId: string) => {
    return state.dailyWorkout?.exercises.some((e) => e.id === exerciseId) || false;
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (!hasTodayWorkout && !state.dailyWorkout) {
      dispatch({ type: 'INIT_DAILY_WORKOUT' });
    }
    dispatch({ type: 'ADD_EXERCISE_TO_WORKOUT', payload: exercise });
  };

  const selectedExercises = state.dailyWorkout?.exercises || [];
  const hasSelectedExercises = selectedExercises.length > 0;

  const filteredExercises = state.exerciseLibrary.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscleGroup.includes(searchQuery)
  );

  const muscleGroups = [...new Set(filteredExercises.map((ex) => ex.muscleGroup))];

  const exercisesByGroup = muscleGroups.reduce((acc, group) => {
    acc[group] = filteredExercises.filter((ex) => ex.muscleGroup === group);
    return acc;
  }, {} as Record<string, Exercise[]>);
  const resolvedActiveGroup = muscleGroups.includes(activeGroup)
    ? activeGroup
    : (muscleGroups[0] ?? '');

  const scrollToGroup = (group: string) => {
    setActiveGroup(group);
    const list = exerciseListRef.current;
    const section = sectionRefs.current[group];
    if (!list || !section) return;

    const top = list.scrollTop + section.getBoundingClientRect().top - list.getBoundingClientRect().top;
    list.scrollTo({ top, behavior: 'smooth' });
  };

  const handleExerciseListScroll = () => {
    const list = exerciseListRef.current;
    if (!list) return;

    const listTop = list.getBoundingClientRect().top;
    const visibleGroup = [...muscleGroups].reverse().find((group) => {
      const section = sectionRefs.current[group];
      return section ? section.getBoundingClientRect().top <= listTop + 24 : false;
    });
    if (visibleGroup && visibleGroup !== resolvedActiveGroup) {
      setActiveGroup(visibleGroup);
    }
  };

  const getSectionTitle = (group: string): string => {
    const map: Record<string, string> = {
      '腿': '腿部训练',
      '背': '背部训练',
      '胸': '胸部训练',
      '肩': '肩部训练',
      '臂': '臂部训练',
      '核心': '核心训练',
      '有氧': '有氧训练',
    };
    return map[group] || `${group}训练`;
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <div className="bg-slate-100 rounded-full px-4 h-10 flex items-center gap-3">
          <i className="fas fa-search text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="输入动作名字搜索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs flex-1"
          />
        </div>
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden mt-2">
        <div className="w-24 bg-slate-50 flex flex-col items-center py-4 pl-4 pr-3 gap-6 overflow-y-auto flex-shrink-0">
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => scrollToGroup(group)}
              className={`text-sm font-bold w-full text-center py-1 transition-colors ${
                resolvedActiveGroup === group
                  ? 'border-l-4 border-vibe-green text-vibe-green'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
        <div
          ref={exerciseListRef}
          onScroll={handleExerciseListScroll}
          className="flex-1 p-4 overflow-y-auto pb-4 min-w-0"
        >
          {muscleGroups.map((group) => (
            <div
              key={group}
              ref={(element) => {
                sectionRefs.current[group] = element;
              }}
              className="mb-6"
            >
              <h3 className="text-xs font-black text-slate-400 mb-3 uppercase">
                {getSectionTitle(group)}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {exercisesByGroup[group].map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isSelected={isExerciseSelected(exercise.id)}
                    onSelect={() => handleSelectExercise(exercise)}
                    onUpdateSet={() => {}}
                    onToggleSetCompleted={() => {}}
                    onAddSet={() => {}}
                    onToggleLeftRight={() => {}}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasSelectedExercises && (
        <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-3 pl-28">
          <Button onClick={onGoToToday} className="w-full shadow-sm">
            <i className="fas fa-play mr-2"></i>
            开始训练
          </Button>
        </div>
      )}
    </div>
  );
}

interface HistoryTabProps {
  onShowDayDetail: (date: string, hasWorkout: boolean) => void;
}

function HistoryTab({ onShowDayDetail }: HistoryTabProps) {
  const { state } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const swipeStartX = React.useRef<number | null>(null);

  useAppBack(() => {
    if (!showMonthPicker) return false;
    setShowMonthPicker(false);
    return true;
  }, 100);
  const workouts = useMemo(() => {
    return [
      ...state.workoutHistory,
      ...(state.dailyWorkout ? [state.dailyWorkout] : []),
    ];
  }, [state.workoutHistory, state.dailyWorkout]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const getWorkoutForDay = (date: Date | null) => {
    if (!date) return null;
    const dateStr = formatDate(date);
    return workouts.find((w) => w.date === dateStr);
  };

  const getWorkoutLabels = (workout: DailyWorkout) => {
    const labels = workout.exercises.map((exercise) =>
      exercise.category === 'cardio' ? exercise.name : exercise.muscleGroup
    );

    if (labels.length === 0) {
      labels.push(...workout.muscleGroups.filter((group) => group !== '有氧'));
      if (workout.cardioName) labels.push(workout.cardioName);
    }

    return [...new Set(labels.filter(Boolean))];
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectMonth = (month: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
    setShowMonthPicker(false);
  };

  const selectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
  };

  const handleMonthTouchStart = (event: React.TouchEvent) => {
    swipeStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleMonthTouchEnd = (event: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const distance = endX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(distance) < 60) return;
    if (distance > 0) prevMonth();
    else nextMonth();
  };

  return (
    <div onTouchStart={handleMonthTouchStart} onTouchEnd={handleMonthTouchEnd}>
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-slate-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          onClick={() => setShowMonthPicker(true)}
          className="text-xl font-black flex items-center gap-2 hover:text-vibe-green transition-colors"
        >
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          <i className="fas fa-chevron-down text-xs"></i>
        </button>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-slate-400">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-4 border-b border-slate-100 pb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
          <div key={d} className="text-[10px] font-black text-slate-300 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          const workout = getWorkoutForDay(date);
          const workoutLabels = workout ? getWorkoutLabels(workout) : [];
          return (
            <div
              key={i}
              className={`min-h-24 rounded-lg flex flex-col items-center justify-start p-1 cursor-pointer ${
                workout ? 'bg-slate-50' : ''
              } ${!date ? 'text-slate-200 pointer-events-none' : ''} hover:bg-slate-100 transition-colors`}
              onClick={() => date && onShowDayDetail(formatDate(date), !!workout)}
            >
              <span className="text-xs font-bold">{date?.getDate()}</span>
              {workout && (
                <div className="mt-1 w-full min-w-0 overflow-hidden rounded-md border border-slate-100 bg-white shadow-sm">
                  <div className={`flex flex-wrap justify-center gap-x-1 gap-y-0 px-0.5 py-1 ${
                    workout.totalVolume > 0 ? 'border-b border-slate-100' : ''
                  }`}>
                    {(workoutLabels.length > 0 ? workoutLabels : ['训练']).map((label) => (
                      <span
                        key={label}
                        className="max-w-full text-blue-500 text-[7px] leading-3 font-bold text-center break-all"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  {workout.totalVolume > 0 && (
                    <div className="bg-emerald-50 text-vibe-green text-[clamp(7px,1.8vw,9px)] leading-4 px-0.5 text-center font-mono font-bold tabular-nums tracking-[-0.03em] whitespace-nowrap">
                      {Math.round(workout.totalVolume)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMonthPicker(false)}>
          <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black">选择月份</h3>
              <button onClick={() => setShowMonthPicker(false)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex justify-center items-center gap-4 mb-6">
              <button
                onClick={() => selectYear(currentMonth.getFullYear() - 1)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="text-xl font-black">{currentMonth.getFullYear()}年</span>
              <button
                onClick={() => selectYear(currentMonth.getFullYear() + 1)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((month) => (
                <button
                  key={month}
                  onClick={() => selectMonth(month)}
                  className={`h-12 rounded-vibe flex items-center justify-center font-bold transition-colors ${
                    month === currentMonth.getMonth()
                      ? 'bg-vibe-green text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {month + 1}月
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseTrendTab() {
  const { state } = useApp();
  const workouts = useMemo(
    () => [
      ...state.workoutHistory,
      ...(state.dailyWorkout ? [state.dailyWorkout] : []),
    ],
    [state.workoutHistory, state.dailyWorkout]
  );
  const availableExercises = useMemo(
    () => state.exerciseLibrary.filter(
      (exercise) =>
        exercise.category === 'strength' &&
        workouts.some((workout) => workout.exercises.some(
          (item) => item.id === exercise.id && item.sets.some((set) => set.completed)
        ))
    ),
    [state.exerciseLibrary, workouts]
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState(
    () => availableExercises[0]?.id ?? ''
  );
  const resolvedExerciseId = availableExercises.some(
    (exercise) => exercise.id === selectedExerciseId
  )
    ? selectedExerciseId
    : (availableExercises[0]?.id ?? '');

  const records = useMemo(() => {
    if (!resolvedExerciseId) return [];
    return workouts
      .map((workout) => {
        const exercise = workout.exercises.find((item) => item.id === resolvedExerciseId);
        if (!exercise) return null;
        const completedSets = exercise.sets.filter((set) => set.completed);
        if (completedSets.length === 0) return null;
        return {
          workoutId: workout.id,
          date: workout.date,
          volume: calculateVolume(exercise, state.weightUnit),
          useLeftRight: exercise.useLeftRight,
          sets: completedSets,
        };
      })
      .filter((record): record is {
        workoutId: string;
        date: string;
        volume: number;
        useLeftRight: boolean;
        sets: ExerciseSet[];
      } => record !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [workouts, resolvedExerciseId, state.weightUnit]);

  if (availableExercises.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <i className="fas fa-chart-line text-slate-300 text-xl"></i>
        </div>
        <h3 className="font-black mb-2">暂无动作趋势</h3>
        <p className="text-sm text-slate-400">完成力量训练组后，这里会显示每次动作记录。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <label className="text-[10px] font-black text-slate-400 block mb-2">选择动作</label>
        <select
          value={resolvedExerciseId}
          onChange={(event) => setSelectedExerciseId(event.target.value)}
          className="w-full h-10 bg-slate-100 rounded-vibe px-3 text-sm font-black outline-none"
        >
          {availableExercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <Card key={`${record.workoutId}-${record.date}`} className="p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-black">{record.date}</p>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400">总容量</p>
                <p className="text-sm font-black text-vibe-green">
                  {record.volume.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                </p>
              </div>
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              {record.sets.map((set, index) => (
                <div key={set.id} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400">第{index + 1}组</span>
                  <span className="font-black text-slate-700">
                    {record.useLeftRight
                      ? `左 ${set.leftWeight ?? 0} / 右 ${set.rightWeight ?? 0} ${state.weightUnit}`
                      : `${set.weight ?? 0} ${state.weightUnit}`}
                    {' × '}{set.reps} 次
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ExerciseHistoryModalProps {
  exerciseId: string;
  onClose: () => void;
}

function ExerciseHistoryModal({ exerciseId, onClose }: ExerciseHistoryModalProps) {
  const { state } = useApp();
  const exerciseName = state.exerciseLibrary.find((exercise) => exercise.id === exerciseId)?.name ?? '动作';
  const records = [
    ...state.workoutHistory,
    ...(state.dailyWorkout ? [state.dailyWorkout] : []),
  ]
    .map((workout) => {
      const exercise = workout.exercises.find((item) => item.id === exerciseId);
      return exercise ? { workout, exercise } : null;
    })
    .filter((record): record is { workout: DailyWorkout; exercise: Exercise } => record !== null)
    .sort((a, b) => b.workout.date.localeCompare(a.workout.date));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black">{exerciseName}历史</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {records.map(({ workout, exercise }) => (
            <Card key={workout.id} className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-black">{workout.date}</span>
                <span className="text-vibe-green text-sm font-bold">
                  {calculateVolume(exercise, state.weightUnit).toLocaleString()} kg
                </span>
              </div>
              <div className="space-y-2">
                {exercise.sets.map((set, index) => (
                  <div key={set.id} className="flex justify-between text-sm text-slate-600">
                    <span className={set.completed ? '' : 'text-slate-300'}>
                      第{index + 1}组{set.completed ? '' : '（未完成）'}
                    </span>
                    <span>
                      {exercise.useLeftRight
                        ? `${set.leftWeight ?? 0}/${set.rightWeight ?? 0}`
                        : (set.weight ?? 0)}
                      {state.weightUnit} × {set.reps}次
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {records.length === 0 && (
            <div className="py-10 text-center text-sm font-bold text-slate-400">
              暂无历史记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DayDetailModalProps {
  date: string;
  hasWorkout: boolean;
  onClose: () => void;
  onCopyToToday: () => void;
}

function DayDetailModal({ date, hasWorkout, onClose, onCopyToToday }: DayDetailModalProps) {
  const { state, dispatch } = useApp();
  const workouts = useMemo(() => {
    return [
      ...state.workoutHistory,
      ...(state.dailyWorkout ? [state.dailyWorkout] : []),
    ];
  }, [state.workoutHistory, state.dailyWorkout]);
  const [isEditing, setIsEditing] = useState(false);
  const [workout, setWorkout] = useState<DailyWorkout | null>(() => {
    const found = workouts.find((item) => item.date === date);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  });
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [addingWorkout, setAddingWorkout] = useState(false);
  const [libraryActiveGroup, setLibraryActiveGroup] = useState<string>('');

  useAppBack(() => {
    if (!showLibrary) return false;
    setShowLibrary(false);
    return true;
  }, 120);

  const handleAddWorkout = () => {
    setAddingWorkout(true);
    setWorkout({
      id: generateId(),
      date: date,
      name: '新增训练',
      exercises: [],
      totalVolume: 0,
      muscleGroups: [],
    });
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (workout && confirm('确定要删除这条记录吗？')) {
      dispatch({
        type: 'REMOVE_WORKOUT_RECORD',
        payload: { workoutId: workout.id },
      });
      onClose();
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAddingWorkout(false);

    if (!hasWorkout) {
      onClose();
      return;
    }

    const original = workouts.find((item) => item.date === date);
    setWorkout(original ? JSON.parse(JSON.stringify(original)) : null);
  };

  const handleSaveWorkout = () => {
    if (!workout) return;

    dispatch({
      type: 'SAVE_WORKOUT_RECORD',
      payload: { workout },
    });
    setIsEditing(false);
    setAddingWorkout(false);
  };

  const handleCopyToToday = () => {
    if (!workout) return;
    const hasExistingTodayWorkout = Boolean(state.dailyWorkout);
    if (
      hasExistingTodayWorkout &&
      !confirm('今天已有训练，复制后将替换当前今日训练，是否继续？')
    ) {
      return;
    }

    dispatch({
      type: 'COPY_WORKOUT_TO_TODAY',
      payload: { workout },
    });
    onCopyToToday();
  };

  const toggleExpanded = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId] === false,
    }));
  };

  const handleAddSet = (exerciseId: string) => {
    if (!workout) return;
    const exercise = workout.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: ExerciseSet = {
      id: generateId(),
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      leftWeight: lastSet?.leftWeight,
      rightWeight: lastSet?.rightWeight,
      completed: false,
    };

    setWorkout({
      ...workout,
      exercises: workout.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex
      ),
    });
  };

  const handleUpdateSet = (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((set) =>
              set.id === setId ? { ...set, ...updates } : set
            ),
          };
        }
        return ex;
      }),
    });
  };

  const handleToggleSetCompleted = (exerciseId: string, setId: string) => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((set) =>
              set.id === setId ? { ...set, completed: !set.completed } : set
            ),
          };
        }
        return ex;
      }),
    });
  };

  const handleToggleLeftRight = (exerciseId: string) => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const newUseLeftRight = !ex.useLeftRight;
          const newSets = ex.sets.map((set) => {
            if (newUseLeftRight) {
              return { ...set, leftWeight: set.weight, rightWeight: set.weight };
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
      }),
    });
  };

  const handleUpdateCardio = (
    exerciseId: string,
    updates: Partial<Pick<Exercise, 'durationMinutes' | 'distanceKm' | 'intensity'>>
  ) => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
      ),
    });
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex
      ),
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.filter((ex) => ex.id !== exerciseId),
    });
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (!workout) return;
    const newExercise = {
      ...exercise,
      sets: exercise.category === 'cardio'
        ? []
        : [{ id: generateId(), weight: 0, reps: 0, completed: false }],
    };
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise],
    });
    setShowLibrary(false);
  };

  const calculateTotalVolume = () => {
    if (!workout) return 0;
    return workout.exercises.reduce((sum, ex) => {
      if (ex.category === 'cardio') return sum;
      return sum + ex.sets
        .filter((s) => s.completed)
        .reduce((exSum, s) => {
          if (ex.useLeftRight) {
            return exSum + ((s.leftWeight || 0) + (s.rightWeight || 0)) * s.reps;
          }
          return exSum + (s.weight || 0) * s.reps;
        }, 0);
    }, 0);
  };

  if (!workout && !addingWorkout) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black">{date}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-dumbbell text-slate-300 text-2xl"></i>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">该日无训练</h3>
            <p className="text-slate-400 text-sm mb-6">添加训练记录</p>
            <Button onClick={handleAddWorkout} className="px-8">
              <i className="fas fa-plus mr-2"></i>
              添加训练
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!workout) return null;

  const renderSimpleView = () => (
    <div className="space-y-4">
      {workout.exercises.map((exercise) => {
        const isCardio = exercise.category === 'cardio';
        const exerciseVolume = !isCardio
          ? exercise.sets
              .filter((s) => s.completed)
              .reduce((sum, s) => {
                if (exercise.useLeftRight) {
                  return sum + ((s.leftWeight || 0) + (s.rightWeight || 0)) * s.reps;
                }
                return sum + (s.weight || 0) * s.reps;
              }, 0)
          : 0;

        return (
          <div key={exercise.id} className="bg-slate-50 rounded-vibe p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <i className={`fas ${isCardio ? 'fa-heart-pulse' : 'fa-dumbbell'} text-slate-300`}></i>
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-800">{exercise.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{exercise.muscleGroup}</p>
                </div>
              </div>
              {exerciseVolume > 0 && (
                <span className="text-vibe-green text-sm font-black">{exerciseVolume.toLocaleString()}</span>
              )}
            </div>

            {!isCardio && exercise.sets.length > 0 && (
              <div className="space-y-2">
                {exercise.sets.map((set, idx) => (
                  <div key={set.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold">第{idx + 1}组</span>
                    <span className="text-slate-600">
                      {exercise.useLeftRight
                        ? `${set.leftWeight || 0}/${set.rightWeight || 0}${state.weightUnit} × ${set.reps}次`
                        : `${set.weight}${state.weightUnit} × ${set.reps}次`
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
            {isCardio && (
              <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                {exercise.durationMinutes && <span>{exercise.durationMinutes} 分钟</span>}
                {exercise.distanceKm && <span>{exercise.distanceKm} km</span>}
                {exercise.intensity && <span>强度 {exercise.intensity}/10</span>}
                {!exercise.durationMinutes && !exercise.distanceKm && !exercise.intensity && (
                  <span className="text-slate-300">未填写有氧详情</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white w-full max-w-sm rounded-vibe-xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 pb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black">{workout.date}</h3>
              <div className="flex gap-2">
                {!isEditing && hasWorkout && (
                  <button onClick={() => setIsEditing(true)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                    <i className="fas fa-edit"></i>
                  </button>
                )}
                {hasWorkout && (
                  <button onClick={handleDelete} className="w-8 h-8 flex items-center justify-center text-red-400">
                    <i className="fas fa-trash"></i>
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {(!isEditing || !hasWorkout) && (
              <div className="mt-4">
                <p className="text-[9px] font-black text-slate-400 uppercase">Total Volume</p>
                <p className="text-2xl font-black text-vibe-green">
                  {workout.totalVolume.toLocaleString()}
                </p>
              </div>
            )}

            {isEditing && (
              <div className="mt-4">
                <p className="text-[9px] font-black text-slate-400 uppercase">Total Volume</p>
                <p className="text-2xl font-black text-vibe-green">
                  {calculateTotalVolume().toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {isEditing ? (
              <div className="space-y-4">
                {workout.exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    expanded={expandedExercises[exercise.id] !== false}
                    onToggleExpand={() => toggleExpanded(exercise.id)}
                    onUpdateSet={(setId, updates) => handleUpdateSet(exercise.id, setId, updates)}
                    onToggleSetCompleted={(setId) => handleToggleSetCompleted(exercise.id, setId)}
                    onAddSet={() => handleAddSet(exercise.id)}
                    onToggleLeftRight={() => handleToggleLeftRight(exercise.id)}
                    onUpdateCardio={(updates) => handleUpdateCardio(exercise.id, updates)}
                    onRemove={() => handleRemoveExercise(exercise.id)}
                    onRemoveSet={(setId) => handleRemoveSet(exercise.id, setId)}
                    showControls={true}
                  />
                ))}
              </div>
            ) : (
              renderSimpleView()
            )}

            {isEditing && (
              <div className="mt-4">
                <Button variant="secondary" className="w-full" onClick={() => setShowLibrary(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  添加动作
                </Button>
              </div>
            )}
          </div>

          <div className="p-6 pt-0 flex gap-3 border-t border-slate-50">
            {isEditing ? (
              <>
                <Button variant="secondary" className="flex-1" onClick={handleCancelEdit}>
                  取消
                </Button>
                <Button className="flex-1" onClick={handleSaveWorkout}>
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" className="flex-1" onClick={onClose}>关闭</Button>
                <Button className="flex-1" onClick={handleCopyToToday}>
                  <i className="fas fa-copy mr-2"></i>
                  复制到今天
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {showLibrary && workout && (
        <DayDetailLibraryModal
          workout={workout}
          activeGroup={libraryActiveGroup}
          setActiveGroup={setLibraryActiveGroup}
          onSelectExercise={handleSelectExercise}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </>
  );
}

interface DayDetailLibraryModalProps {
  workout: DailyWorkout;
  activeGroup: string;
  setActiveGroup: (group: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
  onClose: () => void;
}

function DayDetailLibraryModal({ workout, activeGroup, setActiveGroup, onSelectExercise, onClose }: DayDetailLibraryModalProps) {
  const librarySectionRefs = useState<Record<string, HTMLDivElement | null>>({})[0];

  const filteredExercises = DEFAULT_EXERCISES.filter(
    (ex) => !workout.exercises.some((wex) => wex.id === ex.id)
  );
  const muscleGroups = [...new Set(filteredExercises.map((ex) => ex.muscleGroup))];

  const exercisesByGroup = muscleGroups.reduce((acc, group) => {
    acc[group] = filteredExercises.filter((ex) => ex.muscleGroup === group);
    return acc;
  }, {} as Record<string, Exercise[]>);
  const resolvedActiveGroup = muscleGroups.includes(activeGroup)
    ? activeGroup
    : (muscleGroups[0] ?? '');

  const scrollToGroup = (group: string) => {
    setActiveGroup(group);
    librarySectionRefs[group]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getSectionTitle = (group: string): string => {
    const map: Record<string, string> = {
      '腿': '腿部训练',
      '背': '背部训练',
      '胸': '胸部训练',
      '肩': '肩部训练',
      '臂': '臂部训练',
      '核心': '核心训练',
      '有氧': '有氧训练',
    };
    return map[group] || `${group}训练`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60]" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-vibe-xl max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-black">选择动作</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="flex h-[60vh] overflow-hidden">
          <div className="flex h-full">
            <div className="w-24 bg-slate-50 flex flex-col items-center py-4 pl-6 pr-4 gap-6 overflow-y-auto">
              {muscleGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => scrollToGroup(group)}
                  className={`text-sm font-bold w-full text-center py-1 transition-colors ${
                    resolvedActiveGroup === group
                      ? 'border-l-4 border-vibe-green text-vibe-green'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {muscleGroups.map((group) => (
                <div
                  key={group}
                  ref={(el) => (librarySectionRefs[group] = el)}
                  className="mb-6"
                >
                  <h3 className="text-xs font-black text-slate-400 mb-3 uppercase">
                    {getSectionTitle(group)}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {exercisesByGroup[group].map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onSelect={() => onSelectExercise(exercise)}
                        onUpdateSet={() => {}}
                        onToggleSetCompleted={() => {}}
                        onAddSet={() => {}}
                        onToggleLeftRight={() => {}}
                        onRemove={() => {}}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
