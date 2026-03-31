import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { SubTabBar, Card, Button } from '@/components';
import { ExerciseCard } from '@/components/training';
import { generateId, formatDate } from '@/utils/constants';
import type { Set as ExerciseSet, Exercise, DailyWorkout } from '@/types';

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
      { id: 'he1', name: '深蹲', muscleGroup: '腿', useLeftRight: false, sets: [] },
    ],
    totalVolume: 2150,
    muscleGroups: ['腿'],
  },
  {
    id: 'h2',
    date: '2026-03-25',
    name: '练胸日',
    exercises: [
      { id: 'he2', name: '卧推', muscleGroup: '胸', useLeftRight: false, sets: [] },
    ],
    totalVolume: 1520,
    muscleGroups: ['胸'],
  },
  {
    id: 'h3',
    date: '2026-03-22',
    name: '练背日',
    exercises: [
      { id: 'he3', name: '引体向上', muscleGroup: '背', useLeftRight: false, sets: [] },
    ],
    totalVolume: 1890,
    muscleGroups: ['背'],
  },
];

export function TrainingPage() {
  const { state } = useApp();
  const [subTab, setSubTab] = useState('today');
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [showDayDetailModal, setShowDayDetailModal] = useState<string | null>(null);

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
          <HistoryTab onShowDayDetail={(date) => setShowDayDetailModal(date)} />
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
          date={showDayDetailModal}
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [workoutName, setWorkoutName] = useState(state.dailyWorkout?.name || '今日训练');

  if (!state.dailyWorkout) {
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

  if (state.dailyWorkout.exercises.length === 0) {
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

  const handleSaveName = () => {
    dispatch({ type: 'UPDATE_WORKOUT_NAME', payload: { name: workoutName } });
    setIsEditingName(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="text-2xl font-black italic bg-transparent border-b-2 border-vibe-green outline-none"
              autoFocus
            />
          ) : (
            <>
              <h2 className="text-2xl font-black italic">{state.dailyWorkout.name}</h2>
              <button
                onClick={() => setIsEditingName(true)}
                className="text-slate-300 hover:text-slate-500"
              >
                <i className="fas fa-pen text-xs"></i>
              </button>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase">Total Volume</p>
          <p className="text-xl font-black text-vibe-green">
            {state.dailyWorkout.totalVolume.toLocaleString()}
          </p>
        </div>
      </div>

      {state.dailyWorkout.exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onUpdateSet={(setId, updates) => handleUpdateSet(exercise.id, setId, updates)}
          onToggleSetCompleted={(setId) => handleToggleSetCompleted(exercise.id, setId)}
          onAddSet={() => handleAddSet(exercise.id)}
          onToggleLeftRight={() => handleToggleLeftRight(exercise.id)}
          onRemove={() => handleRemoveExercise(exercise.id)}
          onRemoveSet={(setId) => handleRemoveSet(exercise.id, setId)}
          onShowHistory={() => onShowHistory(exercise.id)}
        />
      ))}

      <div className="text-center py-4">
        <p className="text-slate-400 text-sm">
          去<a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onGoToLibrary();
            }}
            className="text-vibe-green font-bold"
          >
            动作库
          </a>
          添加更多动作
        </p>
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

  const isExerciseSelected = (exerciseId: string) => {
    return state.dailyWorkout?.exercises.some((e) => e.id === exerciseId) || false;
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (!hasTodayWorkout) {
      dispatch({ type: 'INIT_DAILY_WORKOUT' });
    }
    dispatch({ type: 'ADD_EXERCISE_TO_WORKOUT', payload: exercise });
    if (!hasTodayWorkout) {
      setTimeout(onGoToToday, 100);
    }
  };

  const filteredExercises = state.exerciseLibrary.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscleGroup.includes(searchQuery)
  );

  const muscleGroups = [...new Set(filteredExercises.map((ex) => ex.muscleGroup))];

  return (
    <div className="flex flex-col h-full overflow-hidden -mx-6 -mt-2">
      <div className="px-6 py-2">
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
        <div className="w-20 bg-slate-50 flex flex-col items-center py-4 gap-6">
          {muscleGroups.map((group, i) => (
            <div
              key={group}
              className={`text-sm font-bold ${i === 0 ? 'border-l-4 border-vibe-green pl-2 text-vibe-green' : 'text-slate-400'}`}
            >
              {group}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 grid grid-cols-2 gap-3 overflow-y-auto">
          {filteredExercises.map((exercise) => (
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
    </div>
  );
}

interface HistoryTabProps {
  onShowDayDetail: (date: string) => void;
}

function HistoryTab({ onShowDayDetail }: HistoryTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-slate-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <h2 className="text-xl font-black">
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </h2>
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
              className={`cal-cell cursor-pointer ${workout ? 'bg-slate-50' : ''} ${!date ? 'text-slate-200' : ''}`}
              onClick={() => workout && onShowDayDetail(workout.date)}
            >
              {date?.getDate()}
              {workout && (
                <>
                  <span className="bg-blue-500 cal-tag">{workout.totalVolume}</span>
                  <span className="bg-black cal-tag">{workout.muscleGroups[0]}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
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
  onClose: () => void;
}

function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const workout = HISTORY_WORKOUTS.find((w) => w.date === date);

  const handleDelete = () => {
    if (confirm('确定要删除这条记录吗？')) {
      onClose();
    }
  };

  if (!workout) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-vibe-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black">{workout.date}</h3>
          <div className="flex gap-2">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="w-8 h-8 flex items-center justify-center text-slate-400">
                <i className="fas fa-edit"></i>
              </button>
            )}
            <button onClick={handleDelete} className="w-8 h-8 flex items-center justify-center text-red-400">
              <i className="fas fa-trash"></i>
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[9px] font-black text-slate-400 uppercase">Total Volume</p>
          {isEditing ? (
            <input type="number" defaultValue={workout.totalVolume} className="text-2xl font-black text-vibe-green bg-transparent border-b border-vibe-green outline-none" />
          ) : (
            <p className="text-2xl font-black text-vibe-green">{workout.totalVolume.toLocaleString()}</p>
          )}
        </div>

        <div className="space-y-3">
          {workout.exercises.map((ex, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
              {isEditing ? (
                <input type="text" defaultValue={ex.name} className="font-bold text-sm bg-transparent border-b border-slate-200 outline-none flex-1" />
              ) : (
                <span className="font-bold text-sm">{ex.name}</span>
              )}
              <span className="text-slate-400 text-sm">{ex.muscleGroup}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {isEditing ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => setIsEditing(false)}>取消</Button>
              <Button className="flex-1" onClick={() => setIsEditing(false)}>完成</Button>
            </>
          ) : (
            <Button className="w-full" onClick={onClose}>关闭</Button>
          )}
        </div>
      </div>
    </div>
  );
}
