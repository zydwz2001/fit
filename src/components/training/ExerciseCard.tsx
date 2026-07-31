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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUpdateCardio?: (
    updates: Partial<Pick<Exercise, 'durationMinutes' | 'distanceKm' | 'intensity'>>
  ) => void;
  onKeyboardShow?: (setId: string, inputType: 'weight' | 'leftWeight' | 'rightWeight' | 'reps', value: string) => void;
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
  onMoveUp,
  onMoveDown,
  onUpdateCardio,
  onKeyboardShow,
  showKeyboard = false,
  activeInputType = null,
  activeSetId = null,
}: ExerciseCardProps) {
  const { state } = useApp();
  const isCardio = exercise.category === 'cardio';

  const volume = !isCardio ? calculateVolume(exercise, state.weightUnit) : 0;

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
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 overflow-hidden ${showDragHandle && onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={!!(showDragHandle && onDragStart)}
      onDragStart={showDragHandle && onDragStart ? onDragStart : undefined}
      onDragEnd={showDragHandle && onDragEnd ? onDragEnd : undefined}
    >
      <div
        className="p-3 flex items-center"
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
            <h3 className="font-bold text-slate-800 text-base">{exercise.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-500">{exercise.muscleGroup}</p>
              {volume > 0 && (
                <p className="text-xs font-bold text-vibe-green">{volume.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-1">
            {showDragHandle && (
              <div className="flex sm:hidden">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveUp?.();
                  }}
                  disabled={!onMoveUp}
                  className="w-7 h-8 flex items-center justify-center text-slate-300 disabled:opacity-25"
                  title="上移动作"
                  aria-label="上移动作"
                >
                  <i className="fas fa-arrow-up text-xs"></i>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onMoveDown?.();
                  }}
                  disabled={!onMoveDown}
                  className="w-7 h-8 flex items-center justify-center text-slate-300 disabled:opacity-25"
                  title="下移动作"
                  aria-label="下移动作"
                >
                  <i className="fas fa-arrow-down text-xs"></i>
                </button>
              </div>
            )}
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

      {isCardio && onUpdateCardio && (
        <div className="px-3 pb-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
          {[
            { key: 'durationMinutes' as const, label: '时长', unit: '分钟', step: '1', max: undefined },
            { key: 'distanceKm' as const, label: '距离', unit: 'km', step: '0.1', max: undefined },
            { key: 'intensity' as const, label: '强度', unit: '/10', step: '1', max: 10 },
          ].map((field) => (
            <label key={field.key} className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 block mb-1">{field.label}</span>
              <div className="h-10 bg-slate-50 rounded-vibe px-2 flex items-center gap-1">
                <input
                  key={`${exercise.id}-${field.key}-${exercise[field.key] ?? ''}`}
                  type="number"
                  min="0"
                  max={field.max}
                  step={field.step}
                  defaultValue={exercise[field.key] ?? ''}
                  onBlur={(event) => {
                    const parsed = Number.parseFloat(event.currentTarget.value);
                    const value = Number.isFinite(parsed) && parsed > 0
                      ? Math.min(field.max ?? parsed, parsed)
                      : undefined;
                    onUpdateCardio({ [field.key]: value });
                  }}
                  inputMode="decimal"
                  className="w-full min-w-0 bg-transparent text-sm font-bold outline-none"
                />
                <span className="text-xs text-slate-500 flex-shrink-0">{field.unit}</span>
              </div>
            </label>
          ))}
        </div>
      )}

      {!isCardio && expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-3">
          {exercise.sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              index={index}
              useLeftRight={exercise.useLeftRight}
              isCardio={isCardio}
              weightUnit={state.weightUnit}
              prevSet={index > 0 ? exercise.sets[index - 1] : undefined}
              nextSet={index < exercise.sets.length - 1 ? exercise.sets[index + 1] : undefined}
              onUpdate={(updates) => onUpdateSet(set.id, updates)}
              onToggleCompleted={() => onToggleSetCompleted(set.id)}
              onRemove={onRemoveSet ? () => onRemoveSet(set.id) : undefined}
              onKeyboardShow={onKeyboardShow ? (inputType, value) => onKeyboardShow(set.id, inputType, value) : undefined}
              showKeyboard={showKeyboard && activeSetId === set.id}
              activeInputType={showKeyboard && activeSetId === set.id ? activeInputType : null}
            />
          ))}

          {!isCardio && (
            <button
              onClick={onAddSet}
              className="mt-2 w-full h-10 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:border-vibe-green hover:text-vibe-green transition-colors"
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
