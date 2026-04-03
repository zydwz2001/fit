import type { Set as ExerciseSet } from '@/types';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  useLeftRight: boolean;
  isCardio?: boolean;
  prevSet?: ExerciseSet;
  nextSet?: ExerciseSet;
  onUpdate: (updates: Partial<ExerciseSet>) => void;
  onToggleCompleted: () => void;
  onRemove?: () => void;
  onKeyboardShow?: (inputType: 'weight' | 'leftWeight' | 'rightWeight' | 'reps', value: string) => void;
  onKeyboardHide?: () => void;
  showKeyboard?: boolean;
  activeInputType?: 'weight' | 'leftWeight' | 'rightWeight' | 'reps' | null;
}

export function SetRow({
  set,
  index,
  useLeftRight,
  isCardio = false,
  onUpdate: _onUpdate,
  onToggleCompleted,
  onRemove,
  onKeyboardShow,
  onKeyboardHide: _onKeyboardHide,
  showKeyboard = false,
  activeInputType,
}: SetRowProps) {
  const getFontSize = (value: number | string | undefined) => {
    const len = (value ?? '').toString().length;
    return len > 4 ? '10px' : '11px';
  };

  const getInputValue = (type: 'weight' | 'leftWeight' | 'rightWeight' | 'reps') => {
    switch (type) {
      case 'weight':
        return set.weight?.toString() || '';
      case 'leftWeight':
        return set.leftWeight?.toString() || '';
      case 'rightWeight':
        return set.rightWeight?.toString() || '';
      case 'reps':
        return set.reps?.toString() || '';
    }
  };

  const handleFocus = (type: 'weight' | 'leftWeight' | 'rightWeight' | 'reps', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onKeyboardShow) return;
    const value = getInputValue(type);
    onKeyboardShow(type, value);
  };

  const isInputActive = (type: 'weight' | 'leftWeight' | 'rightWeight' | 'reps') => {
    return showKeyboard && activeInputType === type;
  };

  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className="w-6 text-[10px] font-black italic text-slate-300 text-center flex-shrink-0">
        {index + 1}
      </span>

      {!isCardio ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {useLeftRight ? (
            <>
              <div className="flex items-center gap-0.5 flex-1 min-w-0">
                <div className={`flex-1 h-10 bg-slate-50 rounded-vibe px-0.5 flex items-center min-w-0 ${isInputActive('leftWeight') ? 'ring-2 ring-vibe-green' : ''}`}>
                  <input
                    type="text"
                    value={set.leftWeight ?? ''}
                    onClick={(e) => handleFocus('leftWeight', e)}
                    readOnly
                    className="text-xs font-bold text-center bg-transparent border-none outline-none w-full text-slate-800 cursor-pointer"
                    placeholder="0"
                    style={{ fontSize: getFontSize(set.leftWeight) }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 flex-shrink-0">kg</span>
              </div>
              <div className="flex items-center gap-0.5 flex-1 min-w-0">
                <div className={`flex-1 h-10 bg-slate-50 rounded-vibe px-0.5 flex items-center min-w-0 ${isInputActive('rightWeight') ? 'ring-2 ring-vibe-green' : ''}`}>
                  <input
                    type="text"
                    value={set.rightWeight ?? ''}
                    onClick={(e) => handleFocus('rightWeight', e)}
                    readOnly
                    className="text-xs font-bold text-center bg-transparent border-none outline-none w-full text-slate-800 cursor-pointer"
                    placeholder="0"
                    style={{ fontSize: getFontSize(set.rightWeight) }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 flex-shrink-0">kg</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-0.5 flex-1 min-w-0 max-w-[60px]">
              <div className={`flex-1 h-10 bg-slate-50 rounded-vibe px-0.5 flex items-center min-w-0 ${isInputActive('weight') ? 'ring-2 ring-vibe-green' : ''}`}>
                <input
                  type="text"
                  value={set.weight ?? ''}
                  onClick={(e) => handleFocus('weight', e)}
                  readOnly
                  className="text-xs font-bold text-center bg-transparent border-none outline-none w-full text-slate-800 cursor-pointer"
                  placeholder="0"
                  style={{ fontSize: getFontSize(set.weight) }}
                />
              </div>
              <span className="text-[9px] text-slate-400 flex-shrink-0">kg</span>
            </div>
          )}

          <div className="flex items-center gap-0.5 flex-1 min-w-0 max-w-[60px]">
            <div className={`flex-1 h-10 bg-slate-50 rounded-vibe px-0.5 flex items-center min-w-0 ${isInputActive('reps') ? 'ring-2 ring-vibe-green' : ''}`}>
              <input
                type="text"
                value={set.reps ?? ''}
                onClick={(e) => handleFocus('reps', e)}
                readOnly
                className="text-xs font-bold text-center bg-transparent border-none outline-none w-full text-slate-800 cursor-pointer"
                placeholder="0"
                style={{ fontSize: getFontSize(set.reps) }}
              />
            </div>
            <span className="text-[9px] text-slate-400 flex-shrink-0">次</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 h-10 bg-slate-50 rounded-vibe px-3 flex items-center">
          <span className="text-[11px] text-slate-500">有氧训练</span>
        </div>
      )}

      <button
        onClick={onToggleCompleted}
        className={`w-7 h-7 rounded-vibe flex items-center justify-center flex-shrink-0 transition-all ${
          set.completed
            ? 'bg-vibe-green text-white'
            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
        }`}
      >
        <i className="fas fa-check text-xs"></i>
      </button>

      {onRemove && (
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 flex-shrink-0"
        >
          <i className="fas fa-trash text-[9px]"></i>
        </button>
      )}
    </div>
  );
}
