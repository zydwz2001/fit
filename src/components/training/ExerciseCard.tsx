import { useState } from 'react';
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
  const libraryMediaUrl = state.exerciseLibrary.find((item) => item.id === exercise.id)?.gifUrl;
  const mediaUrl = libraryMediaUrl ?? exercise.gifUrl;
  const [failedMediaUrl, setFailedMediaUrl] = useState<string>();
  const showMedia = Boolean(mediaUrl && failedMediaUrl !== mediaUrl);

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
        {mediaUrl && showMedia ? (
          <img
            src={mediaUrl}
            alt={exercise.name}
            onError={() => setFailedMediaUrl(mediaUrl)}
            className="w-20 h-20 object-contain rounded mb-2 bg-slate-50"
          />
        ) : (
          <div className="w-20 h-20 bg-slate-100 rounded mb-2 flex items-center justify-center">
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
          {mediaUrl && showMedia ? (
            <img
              src={mediaUrl}
              alt={exercise.name}
              onError={() => setFailedMediaUrl(mediaUrl)}
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
            {!isCardio && !isAssistedBodyweight && (
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
                type="number"
                min="0"
                step="1"
                defaultValue={exercise.durationMinutes ?? ''}
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
          {isAssistedBodyweight && (
            <div className="flex min-w-0 items-center gap-1 px-0.5 text-[9px] font-bold text-slate-400">
              <span className="w-6 flex-shrink-0 text-center">组</span>
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span className="min-w-0 max-w-[60px] flex-1 text-center">辅助重量</span>
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
              useLeftRight={exercise.useLeftRight}
              isCardio={isCardio}
              weightUnit={isAssistedBodyweight ? 'kg' : state.weightUnit}
              weightAriaLabel={isAssistedBodyweight ? '辅助重量（kg）' : '重量'}
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
