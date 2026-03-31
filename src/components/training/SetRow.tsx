import type { Set as ExerciseSet } from '@/types';

interface SetRowProps {
  set: ExerciseSet;
  index: number;
  useLeftRight: boolean;
  onUpdate: (updates: Partial<ExerciseSet>) => void;
  onToggleCompleted: () => void;
  onRemove?: () => void;
}

export function SetRow({
  set,
  index,
  useLeftRight,
  onUpdate,
  onToggleCompleted,
  onRemove,
}: SetRowProps) {
  const handleWeightChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) || value === '') {
      onUpdate({ weight: num || 0 });
    }
  };

  const handleLeftWeightChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) || value === '') {
      onUpdate({ leftWeight: num || 0 });
    }
  };

  const handleRightWeightChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) || value === '') {
      onUpdate({ rightWeight: num || 0 });
    }
  };

  const handleRepsChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) || value === '') {
      onUpdate({ reps: num || 0 });
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="w-6 text-[10px] font-black italic text-slate-300 text-center flex-shrink-0">
        {index + 1}
      </span>

      <div className="flex-1 flex items-center gap-1 h-11 bg-slate-50 rounded-xl px-2 min-w-0">
        {useLeftRight ? (
          <>
            <div className="flex-1 flex items-center gap-0.5 min-w-0">
              <input
                type="number"
                inputMode="decimal"
                value={set.leftWeight ?? ''}
                onChange={(e) => handleLeftWeightChange(e.target.value)}
                className="text-[11px] font-bold text-center bg-transparent border-none outline-none w-full"
                placeholder="0"
              />
              <span className="text-[9px] text-slate-400 flex-shrink-0">kg</span>
            </div>
            <div className="flex-1 flex items-center gap-0.5 min-w-0">
              <input
                type="number"
                inputMode="decimal"
                value={set.rightWeight ?? ''}
                onChange={(e) => handleRightWeightChange(e.target.value)}
                className="text-[11px] font-bold text-center bg-transparent border-none outline-none w-full"
                placeholder="0"
              />
              <span className="text-[9px] text-slate-400 flex-shrink-0">kg</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-0.5 min-w-0">
            <input
              type="number"
              inputMode="decimal"
              value={set.weight ?? ''}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="text-[11px] font-bold text-center bg-transparent border-none outline-none w-full text-slate-800"
              placeholder="0"
            />
            <span className="text-[9px] text-slate-400 flex-shrink-0">kg</span>
          </div>
        )}

        <div className="w-12 flex items-center gap-0.5 flex-shrink-0">
          <input
            type="number"
            inputMode="numeric"
            value={set.reps ?? ''}
            onChange={(e) => handleRepsChange(e.target.value)}
            className="text-[11px] font-bold text-center bg-transparent border-none outline-none w-full text-slate-800"
            placeholder="0"
          />
          <span className="text-[9px] text-slate-400 flex-shrink-0">次</span>
        </div>
      </div>

      <button
        onClick={onToggleCompleted}
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
          set.completed
            ? 'bg-vibe-green text-white'
            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
        }`}
      >
        <i className="fas fa-check text-sm"></i>
      </button>

      {onRemove && (
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 flex-shrink-0"
        >
          <i className="fas fa-trash text-[10px]"></i>
        </button>
      )}
    </div>
  );
}
