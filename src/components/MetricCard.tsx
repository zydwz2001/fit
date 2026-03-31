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
  return (
    <div
      className={`metric-card ${active ? 'active' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <p className="text-[9px] font-black text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-black italic">
        {value}
        {unit && <span className="text-sm">{unit}</span>}
      </p>
      {(target !== undefined || showTargetInput) && (
        <div className="mt-2 flex items-center gap-1 border-t pt-2">
          {showTargetInput ? (
            <>
              <span className="text-[8px] font-bold text-slate-300">目标:</span>
              <input
                type="text"
                value={target}
                onChange={(e) => onTargetChange?.(e.target.value)}
                className="w-full text-[8px] font-black text-vibe-green bg-transparent outline-none"
              />
            </>
          ) : target ? (
            <>
              <span className="text-[8px] font-bold text-slate-300">目标:</span>
              <span className="text-[8px] font-black text-vibe-green">{target}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
