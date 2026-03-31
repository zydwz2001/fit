import type { Exercise, Set as ExerciseSet } from '@/types';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected?: boolean;
  onUpdateSet: (setId: string, updates: Partial<ExerciseSet>) => void;
  onToggleSetCompleted: (setId: string) => void;
  onAddSet: () => void;
  onToggleLeftRight: () => void;
  onRemove: () => void;
  onRemoveSet?: (setId: string) => void;
  onShowHistory?: () => void;
  onSelect?: () => void;
}

export function ExerciseCard({
  exercise,
  isSelected = false,
  onUpdateSet,
  onToggleSetCompleted,
  onAddSet,
  onToggleLeftRight,
  onRemove,
  onRemoveSet,
  onShowHistory,
  onSelect,
}: ExerciseCardProps) {
  const volume = exercise.sets
    .filter(s => s.completed)
    .reduce((sum, s) => {
      if (exercise.useLeftRight) {
        return sum + ((s.leftWeight || 0) + (s.rightWeight || 0)) * s.reps;
      }
      return sum + s.weight * s.reps;
    }, 0);

  // 如果是在动作库中使用的卡片
  if (onSelect) {
    return (
      <div
        onClick={onSelect}
        className={`bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center relative h-32 cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-vibe-green' : ''
        }`}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-vibe-green rounded-full flex items-center justify-center">
            <i className="fas fa-check text-white text-xs"></i>
          </div>
        )}
        <div className="w-12 h-12 bg-slate-100 rounded mb-2 flex items-center justify-center">
          <i className="fas fa-dumbbell text-slate-300"></i>
        </div>
        <p className="text-[11px] font-black text-slate-800">{exercise.name}</p>
        <p className="text-[9px] text-slate-400 font-bold mt-1">{exercise.muscleGroup}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-vibe-xl p-5 shadow-sm border border-slate-50 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
            <i className="fas fa-dumbbell text-slate-300"></i>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm">{exercise.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-slate-400">{exercise.muscleGroup}</p>
              {volume > 0 && (
                <p className="text-[10px] font-bold text-vibe-green">{volume.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onShowHistory && (
            <button
              onClick={onShowHistory}
              className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
              title="动作历史"
            >
              <i className="fas fa-history text-sm"></i>
            </button>
          )}
          <button
            onClick={onToggleLeftRight}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              exercise.useLeftRight ? 'text-vibe-green' : 'text-slate-300 hover:text-slate-500'
            }`}
            title="记录左右"
          >
            <i className="fas fa-left-right text-sm"></i>
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
            title="删除动作"
          >
            <i className="fas fa-trash text-sm"></i>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            index={index}
            useLeftRight={exercise.useLeftRight}
            onUpdate={(updates) => onUpdateSet(set.id, updates)}
            onToggleCompleted={() => onToggleSetCompleted(set.id)}
            onRemove={onRemoveSet ? () => onRemoveSet(set.id) : undefined}
          />
        ))}
      </div>

      <button
        onClick={onAddSet}
        className="mt-4 w-full h-10 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-vibe-green hover:text-vibe-green transition-colors"
      >
        <i className="fas fa-plus text-sm"></i>
        <span className="text-xs font-bold">添加组</span>
      </button>
    </div>
  );
}
