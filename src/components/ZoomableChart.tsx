import { useState, useRef, useMemo } from 'react';

const BASE_WIDTH = 300;
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const EXACT_DATE_SCALE = 2.5;

interface ZoomableChartProps {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

function evenlySpacedIndexes(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, index) => index);
  return [...new Set(
    Array.from({ length: count }, (_, index) =>
      Math.round((index / (count - 1)) * (length - 1))
    )
  )];
}

export function formatChartDateLabel(
  date: string,
  mode: 'overview' | 'detail' | 'exact',
  spansYears = false
): string {
  const value = parseDate(date);
  const year = value.getFullYear();
  const month = value.getMonth() + 1;
  const day = value.getDate();

  if (mode === 'exact') return date;
  if (mode === 'detail') return `${month}月${day}日`;
  return spansYears ? `${year}年${month}月` : `${month}月`;
}

export function ZoomableChart({
  data,
  color = '#10B981',
  height = 180
}: ZoomableChartProps) {
  const [scale, setScale] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
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
      const newScale = Math.min(
        Math.max(lastScaleRef.current * scaleDelta, MIN_SCALE),
        MAX_SCALE
      );
      setScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) lastDistanceRef.current = 0;
  };

  const chartData = useMemo(() => {
    return [...data].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  }, [data]);

  const geometry = useMemo(() => {
    const width = BASE_WIDTH * scale;
    if (chartData.length === 0) return { width, points: [], path: '' };

    const values = chartData.map(d => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const valuePadding = rawMax === rawMin
      ? Math.max(Math.abs(rawMin) * 0.05, 1)
      : (rawMax - rawMin) * 0.1;
    const minVal = rawMin - valuePadding;
    const maxVal = rawMax + valuePadding;
    const range = maxVal - minVal || 1;
    const times = chartData.map((item) => parseDate(item.date).getTime());
    const firstTime = times[0];
    const lastTime = times[times.length - 1];
    const timeRange = lastTime - firstTime;
    const sidePadding = 12;
    const plotTop = 10;
    const plotBottom = scale >= EXACT_DATE_SCALE ? height - 52 : height - 30;

    const points = chartData.map((d, i) => {
      const x = timeRange === 0
        ? width / 2
        : sidePadding + ((times[i] - firstTime) / timeRange) * (width - sidePadding * 2);
      const y = plotBottom - ((d.value - minVal) / range) * (plotBottom - plotTop);
      return { ...d, x, y };
    });

    if (points.length < 2) return { width, points, path: '' };

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return { width, points, path };
  }, [chartData, height, scale]);

  const labelMode = scale >= EXACT_DATE_SCALE
    ? 'exact'
    : scale >= 1.5
      ? 'detail'
      : 'overview';
  const spansYears = chartData.length > 1 &&
    parseDate(chartData[0].date).getFullYear() !==
      parseDate(chartData[chartData.length - 1].date).getFullYear();
  const tickIndexes = (() => {
    if (labelMode === 'exact') {
      return geometry.points.map((_, index) => index);
    }
    if (labelMode === 'detail') {
      return evenlySpacedIndexes(geometry.points.length, 8);
    }

    const monthIndexes: number[] = [];
    let previousLabel = '';
    geometry.points.forEach((point, index) => {
      const label = formatChartDateLabel(point.date, 'overview', spansYears);
      if (label !== previousLabel) {
        monthIndexes.push(index);
        previousLabel = label;
      }
    });
    return evenlySpacedIndexes(monthIndexes.length, 4).map((index) => monthIndexes[index]);
  })();

  const resetView = () => {
    setScale(MIN_SCALE);
    scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="w-full relative bg-slate-50/50 rounded-2xl overflow-hidden"
      style={{ height }}
    >
      <div
        ref={scrollRef}
        className="w-full h-full px-3 overflow-x-auto overflow-y-hidden no-scrollbar"
        style={{ touchAction: 'pan-x' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          className="h-full max-w-none"
          viewBox={`0 0 ${geometry.width} ${height}`}
          style={{
            width: `${100 * scale}%`,
            minWidth: `${geometry.width}px`,
            transition: 'width 0.1s',
          }}
          aria-label="身体记录趋势图"
        >
          {tickIndexes.map((pointIndex) => {
            const point = geometry.points[pointIndex];
            if (!point) return null;
            const isExact = labelMode === 'exact';
            const isFirst = pointIndex === tickIndexes[0];
            const isLast = pointIndex === tickIndexes[tickIndexes.length - 1];
            const textAnchor = isExact
              ? (isFirst ? 'start' : 'end')
              : (isFirst ? 'start' : isLast ? 'end' : 'middle');
            const transform = isExact
              ? `rotate(-35 ${point.x} ${height - 7})`
              : undefined;

            return (
              <g key={`tick-${point.date}-${pointIndex}`}>
                <line
                  x1={point.x}
                  y1="8"
                  x2={point.x}
                  y2={height - 24}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  opacity="0.55"
                />
                <text
                  x={point.x}
                  y={height - 7}
                  fontSize={isExact ? 8 : 9}
                  fill="#94a3b8"
                  textAnchor={textAnchor}
                  transform={transform}
                  fontWeight="600"
                >
                  {formatChartDateLabel(point.date, labelMode, spansYears)}
                </text>
              </g>
            );
          })}
          {geometry.path && (
            <path
              d={geometry.path}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {geometry.points.map((point, index) => (
            <circle
              key={`${point.date}-${index}`}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="white"
              stroke={color}
              strokeWidth="2"
            >
              <title>{point.date} · {point.value}</title>
            </circle>
          ))}
        </svg>
      </div>
      {scale > MIN_SCALE + 0.01 && (
        <button
          onClick={resetView}
          className="absolute top-2 right-2 px-3 h-7 bg-white/95 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm"
          aria-label="重置图表缩放"
        >
          重置视图
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
