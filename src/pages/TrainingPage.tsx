import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { SubTabBar, Card, Button } from '@/components';
import { ExerciseCard, ExerciseImage } from '@/components/training';
import { CustomKeyboard } from '@/components/training';
import {
  generateId,
  formatDate,
  formatDisplayDate,
  calculateVolume,
  getTodayString,
  getLatestBodyWeightKg,
} from '@/utils/constants';
import { useAppBack } from '@/utils/navigation';
import type { Set as ExerciseSet, Exercise, DailyWorkout } from '@/types';
import { getLibraryExercises, formatExerciseSet, formatExerciseSummary } from '@/utils/exerciseCatalog';
import { getWorkoutsForDate } from '@/utils/workoutImport';
import './history.css';

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

  useEffect(() => {
    if (!keyboardState) return;

    const dismissOnOutsideTap = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-workout-numeric-input], [data-workout-keyboard]')
      ) return;

      setKeyboardState(null);
    };

    document.addEventListener('pointerdown', dismissOnOutsideTap);
    return () => document.removeEventListener('pointerdown', dismissOnOutsideTap);
  }, [keyboardState]);

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
      weightUnit: lastSet?.weightUnit,
      weightMode: lastSet?.weightMode,
      restSeconds: lastSet?.restSeconds,
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
    updates: Partial<Pick<Exercise, 'durationMinutes'>>
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
      set: exercise.sets[setIndex],
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
            onKeyboardShow={(setId, inputType, value) => {
              setKeyboardState({ exerciseId: exercise.id, setId, inputType, value });
            }}
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
        <div className="fixed bottom-0 left-0 right-0 z-50" data-workout-keyboard="">
            <CustomKeyboard
              key={`${keyboardState.exerciseId}:${keyboardState.setId}:${keyboardState.inputType}`}
              value={keyboardState.value}
              onChange={handleKeyboardUpdate}
              onFillUp={handleFillUp}
              onFillDown={handleFillDown}
              hasFillUp={!!getCurrentEditingData()?.prevSet}
              hasFillDown={!!getCurrentEditingData()?.nextSet}
              allowDecimal={keyboardState.inputType !== 'reps'}
              onWeightUnitChange={handleWeightUnitChange}
              weightUnitLocked={getCurrentEditingData()?.exercise.volumeMode === 'assisted-bodyweight'}
              fixedWeightUnit={getCurrentEditingData()?.set.weightUnit}
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
            <p className="text-[10px] font-bold text-slate-400 mt-1">每个动作沿用各自最近一次的重量、组数和次数</p>
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
  const [showHidden, setShowHidden] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
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

  const filteredExercises = getLibraryExercises(state.exerciseLibrary, showHidden, searchQuery);
  const hiddenCount = state.exerciseLibrary.filter((exercise) => exercise.hidden).length;
  const toggleHidden = (exercise: Exercise) => dispatch({
    type: 'SET_EXERCISE_HIDDEN', payload: { exerciseId: exercise.id, hidden: !exercise.hidden },
  });

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

    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 2) {
      const lastGroup = muscleGroups[muscleGroups.length - 1];
      if (lastGroup && lastGroup !== resolvedActiveGroup) {
        setActiveGroup(lastGroup);
      }
      return;
    }

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
            className="bg-transparent border-none outline-none text-xs flex-1 min-w-0"
          />
          <button onClick={() => setIsManaging(!isManaging)} className="shrink-0 text-xs font-bold text-vibe-green">
            {isManaging ? '完成管理' : '管理'}
          </button>
        </div>
        <div className="mt-3 flex gap-2 text-xs font-bold">
          <button onClick={() => setShowHidden(false)} aria-pressed={!showHidden}
            className={`flex-1 rounded-xl py-2 ${!showHidden ? 'bg-vibe-green text-white' : 'bg-slate-100 text-slate-500'}`}>
            目前保留的 {state.exerciseLibrary.length - hiddenCount}
          </button>
          <button onClick={() => setShowHidden(true)} aria-pressed={showHidden}
            className={`flex-1 rounded-xl py-2 ${showHidden ? 'bg-vibe-green text-white' : 'bg-slate-100 text-slate-500'}`}>
            已隐藏 {hiddenCount}
          </button>
        </div>
        {(showHidden || isManaging) && <p className="mt-2 text-xs text-slate-400">隐藏仅影响动作选择，历史训练仍保留。点“恢复”可重新使用。</p>}
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
          {filteredExercises.length === 0 && <p className="py-8 text-center text-sm text-slate-400">
            {searchQuery ? '没有匹配的动作' : showHidden ? '暂无隐藏动作' : '暂无保留动作，可到“已隐藏”恢复'}
          </p>}
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
                    isSelected={!showHidden && isExerciseSelected(exercise.id)}
                    onSelect={() => handleSelectExercise(exercise)}
                    selectionDisabled={showHidden || isManaging}
                    onToggleHidden={showHidden || isManaging ? () => toggleHidden(exercise) : undefined}
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
  const swipeStart = React.useRef<{ x: number; y: number } | null>(null);

  useAppBack(() => {
    if (!showMonthPicker) return false;
    setShowMonthPicker(false);
    return true;
  }, 100);

  const workouts = useMemo(() => [
    ...state.workoutHistory,
    ...(state.dailyWorkout ? [state.dailyWorkout] : []),
  ], [state.workoutHistory, state.dailyWorkout]);

  const monthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const monthWorkouts = workouts.filter((workout) => workout.date.startsWith(monthPrefix));
  const trainingDays = new Set(monthWorkouts.map((workout) => workout.date)).size;
  const monthVolume = monthWorkouts.reduce((sum, workout) => sum + workout.totalVolume, 0);
  const today = getTodayString();

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days: (Date | null)[] = Array(new Date(year, month, 1).getDay()).fill(null);
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) days.push(new Date(year, month, day));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const getWorkoutForDay = (date: Date) => {
    const dayWorkouts = getWorkoutsForDate(workouts, formatDate(date));
    if (dayWorkouts.length === 0) return null;
    const exercises = dayWorkouts.flatMap((workout) => workout.exercises);
    const labels = exercises.map((exercise) =>
      exercise.category === 'cardio' ? exercise.name : exercise.muscleGroup
    );
    if (labels.length === 0) {
      dayWorkouts.forEach((workout) => {
        labels.push(...workout.muscleGroups.filter((group) => group !== '有氧'));
        if (workout.cardioName) labels.push(workout.cardioName);
      });
    }
    return {
      labels: [...new Set(labels.filter(Boolean))],
      totalVolume: dayWorkouts.reduce((sum, workout) => sum + workout.totalVolume, 0),
      sessionCount: dayWorkouts.length,
    };
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  };

  const handleMonthTouchEnd = (event: React.TouchEvent) => {
    const start = swipeStart.current;
    const end = event.changedTouches[0];
    swipeStart.current = null;
    if (!start || !end) return;
    const horizontal = end.clientX - start.x;
    const vertical = end.clientY - start.y;
    if (Math.abs(horizontal) < 60 || Math.abs(horizontal) <= Math.abs(vertical)) return;
    changeMonth(horizontal > 0 ? -1 : 1);
  };

  const formatCalendarVolume = (volume: number) => volume >= 10000
    ? `${Number((volume / 10000).toFixed(1))}万`
    : Math.round(volume).toLocaleString();

  return (
    <div className="history-view">
      <section className="history-calendar" aria-label="训练月历">
        <div className="history-month-nav">
          <button type="button" onClick={() => changeMonth(-1)} className="history-icon-button" aria-label="上个月">
            <i aria-hidden="true" className="fas fa-chevron-left"></i>
          </button>
          <button type="button" onClick={() => setShowMonthPicker(true)} className="history-month-title" aria-label="选择月份">
            <span>{currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月</span>
            <i aria-hidden="true" className="fas fa-chevron-down"></i>
          </button>
          <button type="button" onClick={() => changeMonth(1)} className="history-icon-button" aria-label="下个月">
            <i aria-hidden="true" className="fas fa-chevron-right"></i>
          </button>
        </div>

        <div className="history-month-summary">
          <div><span>训练天数</span><strong>{trainingDays}<small>天</small></strong></div>
          <div><span>累计容量</span><strong>{Math.round(monthVolume).toLocaleString()}<small>kg</small></strong></div>
        </div>

        <div
          className="history-calendar-body"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchEnd={handleMonthTouchEnd}
          onTouchCancel={() => { swipeStart.current = null; }}
        >
          <div className="history-weekdays" aria-hidden="true">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="history-calendar-grid">
            {calendarDays.map((date, index) => {
              if (!date) return <div key={`blank-${index}`} className="history-day-empty" aria-hidden="true" />;
              const dateString = formatDate(date);
              const workout = getWorkoutForDay(date);
              const labels = workout?.labels.length ? workout.labels.join('·') : '训练';
              return (
                <button
                  key={dateString}
                  type="button"
                  className={`history-day${workout ? ' has-workout' : ''}${dateString === today ? ' is-today' : ''}`}
                  aria-label={`${dateString}，${workout ? '有训练' : '无训练'}`}
                  aria-current={dateString === today ? 'date' : undefined}
                  onClick={() => onShowDayDetail(dateString, Boolean(workout))}
                >
                  <span className="history-day-number">{date.getDate()}</span>
                  {workout && <>
                    {workout.sessionCount > 1 && <span className="history-session-count" aria-label={`${workout.sessionCount}次训练`}>{workout.sessionCount}</span>}
                    <span className="history-day-label" title={labels}>{labels}</span>
                    {workout.totalVolume > 0 && <span className="history-day-volume" title={`${workout.totalVolume.toLocaleString()} kg`}>
                      {formatCalendarVolume(workout.totalVolume)}
                    </span>}
                  </>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="history-calendar-footer">
          <span><span className="history-legend-dot" />训练日</span>
          <span>容量单位 kg</span>
        </div>
      </section>
      {trainingDays === 0 && <p className="history-month-empty">本月还没有训练记录，点选日期即可添加。</p>}

      {showMonthPicker && (
        <div className="history-overlay fixed inset-0" onClick={() => setShowMonthPicker(false)}>
          <section className="history-picker" role="dialog" aria-modal="true" aria-labelledby="history-month-picker-title" onClick={(event) => event.stopPropagation()}>
            <div className="history-picker-heading">
              <h3 id="history-month-picker-title">选择月份</h3>
              <button type="button" onClick={() => setShowMonthPicker(false)} className="history-icon-button" aria-label="关闭月份选择">
                <i aria-hidden="true" className="fas fa-times"></i>
              </button>
            </div>
            <div className="history-picker-year">
              <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))} className="history-icon-button" aria-label="上一年">
                <i aria-hidden="true" className="fas fa-chevron-left"></i>
              </button>
              <strong>{currentMonth.getFullYear()}年</strong>
              <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))} className="history-icon-button" aria-label="下一年">
                <i aria-hidden="true" className="fas fa-chevron-right"></i>
              </button>
            </div>
            <div className="history-picker-months">
              {Array.from({ length: 12 }, (_, month) => (
                <button type="button" key={month} aria-pressed={month === currentMonth.getMonth()} onClick={() => {
                  setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
                  setShowMonthPicker(false);
                }}>{month + 1}月</button>
              ))}
            </div>
          </section>
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
          volumeMode: exercise.volumeMode,
          recordingMode: exercise.recordingMode,
          bodyWeightKg: exercise.bodyWeightKg,
          sets: completedSets,
        };
      })
      .filter((record): record is {
        workoutId: string;
        date: string;
        volume: number;
        useLeftRight: boolean;
        volumeMode: 'assisted-bodyweight' | undefined;
        recordingMode: Exercise['recordingMode'];
        bodyWeightKg: number | undefined;
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
        {availableExercises.find((exercise) => exercise.id === resolvedExerciseId) && (
          <div className="mt-3 flex justify-center">
            <ExerciseImage exercise={availableExercises.find((exercise) => exercise.id === resolvedExerciseId)!} className="h-20 w-20" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <Card key={`${record.workoutId}-${record.date}`} className="p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-black">{record.date}</p>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400">{record.recordingMode === 'reps-only' ? '总次数' : '总容量'}</p>
                <p className="text-sm font-black text-vibe-green">
                  {formatExerciseSummary(record, state.weightUnit)}
                </p>
              </div>
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              {record.sets.map((set, index) => (
                <div key={set.id} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-400">第{index + 1}组</span>
                  <span className="font-black text-slate-700">
                    {formatExerciseSet(record, set, state.weightUnit)}
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
          <div className="flex items-center gap-2">
            {records[0] && <ExerciseImage exercise={records[0].exercise} />}
            <h3 className="text-lg font-black">{exerciseName}历史</h3>
          </div>
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
                  {formatExerciseSummary(exercise, state.weightUnit)}
                </span>
              </div>
              <div className="space-y-2">
                {exercise.sets.map((set, index) => (
                  <div key={set.id} className="flex justify-between text-sm text-slate-600">
                    <span className={set.completed ? '' : 'text-slate-300'}>
                      第{index + 1}组{set.completed ? '' : '（未完成）'}
                    </span>
                    <span>
                      {formatExerciseSet(exercise, set, state.weightUnit)}
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

    const original = workouts.find((item) => item.id === workout?.id);
    setWorkout(original ? JSON.parse(JSON.stringify(original)) : null);
  };

  const handleSaveWorkout = () => {
    if (!workout) return;

    const savedWorkout = { ...workout, totalVolume: calculateTotalVolume() };
    dispatch({
      type: 'SAVE_WORKOUT_RECORD',
      payload: { workout: savedWorkout },
    });
    setWorkout(savedWorkout);
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
      weightUnit: lastSet?.weightUnit,
      weightMode: lastSet?.weightMode,
      restSeconds: lastSet?.restSeconds,
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
          if (ex.volumeMode === 'assisted-bodyweight' || ex.recordingMode) return ex;
          const newUseLeftRight = !ex.useLeftRight;
          const newSets = ex.sets.map((set) => {
            if (newUseLeftRight) {
              return { ...set, leftWeight: set.weight, rightWeight: set.weight };
            } else {
              return {
                ...set,
                leftWeight: undefined,
                rightWeight: undefined,
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
    updates: Partial<Pick<Exercise, 'durationMinutes'>>
  ) => {
    if (!workout) return;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, ...updates, distanceKm: undefined, intensity: undefined }
          : exercise
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
      bodyWeightKg: exercise.volumeMode === 'assisted-bodyweight'
        ? getLatestBodyWeightKg(state.bodyMetrics)
        : exercise.bodyWeightKg,
    };
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise],
    });
    setShowLibrary(false);
  };

  const calculateTotalVolume = () => {
    if (!workout) return 0;
    return workout.exercises.reduce(
      (sum, exercise) => sum + calculateVolume(exercise, state.weightUnit),
      0
    );
  };

  const weekday = new Date(`${date}T12:00:00`).toLocaleDateString('zh-CN', { weekday: 'long' });

  if (!workout && !addingWorkout) {
    return (
      <div className="history-overlay fixed inset-0" onClick={onClose}>
        <section className="history-detail history-detail-empty" role="dialog" aria-modal="true" aria-labelledby="history-day-title" onClick={(event) => event.stopPropagation()}>
          <header className="history-detail-header">
            <div className="history-detail-topline">
              <div><h3 id="history-day-title">{date}</h3><p className="history-detail-weekday">{weekday}</p></div>
              <button type="button" onClick={onClose} className="history-icon-button" aria-label="关闭训练详情"><i aria-hidden="true" className="fas fa-times"></i></button>
            </div>
          </header>
          <div className="history-empty-state">
            <span className="history-empty-icon"><i aria-hidden="true" className="fas fa-dumbbell"></i></span>
            <h4>这一天还没有训练</h4>
            <p>也可以补记已经完成的训练。</p>
            <Button onClick={handleAddWorkout}><i aria-hidden="true" className="fas fa-plus"></i>添加训练</Button>
          </div>
        </section>
      </div>
    );
  }

  if (!workout) return null;

  const dayWorkouts = getWorkoutsForDate(workouts, date);
  const isSavedWorkout = dayWorkouts.some((item) => item.id === workout.id);
  const completedSets = workout.exercises.reduce((count, exercise) =>
    count + exercise.sets.filter((set) => set.completed).length, 0
  );
  const detailVolume = isEditing ? calculateTotalVolume() : workout.totalVolume;
  const sessionLabel = (item: DailyWorkout, index: number) => {
    const groups = [...new Set(item.exercises.map((exercise) =>
      exercise.category === 'cardio' ? '有氧' : exercise.muscleGroup
    ).filter(Boolean))];
    return `第 ${index + 1} 次训练${groups.length ? ` · ${groups.join(' / ')}` : ''}`;
  };

  const renderSimpleView = () => (
    <div className="history-exercises">
      {workout.exercises.length === 0 && <div className="history-no-exercises">
        <i aria-hidden="true" className="fas fa-clipboard-list"></i>
        <p>这条训练未记录具体动作</p>
      </div>}
      {workout.exercises.map((exercise) => (
        <article key={exercise.id} className="history-exercise">
          <div className="history-exercise-heading">
            <ExerciseImage exercise={exercise} className="history-exercise-image" />
            <div className="history-exercise-title">
              <h4>{exercise.name}</h4>
              <p>{exercise.muscleGroup}{exercise.category !== 'cardio' && exercise.sets.length > 0 ? ` · ${exercise.sets.length}组` : ''}</p>
            </div>
          </div>
          {exercise.category !== 'cardio' && exercise.sets.length > 0 && (
            <div className="history-set-list">
              {exercise.sets.map((set, index) => (
                <div key={set.id} className={`history-set-row${set.completed ? '' : ' is-incomplete'}`}>
                  <span className="history-set-label">第{index + 1}组{!set.completed && <small>未完成</small>}</span>
                  <span className="history-set-value">{formatExerciseSet(exercise, set, state.weightUnit)}</span>
                </div>
              ))}
            </div>
          )}
          {exercise.notes?.map((note, index) => <p key={index} className="history-exercise-note">{note}</p>)}
          {exercise.category === 'cardio' && <p className="history-cardio-duration">
            <i aria-hidden="true" className="far fa-clock"></i>
            {exercise.durationMinutes ? `${exercise.durationMinutes} 分钟` : '未填写时长'}
          </p>}
        </article>
      ))}
    </div>
  );

  return (
    <>
      <div className="history-overlay fixed inset-0" onClick={onClose}>
        <section className="history-detail" role="dialog" aria-modal="true" aria-labelledby="history-day-title" onClick={(event) => event.stopPropagation()}>
          <header className="history-detail-header">
            <div className="history-detail-topline">
              <div>
                <h3 id="history-day-title">{date}</h3>
                <p className="history-detail-weekday">{weekday}{isEditing ? ' · 编辑训练' : ''}</p>
              </div>
              <div className="history-detail-actions">
                {!isEditing && <button type="button" onClick={() => setIsEditing(true)} className="history-icon-button" aria-label="编辑训练" title="编辑训练">
                  <i aria-hidden="true" className="fas fa-pen"></i>
                </button>}
                {isSavedWorkout && <button type="button" onClick={handleDelete} className="history-icon-button history-delete-button" aria-label="删除训练" title="删除训练">
                  <i aria-hidden="true" className="far fa-trash-alt"></i>
                </button>}
                <button type="button" onClick={onClose} className="history-icon-button" aria-label="关闭训练详情" title="关闭">
                  <i aria-hidden="true" className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {dayWorkouts.length > 1 && <div className="history-session-picker">
              <select
                aria-label="当天训练记录"
                value={workout.id}
                disabled={isEditing}
                onChange={(event) => {
                  const selected = dayWorkouts.find((item) => item.id === event.target.value);
                  if (selected) {
                    setWorkout(JSON.parse(JSON.stringify(selected)));
                    setExpandedExercises({});
                  }
                }}
              >
                {dayWorkouts.map((item, index) => <option key={item.id} value={item.id}>{sessionLabel(item, index)}</option>)}
              </select>
              <i aria-hidden="true" className="fas fa-chevron-down"></i>
            </div>}

            <div className="history-detail-summary">
              <div className="history-volume">
                <span>训练容量</span>
                <strong>{detailVolume.toLocaleString()}<small>kg</small></strong>
              </div>
              <p className="history-detail-meta">
                <span>{workout.exercises.length} 个动作</span>
                {completedSets > 0 && <span>{completedSets} 组完成</span>}
                {workout.durationMinutes !== undefined && workout.durationMinutes > 0 && <span>{workout.durationMinutes} 分钟</span>}
              </p>
            </div>
          </header>

          <div className="history-detail-content">
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
                <Button variant="secondary" className="w-full" onClick={() => setShowLibrary(true)}>
                  <i aria-hidden="true" className="fas fa-plus"></i>添加动作
                </Button>
              </div>
            ) : renderSimpleView()}
          </div>

          {(isEditing || workout.date !== getTodayString()) && (
            <footer className="history-detail-footer">
              {isEditing ? <>
                <Button variant="secondary" className="flex-1" onClick={handleCancelEdit}>取消</Button>
                <Button className="flex-1" onClick={handleSaveWorkout}>保存</Button>
              </> : <Button className="w-full" onClick={handleCopyToToday}>
                <i aria-hidden="true" className="far fa-copy"></i>复制到今天
              </Button>}
            </footer>
          )}
        </section>
      </div>

      {showLibrary && (
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
  const libraryListRef = React.useRef<HTMLDivElement>(null);
  const librarySectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const { state } = useApp();
  const filteredExercises = getLibraryExercises(state.exerciseLibrary).filter(
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
    const list = libraryListRef.current;
    const section = librarySectionRefs.current[group];
    if (!list || !section) return;
    const top = list.scrollTop + section.getBoundingClientRect().top - list.getBoundingClientRect().top;
    list.scrollTo({ top, behavior: 'smooth' });
  };

  const handleLibraryScroll = () => {
    const list = libraryListRef.current;
    if (!list) return;

    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 2) {
      const lastGroup = muscleGroups[muscleGroups.length - 1];
      if (lastGroup && lastGroup !== resolvedActiveGroup) setActiveGroup(lastGroup);
      return;
    }

    const listTop = list.getBoundingClientRect().top;
    const visibleGroup = [...muscleGroups].reverse().find((group) => {
      const section = librarySectionRefs.current[group];
      return section ? section.getBoundingClientRect().top <= listTop + 24 : false;
    });
    if (visibleGroup && visibleGroup !== resolvedActiveGroup) setActiveGroup(visibleGroup);
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
            <div
              ref={libraryListRef}
              onScroll={handleLibraryScroll}
              className="flex-1 p-4 overflow-y-auto"
            >
              {muscleGroups.map((group) => (
                <div
                  key={group}
                  ref={(el) => {
                    librarySectionRefs.current[group] = el;
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
