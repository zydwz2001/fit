import { useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

interface CustomKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onFillUp?: () => void;
  onFillDown?: () => void;
  hasFillUp?: boolean;
  hasFillDown?: boolean;
}

export function CustomKeyboard({
  value,
  onChange,
  onFillUp,
  onFillDown,
  hasFillUp = false,
  hasFillDown = false,
}: CustomKeyboardProps) {
  const { state, dispatch } = useApp();
  const longPressTimer = useRef<number | null>(null);

  const handleNumberPress = (num: string) => {
    if (value.length >= 6) return;
    onChange(value + num);
  };

  const handleDecimalPress = () => {
    if (value.includes('.')) return;
    onChange(value === '' ? '0.' : value + '.');
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const handleBackspaceMouseDown = () => {
    handleBackspace();
    longPressTimer.current = setTimeout(() => {
      handleClear();
    }, 500);
  };

  const handleBackspaceMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleBackspaceMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const toggleWeightUnit = () => {
    dispatch({
      type: 'SET_WEIGHT_UNIT',
      payload: state.weightUnit === 'kg' ? 'lbs' : 'kg',
    });
  };

  return (
    <div className="bg-slate-100 p-3 rounded-t-3xl border-t border-slate-200">
      <div className="grid grid-cols-4 gap-2 mb-2">
        <button
          onClick={onFillDown}
          disabled={!hasFillDown}
          className={`h-12 rounded-xl flex flex-col items-center justify-center transition-colors ${
            hasFillDown
              ? 'bg-white shadow-sm text-vibe-green hover:bg-slate-50'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <i className="fas fa-arrow-down text-lg"></i>
          <span className="text-[9px] font-bold mt-0.5">向下填充</span>
        </button>

        <button
          onClick={onFillUp}
          disabled={!hasFillUp}
          className={`h-12 rounded-xl flex flex-col items-center justify-center transition-colors ${
            hasFillUp
              ? 'bg-white shadow-sm text-vibe-green hover:bg-slate-50'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <i className="fas fa-arrow-up text-lg"></i>
          <span className="text-[9px] font-bold mt-0.5">向上填充</span>
        </button>

        <button
          onClick={toggleWeightUnit}
          className="h-12 bg-white shadow-sm rounded-xl flex flex-col items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-black text-slate-800">
            {state.weightUnit.toUpperCase()}
          </span>
          <span className="text-[9px] font-bold text-slate-400">切换</span>
        </button>

        <button
          onClick={handleBackspace}
          onMouseDown={handleBackspaceMouseDown}
          onMouseUp={handleBackspaceMouseUp}
          onMouseLeave={handleBackspaceMouseLeave}
          onTouchStart={handleBackspaceMouseDown}
          onTouchEnd={handleBackspaceMouseUp}
          className="h-12 bg-white shadow-sm rounded-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <i className="fas fa-delete-left text-slate-600 text-lg"></i>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {[1, 2, 3].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberPress(num.toString())}
            className="h-14 bg-white shadow-sm rounded-xl flex items-center justify-center text-2xl font-black text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
          >
            {num}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {[4, 5, 6].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberPress(num.toString())}
            className="h-14 bg-white shadow-sm rounded-xl flex items-center justify-center text-2xl font-black text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
          >
            {num}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberPress(num.toString())}
            className="h-14 bg-white shadow-sm rounded-xl flex items-center justify-center text-2xl font-black text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
          >
            {num}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          onClick={handleDecimalPress}
          className="h-14 bg-white shadow-sm rounded-xl flex items-center justify-center text-2xl font-black text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
        >
          .
        </button>
        <button
          onClick={() => handleNumberPress('0')}
          className="h-14 bg-white shadow-sm rounded-xl flex items-center justify-center text-2xl font-black text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={handleClear}
          className="h-14 bg-slate-200 shadow-sm rounded-xl flex items-center justify-center text-sm font-black text-slate-500 hover:bg-slate-300 active:scale-95 transition-all"
        >
          清空
        </button>
      </div>
    </div>
  );
}
