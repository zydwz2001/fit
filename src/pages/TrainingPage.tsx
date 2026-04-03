import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { SubTabBar, Card, Button } from '@/components';
import { ExerciseCard } from '@/components/training';
import { CustomKeyboard } from '@/components/training';
import { generateId, formatDate, formatDisplayDate } from '@/utils/constants';
import type { Set as ExerciseSet, Exercise, DailyWorkout } from '@/types';
import { DEFAULT_EXERCISES } from '@/types';

const SUB_TABS = [
  { id: 'today', label: '今日健身' },
  { id: 'history', label: '月视图回顾' },
  { id: 'library', label: '动作库' },
];

// 深蹲历史记录数据
const SQUAT_HISTORY = [
  { date: '2026-03-28', sets: [{ weight: 80, reps: 10 }, { weight: 80, reps: 8 }, { weight: 85, reps: 6 }], volume: 2150 },
  { date: '2026-03-21', sets: [{ weight: 75, reps: 12 }, { weight: 75, reps: 10 }, { weight: 80, reps: 8 }], volume: 2230 },
  { date: '2026-03-14', sets: [{ weight: 70, reps: 12 }, { weight: 75, reps: 10 }, { weight: 75, reps: 8 }], volume: 2090 },
];

// 历史月数据
const HISTORY_WORKOUTS: DailyWorkout[] = [
  {
    id: 'h1',
    date: '2026-03-28',
    name: '练腿日',
    exercises: [
      { id: 'he1', name: '深蹲', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [
        { id: 's1', weight: 80, reps: 10, completed: true },
        { id: 's2', weight: 80, reps: 8, completed: true },
        { id: 's3', weight: 85, reps: 6, completed: true },
      ] },
      { id: 'he2', name: '硬拉', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [
        { id: 's4', weight: 100, reps: 8, completed: true },
        { id: 's5', weight: 100, reps: 7, completed: true },
      ] },
      { id: 'he3', name: '髋外展', muscleGroup: '腿', category: 'strength', useLeftRight: true, sets: [
        { id: 's6', weight: 0, leftWeight: 30, rightWeight: 30, reps: 15, completed: true },
        { id: 's7', weight: 0, leftWeight: 30, rightWeight: 30, reps: 12, completed: true },
      ] },
    ],
    totalVolume: 4230,
    muscleGroups: ['腿'],
  },
  {
    id: 'h2',
    date: '2026-03-25',
    name: '练胸日',
    exercises: [
      { id: 'he4', name: '杠铃卧推', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [
        { id: 's8', weight: 60, reps: 10, completed: true },
        { id: 's9', weight: 65, reps: 8, completed: true },
        { id: 's10', weight: 70, reps: 5, completed: true },
      ] },
      { id: 'he5', name: '哑铃卧推', muscleGroup: '胸', category: 'strength', useLeftRight: true, sets: [
        { id: 's11', weight: 0, leftWeight: 25, rightWeight: 25, reps: 12, completed: true },
        { id: 's12', weight: 0, leftWeight: 25, rightWeight: 25, reps: 10, completed: true },
      ] },
    ],
    totalVolume: 2680,
    muscleGroups: ['胸'],
  },
  {
    id: 'h3',
    date: '2026-03-22',
    name: '练背日',
    exercises: [
      { id: 'he6', name: '澳式引体', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [
        { id: 's13', weight: 0, reps: 12, completed: true },
        { id: 's14', weight: 0, reps: 10, completed: true },
        { id: 's15', weight: 0, reps: 8, completed: true },
      ] },
      { id: 'he7', name: '杠铃划船', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [
        { id: 's16', weight: 50, reps: 10, completed: true },
        { id: 's17', weight: 55, reps: 8, completed: true },
      ] },
      { id: 'he8', name: '高位下拉', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [
        { id: 's18', weight: 45, reps: 12, completed: true },
        { id: 's19', weight: 50, reps: 10, completed: true },
      ] },
    ],
    totalVolume: 2340,
    muscleGroups: ['背'],
  },
  {
    id: 'h4',
    date: '2026-03-20',
    name: '有氧日',
    exercises: [
      { id: 'he9', name: '游泳', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
    ],
    totalVolume: 0,
    muscleGroups: ['有氧'],
    cardioName: '游泳',
  },
  {
    id: 'h5',
    date: '2026-03-18',
    name: '练肩日',
    exercises: [
      { id: 'he10', name: '哑铃推肩', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [
        { id: 's20', weight: 0, leftWeight: 12, rightWeight: 12, reps: 12, completed: true },
        { id: 's21', weight: 0, leftWeight: 12, rightWeight: 12, reps: 10, completed: true },
        { id: 's22', weight: 0, leftWeight: 14, rightWeight: 14, reps: 8, completed: true },
      ] },
      { id: 'he11', name: '哑铃侧平举', muscleGroup: '肩', category: 'strength', useLeftRight: true, sets: [
        { id: 's23', weight: 0, leftWeight: 5, rightWeight: 5, reps: 15, completed: true },
        { id: 's24', weight: 0, leftWeight: 5, rightWeight: 5, reps: 12, completed: true },
      ] },
    ],
    totalVolume: 1364,
    muscleGroups: ['肩'],
  },
  {
    id: 'h6',
    date: '2026-03-15',
    name: '有氧日',
    exercises: [
      { id: 'he12', name: '自由搏击', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
    ],
    totalVolume: 0,
    muscleGroups: ['有氧'],
    cardioName: '自由搏击',
  },
  {
    id: 'h7',
    date: '2026-03-12',
    name: '练腿日',
    exercises: [
      { id: 'he13', name: '硬拉', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [
        { id: 's25', weight: 90, reps: 10, completed: true },
        { id: 's26', weight: 95, reps: 8, completed: true },
        { id: 's27', weight: 100, reps: 5, completed: true },
      ] },
      { id: 'he14', name: '保加利亚深蹲', muscleGroup: '腿', category: 'strength', useLeftRight: false, sets: [
        { id: 's28', weight: 20, reps: 10, completed: true },
        { id: 's29', weight: 20, reps: 8, completed: true },
      ] },
    ],
    totalVolume: 3020,
    muscleGroups: ['腿'],
  },
  {
    id: 'h8',
    date: '2026-03-10',
    name: '练胸日',
    exercises: [
      { id: 'he15', name: '俯卧撑', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [
        { id: 's30', weight: 0, reps: 15, completed: true },
        { id: 's31', weight: 0, reps: 12, completed: true },
        { id: 's32', weight: 0, reps: 10, completed: true },
      ] },
      { id: 'he16', name: '器械飞鸟', muscleGroup: '胸', category: 'strength', useLeftRight: false, sets: [
        { id: 's33', weight: 25, reps: 12, completed: true },
        { id: 's34', weight: 25, reps: 10, completed: true },
      ] },
    ],
    totalVolume: 1100,
    muscleGroups: ['胸'],
  },
  {
    id: 'h9',
    date: '2026-03-08',
    name: '有氧日',
    exercises: [
      { id: 'he17', name: '爬坡', muscleGroup: '有氧', category: 'cardio', useLeftRight: false, sets: [] },
    ],
    totalVolume: 0,
    muscleGroups: ['有氧'],
    cardioName: '爬坡',
  },
  {
    id: 'h10',
    date: '2026-03-05',
    name: '练背日',
    exercises: [
      { id: 'he18', name: '哑铃划船', muscleGroup: '背', category: 'strength', useLeftRight: true, sets: [
        { id: 's35', weight: 0, leftWeight: 20, rightWeight: 20, reps: 12, completed: true },
        { id: 's36', weight: 0, leftWeight: 22, rightWeight: 22, reps: 10, completed: true },
      ] },
      { id: 'he19', name: 'T杠划船', muscleGroup: '背', category: 'strength', useLeftRight: false, sets: [
        { id: 's37', weight: 40, reps: 10, completed: true },
        { id: 's38', weight: 45, reps: 8, completed: true },
      ] },
    ],
    totalVolume: 1600,
    muscleGroups: ['背'],
  },
];

export function TrainingPage() {
  const { state } = useApp();
  const [subTab, setSubTab] = useState('today');
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [showDayDetailModal, setShowDayDetailModal] = useState<{ date: string; hasWorkout: boolean } | null>(null);

  return (
    <>
      <SubTabBar
        tabs={SUB_TABS}
        activeTab={subTab}
        onTabChange={setSubTab}
      />
      {subTab === 'today' && (
        <div className="scroll-content p-6">
          <TodayTab
            onGoToLibrary={() => setSubTab('library')}
            onShowHistory={(exerciseId) => setShowHistoryModal(exerciseId)}
          />
        </div>
      )}
      {subTab === 'history' && (
        <div className="scroll-content p-6">
          <HistoryTab onShowDayDetail={(date, hasWorkout) => setShowDayDetailModal({ date, hasWorkout })} />
        </div>
      )}
      {subTab === 'library' && (
        <LibraryTab
          onGoToToday={() => setSubTab('today')}
          hasTodayWorkout={!!state.dailyWorkout}
        />
      )}

      {/* 动作历史弹窗 */}
      {showHistoryModal && (
        <ExerciseHistoryModal
          exerciseId={showHistoryModal}
          onClose={() => setShowHistoryModal(null)}
        />
      )}

      {/* 月视图详情弹窗 */}
      {showDayDetailModal && (
        <DayDetailModal
          date={showDayDetailModal.date}
          hasWorkout={showDayDetailModal.hasWorkout}
          onClose={() => setShowDayDetailModal(null)}
        />
      )}
    </>
  );
}

interface TodayTabProps {
  onGoToLibrary: () => void;
  onShowHistory: (exerciseId: string) => void;
}

function TodayTab({ onGoToLibrary, onShowHistory }: TodayTabProps) {
  const { state, dispatch } = useApp();
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [keyboardState, setKeyboardState] = useState<{
    exerciseId: string;
    setId: string;
    inputType: 'weight' | 'leftWeight' | 'rightWeight' | 'reps';
    value: string;
  } | null>(null);

  // 所有 hooks 必须放在最前面！
  const displayDate = useMemo(() => formatDisplayDate(new Date()), []);

  // 初始化顺序，每次 exercises 变化时都更新
  React.useEffect(() => {
    if (state.dailyWorkout) {
      setOrder(state.dailyWorkout.exercises.map((ex) => ex.id));
    }
  }, [state.dailyWorkout?.exercises]);

  // 按当前顺序获取练习
  const orderedExercises = useMemo(() => {
    if (!state.dailyWorkout || !Array.isArray(state.dailyWorkout.exercises)) {
      return [];
    }
    const exerciseMap = new Map(state.dailyWorkout.exercises.map((ex) => [ex.id, ex]));
    return order.map((id) => exerciseMap.get(id)).filter((ex): ex is Exercise => ex !== undefined);
  }, [order, state.dailyWorkout?.exercises]);

  const toggleExpanded = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId] !== false,
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

  const handleRemoveExercise = (exerciseId: string) => {
    dispatch({ type: 'REMOVE_EXERCISE', payload: { exerciseId } });
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    dispatch({ type: 'REMOVE_SET', payload: { exerciseId, setId } });
  };

  // 简单拖拽处理
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

    const newOrder = [...order];
    const sourceIndex = newOrder.indexOf(sourceId);
    const targetIndex = newOrder.indexOf(targetId);
    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, sourceId);
    setOrder(newOrder);
    setDraggingId(null);
    dispatch({ type: 'REORDER_EXERCISES', payload: { exerciseIds: newOrder } });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // 获取当前正在编辑的 exercise 和 set
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

  const handleFillUp = () => {
    const data = getCurrentEditingData();
    if (!data || !keyboardState) return;
    const currentValue = data.exercise.sets[data.setIndex][keyboardState.inputType];
    if (currentValue === undefined) return;

    // 向上填充：把当前值填充到上面所有的组
    for (let i = 0; i < data.setIndex; i++) {
      const set = data.exercise.sets[i];
      if (keyboardState.inputType === 'leftWeight' || keyboardState.inputType === 'rightWeight') {
        // 左右输入模式，左右都改
        handleUpdateSet(keyboardState.exerciseId, set.id, {
          leftWeight: currentValue,
          rightWeight: currentValue,
        });
      } else {
        handleUpdateSet(keyboardState.exerciseId, set.id, {
          [keyboardState.inputType]: currentValue,
        });
      }
    }
  };

  const handleFillDown = () => {
    const data = getCurrentEditingData();
    if (!data || !keyboardState) return;
    const currentValue = data.exercise.sets[data.setIndex][keyboardState.inputType];
    if (currentValue === undefined) return;

    // 向下填充：把当前值填充到下面所有的组
    for (let i = data.setIndex + 1; i < data.exercise.sets.length; i++) {
      const set = data.exercise.sets[i];
      if (keyboardState.inputType === 'leftWeight' || keyboardState.inputType === 'rightWeight') {
        // 左右输入模式，左右都改
        handleUpdateSet(keyboardState.exerciseId, set.id, {
          leftWeight: currentValue,
          rightWeight: currentValue,
        });
      } else {
        handleUpdateSet(keyboardState.exerciseId, set.id, {
          [keyboardState.inputType]: currentValue,
        });
      }
    }
  };

  // 提前返回，但所有 hooks 都已经在上面调用了
  if (!state.dailyWorkout || state.dailyWorkout.exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
        <div className="w-20 h-20 bg-vibe-green/10 rounded-full flex items-center justify-center">
          <i className="fas fa-dumbbell text-vibe-green text-2xl"></i>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black mb-2">开始今日训练</h3>
          <p className="text-slate-400 text-sm mb-6">选择动作开始你的训练</p>
        </div>
        <Button onClick={onGoToLibrary} className="px-8">
          <i className="fas fa-plus mr-2"></i>
          开始训练
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-2xl font-black italic truncate">{displayDate}</h2>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-[9px] font-black text-slate-400 uppercase">Total Volume</p>
          <p className="text-xl font-black text-vibe-green">
            {(state.dailyWorkout?.totalVolume || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {orderedExercises.map((exercise) => (
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
            onRemove={() => handleRemoveExercise(exercise.id)}
            onRemoveSet={(setId) => handleRemoveSet(exercise.id, setId)}
            onShowHistory={() => onShowHistory(exercise.id)}
            onDragStart={(e) => handleDragStart(e, exercise.id)}
            onDragEnd={handleDragEnd}
            showDragHandle={orderedExercises.length > 1}
            onKeyboardShow={(setId, inputType, value) => setKeyboardState({ exerciseId: exercise.id, setId, inputType, value })}
            onKeyboardHide={() => setKeyboardState(null)}
            showKeyboard={keyboardState?.exerciseId === exercise.id}
            activeInputType={keyboardState?.exerciseId === exercise.id ? keyboardState.inputType : null}
            activeSetId={keyboardState?.exerciseId === exercise.id ? keyboardState.setId : null}
          />
        </div>
      ))}

      <div className="text-center py-4">
        <Button onClick={onGoToLibrary} variant="secondary">
          <i className="fas fa-plus mr-2"></i>
          添加动作
        </Button>
      </div>

      {/* 自定义键盘 */}
      {keyboardState && (
        <>
          {/* 点击背景遮罩收起键盘 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setKeyboardState(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <CustomKeyboard
              value={keyboardState.value}
              onChange={handleKeyboardUpdate}
              onFillUp={handleFillUp}
              onFillDown={handleFillDown}
              hasFillUp={!!getCurrentEditingData()?.nextSet}
              hasFillDown={!!getCurrentEditingData()?.prevSet}
            />
            <button
              onClick={() => setKeyboardState(null)}
              className="w-full h-12 bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm"
            >
              完成
            </button>
          </div>
        </>
      )}
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
  const sectionRefs = useState<Record<string, HTMLDivElement | null>>({})[0];

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

  // 按肌肉群分组
  const exercisesByGroup = muscleGroups.reduce((acc, group) => {
    acc[group] = filteredExercises.filter((ex) => ex.muscleGroup === group);
    return acc;
  }, {} as Record<string, Exercise[]>);

  // 设置默认选中第一个分组
  React.useEffect(() => {
    if (muscleGroups.length > 0 && !activeGroup) {
      setActiveGroup(muscleGroups[0]);
    }
  }, [muscleGroups, activeGroup]);

  const scrollToGroup = (group: string) => {
    setActiveGroup(group);
    sectionRefs[group]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 肌肉群到区域名称的映射
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
    <div className="flex flex-col h-full w-full relative">
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
      <div className="flex flex-1 overflow-hidden mt-4">
        <div className="w-24 bg-slate-50 flex flex-col items-center py-4 pl-4 pr-3 gap-6 overflow-y-auto flex-shrink-0">
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => scrollToGroup(group)}
              className={`text-sm font-bold w-full text-center py-1 transition-colors ${
                activeGroup === group
                  ? 'border-l-4 border-vibe-green text-vibe-green'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
        <div className="flex-1 p-4 overflow-y-auto pb-24 min-w-0">
          {muscleGroups.map((group) => (
            <div
              key={group}
              ref={(el) => (sectionRefs[group] = el)}
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

      {/* 悬浮开始训练按钮 */}
      {hasSelectedExercises && (
        <div className="absolute bottom-36 left-0 right-0 flex justify-center z-10">
          <Button onClick={onGoToToday} className="px-8 shadow-lg">
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

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
    return HISTORY_WORKOUTS.find((w) => w.date === dateStr);
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

  return (
    <div>
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
          return (
            <div
              key={i}
              className={`h-16 rounded-lg flex flex-col items-center justify-start p-1 cursor-pointer ${
                workout ? 'bg-slate-50' : ''
              } ${!date ? 'text-slate-200 pointer-events-none' : ''} hover:bg-slate-100 transition-colors`}
              onClick={() => date && onShowDayDetail(formatDate(date), !!workout)}
            >
              <span className="text-xs font-bold">{date?.getDate()}</span>
              {workout && (
                <div className="flex flex-col gap-0.5 mt-1 w-full">
                  <span className="bg-blue-500 text-white text-[8px] px-1 rounded truncate text-center">
                    {workout.muscleGroups[0]}
                  </span>
                  <span className="bg-vibe-green text-white text-[8px] px-1 rounded truncate text-center">
                    {workout.totalVolume}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 月份选择器弹窗 */}
      {showMonthPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMonthPicker(false)}>
          <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black">选择月份</h3>
              <button onClick={() => setShowMonthPicker(false)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 年份选择 */}
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

            {/* 月份网格 */}
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

interface ExerciseHistoryModalProps {
  exerciseId?: string;
  onClose: () => void;
}

function ExerciseHistoryModal({ onClose }: ExerciseHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black">深蹲历史</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {SQUAT_HISTORY.map((record, i) => (
            <Card key={i} className="p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-black">{record.date}</span>
                <span className="text-vibe-green text-sm font-bold">{record.volume}</span>
              </div>
              <div className="space-y-2">
                {record.sets.map((set, j) => (
                  <div key={j} className="flex justify-between text-sm text-slate-600">
                    <span>第{j + 1}组</span>
                    <span>{set.weight}kg × {set.reps}次</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DayDetailModalProps {
  date: string;
  hasWorkout: boolean;
  onClose: () => void;
}

function DayDetailModal({ date, hasWorkout, onClose }: DayDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [workout, setWorkout] = useState<DailyWorkout | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [addingWorkout, setAddingWorkout] = useState(false);
  const [libraryActiveGroup, setLibraryActiveGroup] = useState<string>('');

  React.useEffect(() => {
    const found = HISTORY_WORKOUTS.find((w) => w.date === date);
    if (found) {
      setWorkout(JSON.parse(JSON.stringify(found)));
    } else {
      setWorkout(null);
    }
  }, [date]);

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
    if (confirm('确定要删除这条记录吗？')) {
      onClose();
    }
  };

  const toggleExpanded = (exerciseId: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId] !== false,
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
              const { leftWeight, rightWeight, ...rest } = set;
              return { ...rest, weight: leftWeight || 0 };
            }
          });
          return { ...ex, useLeftRight: newUseLeftRight, sets: newSets };
        }
        return ex;
      }),
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
      sets: [{ id: generateId(), weight: 0, reps: 0, completed: false }],
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

  // 如果没有训练记录且不是在添加中
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

  // 非编辑模式下的简洁显示
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
                        ? `${set.leftWeight || 0}/${set.rightWeight || 0}kg × ${set.reps}次`
                        : `${set.weight}kg × ${set.reps}次`
                      }
                    </span>
                  </div>
                ))}
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
                <Button variant="secondary" className="flex-1" onClick={() => {
                  setIsEditing(false);
                  setAddingWorkout(false);
                  if (!hasWorkout) {
                    onClose();
                  }
                }}>取消</Button>
                <Button className="flex-1" onClick={() => {
                  setIsEditing(false);
                  setAddingWorkout(false);
                }}>完成</Button>
              </>
            ) : (
              <Button className="w-full" onClick={onClose}>关闭</Button>
            )}
          </div>
        </div>
      </div>

      {/* 动作库选择弹窗 - 带部位选择 */}
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

  React.useEffect(() => {
    if (muscleGroups.length > 0 && !activeGroup) {
      setActiveGroup(muscleGroups[0]);
    }
  }, [muscleGroups, activeGroup, setActiveGroup]);

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
                    activeGroup === group
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
