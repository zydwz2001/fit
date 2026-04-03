import type { Exercise, Set as ExerciseSet } from '@/types';
import { SetRow } from './SetRow';
import { useApp } from '@/contexts/AppContext';
import { calculateVolume } from '@/utils/constants';

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onUpdateSet: (setId: string, updates: Partial<ExerciseSet>) => void;
  onToggleSetCompleted: (setId: string) => void;
  onAddSet: () => void;
  onToggleLeftRight: () => void;
  onRemove: () => void;
  onRemoveSet?: (setId: string) => void;
  onShowHistory?: () => void;
  onSelect?: () => void;
  showControls?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  showDragHandle?: boolean;
  onKeyboardShow?: (setId: string, inputType: 'weight' | 'leftWeight' | 'rightWeight' | 'reps', value: string) => void;
  onKeyboardHide?: () => void;
  showKeyboard?: boolean;
  activeInputType?: 'weight' | 'leftWeight' | 'rightWeight' | 'reps' | null;
  activeSetId?: string | null;
}

export function ExerciseCard({
  exercise,
  isSelected = false,
  expanded = true,
  onToggleExpand,
  onUpdateSet,
  onToggleSetCompleted,
  onAddSet,
  onToggleLeftRight,
  onRemove,
  onRemoveSet,
  onShowHistory,
  onSelect,
  showControls = true,
  onDragStart,
  onDragEnd,
  showDragHandle = false,
  onKeyboardShow,
  onKeyboardHide,
  showKeyboard = false,
  activeInputType = null,
  activeSetId = null,
}: ExerciseCardProps) {
  const { state } = useApp();
  const isCardio = exercise.category === 'cardio';

  const volume = !isCardio ? calculateVolume(exercise, state.weightUnit) : 0;

  // 如果是在动作库中使用的卡片
  if (onSelect) {
    return (
      <div
        onClick={onSelect}
        className={`bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center relative h-36 cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-vibe-green' : ''
        }`}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-vibe-green rounded-full flex items-center justify-center">
            <i className="fas fa-check text-white text-xs"></i>
          </div>
        )}
        {exercise.gifUrl ? (
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="w-14 h-14 object-contain rounded mb-2 bg-slate-50"
          />
        ) : (
          <div className="w-14 h-14 bg-slate-100 rounded mb-2 flex items-center justify-center">
            <i className={`fas ${isCardio ? 'fa-heart-pulse' : 'fa-dumbbell'} text-slate-300 text-lg`}></i>
          </div>
        )}
        <p className="text-[11px] font-black text-slate-800 text-center">{exercise.name}</p>
        <p className="text-[9px] text-slate-400 font-bold mt-1">{exercise.muscleGroup}</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-vibe-xl shadow-sm border border-slate-50 mb-4 overflow-hidden ${showDragHandle && onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={!!(showDragHandle && onDragStart)}
      onDragStart={showDragHandle && onDragStart ? onDragStart : undefined}
      onDragEnd={showDragHandle && onDragEnd ? onDragEnd : undefined}
    >
      <div
        className="p-4 flex items-center"
        onClick={!isCardio ? onToggleExpand : undefined}
      >
        <div className="flex items-center gap-3 flex-1">
          {exercise.gifUrl ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className="w-10 h-10 object-contain rounded-xl bg-slate-50"
            />
          ) : (
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
              <i className={`fas ${isCardio ? 'fa-heart-pulse' : 'fa-dumbbell'} text-slate-300`}></i>
            </div>
          )}
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

        {showControls && (
          <div className="flex items-center gap-1">
            {onShowHistory && !isCardio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowHistory();
                }}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
                title="动作历史"
              >
                <i className="fas fa-history text-sm"></i>
              </button>
            )}
            {!isCardio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLeftRight();
                }}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  exercise.useLeftRight ? 'text-vibe-green' : 'text-slate-300 hover:text-slate-500'
                }`}
                title="记录左右"
              >
                <i className="fas fa-left-right text-sm"></i>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
              title="删除动作"
            >
              <i className="fas fa-trash text-sm"></i>
            </button>
          </div>
        )}
      </div>

      {!isCardio && expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
          {exercise.sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              index={index}
              useLeftRight={exercise.useLeftRight}
              isCardio={isCardio}
              prevSet={index > 0 ? exercise.sets[index - 1] : undefined}
              nextSet={index < exercise.sets.length - 1 ? exercise.sets[index + 1] : undefined}
              onUpdate={(updates) => onUpdateSet(set.id, updates)}
              onToggleCompleted={() => onToggleSetCompleted(set.id)}
              onRemove={onRemoveSet ? () => onRemoveSet(set.id) : undefined}
              onKeyboardShow={onKeyboardShow ? (inputType, value) => onKeyboardShow(set.id, inputType, value) : undefined}
              onKeyboardHide={onKeyboardHide}
              showKeyboard={showKeyboard && activeSetId === set.id}
              activeInputType={showKeyboard && activeSetId === set.id ? activeInputType : null}
            />
          ))}

          {!isCardio && (
            <button
              onClick={onAddSet}
              className="mt-2 w-full h-10 border-2 border-dashed border-slate-200 rounded-vibe flex items-center justify-center gap-2 text-slate-400 hover:border-vibe-green hover:text-vibe-green transition-colors"
            >
              <i className="fas fa-plus text-sm"></i>
              <span className="text-xs font-bold">添加组</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
