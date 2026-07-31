import { useState, useRef, useMemo } from 'react';

const ONE_YEAR_AGO = Date.now() - 365 * 24 * 60 * 60 * 1000;

interface ZoomableChartProps {
  data: { date: string; value: number }[];
  targetValue?: number;
  color?: string;
  height?: number;
}

export function ZoomableChart({
  data,
  targetValue,
  color = '#10B981',
  height = 160
}: ZoomableChartProps) {
  const [scale, setScale] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastDistanceRef = useRef<number>(0);
  const lastScaleRef = useRef(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDistanceRef.current = distance;
      lastScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDistanceRef.current > 0) {
      if (e.cancelable) e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleDelta = distance / lastDistanceRef.current;
      const newScale = Math.min(Math.max(lastScaleRef.current * scaleDelta, 1), 4);
      setScale(newScale);
    }
  };

  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const filtered = sorted.filter(d => new Date(d.date).getTime() >= ONE_YEAR_AGO);

    if (filtered.length === 0) return [];
    return filtered;
  }, [data]);

  const pathData = useMemo(() => {
    if (chartData.length < 2) return '';

    const width = 300 * scale;
    const values = chartData.map(d => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;

    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * width;
      const y = height - ((d.value - minVal) / range) * (height - 40);
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return path;
  }, [chartData, height, scale]);

  const targetY = useMemo(() => {
    if (!targetValue || chartData.length === 0) return null;
    const values = chartData.map(d => d.value);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const range = maxVal - minVal || 1;
    return height - ((targetValue - minVal) / range) * (height - 40);
  }, [chartData, targetValue, height]);

  return (
    <div
      className="w-full relative bg-slate-50/50 rounded-2xl p-4 overflow-x-auto overflow-y-hidden no-scrollbar"
      style={{ height, touchAction: 'pan-x' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <svg
        ref={svgRef}
        className="h-full max-w-none"
        viewBox={`0 0 ${300 * scale} ${height}`}
        style={{
          width: `${100 * scale}%`,
          minWidth: `${300 * scale}px`,
          transition: 'width 0.1s',
        }}
      >
        {targetY !== null && (
          <line
            x1="0" y1={targetY} x2={300 * scale} y2={targetY}
            stroke={color} strokeWidth="1" strokeDasharray="4,4" opacity="0.4"
          />
        )}
        {pathData && (
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        )}
        {targetValue && targetY !== null && (
          <text x="5" y={targetY - 5} fontSize="10" fill={color} fontWeight="bold">
            目标: {targetValue}
          </text>
        )}
      </svg>
      {scale > 1 && (
        <button
          onClick={() => setScale(1)}
          className="sticky left-full bottom-0 ml-auto px-2 h-6 bg-white/90 rounded text-[10px] font-bold text-slate-500 shadow-sm"
          aria-label="重置图表缩放"
        >
          {scale.toFixed(1)}x · 重置
        </button>
      )}
      {chartData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
          暂无数据
        </div>
      )}
    </div>
  );
}
