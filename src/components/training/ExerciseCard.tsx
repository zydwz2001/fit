import type { Exercise, Set as ExerciseSet } from '@/types';
import { SetRow } from './SetRow';
import { ExerciseImage } from './ExerciseImage';
import { useApp } from '@/contexts/AppContext';

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
  selectionDisabled?: boolean;
  onToggleHidden?: () => void;
  showControls?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  showDragHandle?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onUpdateCardio?: (
    updates: Partial<Pick<Exercise, 'durationMinutes'>>
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
  selectionDisabled = false,
  onToggleHidden,
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
  const isAssistedBodyweight = exercise.volumeMode === 'assisted-bodyweight';
  const isRepsOnly = exercise.recordingMode === 'reps-only';
  const isAdditionalWeight = exercise.recordingMode === 'additional-weight';

  if (onSelect) {
    return (
      <div
        onClick={selectionDisabled ? undefined : onSelect}
        className={`bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center relative min-h-[160px] cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-vibe-green' : ''
        }`}
      >
        {onToggleHidden && (
          <button type="button" onClick={(event) => { event.stopPropagation(); onToggleHidden(); }}
            aria-label={`${exercise.hidden ? '恢复' : '隐藏'}${exercise.name}`}
            className="absolute left-1 top-1 z-10 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
            <i aria-hidden="true" className={`fas ${exercise.hidden ? 'fa-eye' : 'fa-eye-slash'} mr-1`}></i>
            {exercise.hidden ? '恢复' : '隐藏'}
          </button>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-vibe-green rounded-full flex items-center justify-center">
            <i className="fas fa-check text-white text-xs"></i>
          </div>
        )}
        <ExerciseImage exercise={exercise} className="h-20 w-20 mb-2" />
        <p className="text-[11px] font-black text-slate-800 text-center">{exercise.name}</p>
      </div>
    );
  }

  return (
    <div
      className={`training-exercise-card bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 overflow-hidden ${showDragHandle && onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={!!(showDragHandle && onDragStart)}
      onDragStart={showDragHandle && onDragStart ? onDragStart : undefined}
      onDragEnd={showDragHandle && onDragEnd ? onDragEnd : undefined}
    >
      <div
        className="p-3 flex items-center"
        onClick={!isCardio ? onToggleExpand : undefined}
      >
        <div className="flex items-center gap-3 flex-1">
          <ExerciseImage exercise={exercise} />
          <div>
            <h3 className="font-bold text-slate-800 text-base">{exercise.name}</h3>
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
            {!isCardio && !isAssistedBodyweight && !exercise.recordingMode && (
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
        <div className="border-t border-slate-100 px-3 pb-3 pt-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">时长</span>
            <div className="flex h-11 items-center gap-2 rounded-vibe bg-slate-50 px-3">
              <input
                key={`${exercise.id}-duration-${exercise.durationMinutes ?? ''}`}
                type="text"
                defaultValue={exercise.durationMinutes ?? ''}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => {
                  const parsed = Number.parseFloat(event.currentTarget.value);
                  onUpdateCardio({
                    durationMinutes: Number.isFinite(parsed) && parsed > 0
                      ? Math.round(parsed)
                      : undefined,
                  });
                }}
                inputMode="numeric"
                placeholder="0"
                aria-label={`${exercise.name}时长`}
                className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none"
              />
              <span className="flex-shrink-0 text-sm font-semibold text-slate-500">分钟</span>
            </div>
          </label>
        </div>
      )}

      {!isCardio && expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-3">
          {(isAssistedBodyweight || isAdditionalWeight) && (
            <div className="flex min-w-0 items-center gap-1 px-0.5 text-[9px] font-bold text-slate-400">
              <span className="w-6 flex-shrink-0 text-center">组</span>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span className="min-w-0 max-w-[60px] flex-1 text-center">{isAssistedBodyweight ? '辅助重量' : '附加重量'}</span>
                <span className="min-w-0 max-w-[60px] flex-1 text-center">次数</span>
              </div>
              <span className="w-7 flex-shrink-0"></span>
              <span className="w-6 flex-shrink-0"></span>
            </div>
          )}

          {exercise.sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              index={index}
              useLeftRight={set.weightUnit !== undefined ? set.leftWeight !== undefined || set.rightWeight !== undefined : exercise.useLeftRight}
              isCardio={isCardio}
              hideWeight={isRepsOnly || set.weightMode === 'not_displayed'}
              weightUnit={set.weightUnit === null ? '单位未记' : set.weightUnit ?? (isAssistedBodyweight ? 'kg' : state.weightUnit)}
              weightAriaLabel={isAssistedBodyweight ? '辅助重量' : isAdditionalWeight ? '附加重量' : '重量'}
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

          {exercise.notes?.map((note, index) => <p key={index} className="text-xs text-slate-500 whitespace-pre-wrap">{note}</p>)}

          {!isCardio && (
            <button
              onClick={onAddSet}
              className="training-add-set mt-2 w-full h-10 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-600 hover:border-vibe-green hover:text-vibe-green transition-colors"
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
