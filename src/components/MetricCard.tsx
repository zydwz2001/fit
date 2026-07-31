import { useState } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  target?: string;
  active?: boolean;
  onClick?: () => void;
  showTargetInput?: boolean;
  onTargetChange?: (value: string) => void;
}

export function MetricCard({
  label,
  value,
  unit,
  target,
  active = false,
  onClick,
  showTargetInput = false,
  onTargetChange,
}: MetricCardProps) {
  const [targetDraft, setTargetDraft] = useState(target ?? '');

  const commitTarget = () => {
    const parsed = Number.parseFloat(targetDraft);
    if (Number.isFinite(parsed) && parsed > 0) {
      onTargetChange?.(targetDraft);
    } else {
      setTargetDraft(target ?? '');
    }
  };

  return (
    <div
      className={`metric-card ${active ? 'active' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold">
        {value}
        {unit && <span className="text-sm">{unit}</span>}
      </p>
      {(target !== undefined || showTargetInput) && (
        <div className="mt-2 flex items-center gap-1 border-t pt-2">
          {showTargetInput ? (
            <>
              <span className="text-xs font-semibold text-slate-400">目标</span>
              <input
                type="text"
                value={targetDraft}
                onClick={(event) => event.stopPropagation()}
                onChange={(e) => setTargetDraft(e.target.value)}
                onBlur={commitTarget}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
                inputMode="decimal"
                aria-label={`${label}目标值`}
                className="w-full text-xs font-bold text-vibe-green bg-transparent outline-none"
              />
            </>
          ) : target ? (
            <>
              <span className="text-xs font-semibold text-slate-400">目标</span>
              <span className="text-xs font-bold text-vibe-green">{target}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
