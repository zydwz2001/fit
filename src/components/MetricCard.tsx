interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  active?: boolean;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  unit,
  active = false,
  onClick,
}: MetricCardProps) {
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
    </div>
  );
}
