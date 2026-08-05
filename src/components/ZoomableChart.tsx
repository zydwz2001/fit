import { useMemo, useRef, useState } from 'react';

const BASE_WIDTH = 300;
const SVG_HEIGHT = 140;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 113;
const SIDE_PADDING = 16;

export type ChartRange = 'all' | '1y' | '6m' | '3m';

const RANGE_MONTHS: Record<Exclude<ChartRange, 'all'>, number> = {
  '1y': 12,
  '6m': 6,
  '3m': 3,
};

interface ZoomableChartProps {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
  unit?: string;
}

interface ChartPoint {
  x: number;
  y: number;
}

interface RenderedPoint extends ChartPoint {
  date: string;
  value: number;
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export function normalizeChartData(
  data: { date: string; value: number }[]
): { date: string; value: number }[] {
  const latestByDate = new Map<string, { date: string; value: number }>();
  data.forEach((item) => {
    if (Number.isFinite(item.value) && Number.isFinite(parseDate(item.date).getTime())) {
      latestByDate.set(item.date, item);
    }
  });
  return [...latestByDate.values()]
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
}

export function buildSmoothPath(points: ChartPoint[]): string {
  if (points.length < 2) return '';

  const segmentSlopes = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const width = next.x - point.x;
    return width > 0 ? (next.y - point.y) / width : 0;
  });
  const tangents = points.map((_, index) => {
    if (index === 0) return segmentSlopes[0];
    if (index === points.length - 1) return segmentSlopes[segmentSlopes.length - 1];

    const previousSlope = segmentSlopes[index - 1];
    const nextSlope = segmentSlopes[index];
    if (previousSlope === 0 || nextSlope === 0 || previousSlope * nextSlope <= 0) {
      return 0;
    }

    const previousWidth = points[index].x - points[index - 1].x;
    const nextWidth = points[index + 1].x - points[index].x;
    const previousWeight = 2 * nextWidth + previousWidth;
    const nextWeight = nextWidth + 2 * previousWidth;
    return (previousWeight + nextWeight) /
      (previousWeight / previousSlope + nextWeight / nextSlope);
  });

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const width = next.x - current.x;
    const firstControlX = current.x + width / 3;
    const firstControlY = current.y + tangents[index] * width / 3;
    const secondControlX = next.x - width / 3;
    const secondControlY = next.y - tangents[index + 1] * width / 3;
    path += ` C ${firstControlX} ${firstControlY}, ${secondControlX} ${secondControlY}, ${next.x} ${next.y}`;
  }
  return path;
}

export function rollingAverageValues(values: number[], radius = 1): number[] {
  if (values.length < 3 || radius < 1) return [...values];

  return values.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length - 1, index + radius);
    const window = values.slice(start, end + 1);
    return window.reduce((sum, value) => sum + value, 0) / window.length;
  });
}

export function formatChartDateLabel(
  date: string,
  mode: 'year' | 'overview' | 'detail' | 'exact',
  spansYears = false
): string {
  const value = parseDate(date);
  const year = value.getFullYear();
  const month = value.getMonth() + 1;
  const day = value.getDate();

  if (mode === 'exact') return date;
  if (mode === 'year') return `${year}年`;
  if (mode === 'detail') {
    return spansYears ? `${year}年${month}月` : `${month}月${day}日`;
  }
  return spansYears ? `${year}年${month}月` : `${month}月`;
}

export function filterChartDataByRange(
  data: { date: string; value: number }[],
  range: ChartRange,
  windowEndDate?: string
): { date: string; value: number }[] {
  const normalized = normalizeChartData(data);
  if (range === 'all' || normalized.length === 0) return normalized;

  const end = parseDate(windowEndDate ?? normalized[normalized.length - 1].date);
  const start = shiftDateByMonths(end, -RANGE_MONTHS[range]);

  return normalized.filter((item) => {
    const date = parseDate(item.date);
    return date > start && date <= end;
  });
}

function shiftDateByMonths(date: Date, months: number): Date {
  const shifted = new Date(date);
  const originalDay = shifted.getDate();
  shifted.setDate(1);
  shifted.setMonth(shifted.getMonth() + months);
  const lastDay = new Date(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    0
  ).getDate();
  shifted.setDate(Math.min(originalDay, lastDay));
  return shifted;
}

function toDateText(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getChartWindow(
  range: Exclude<ChartRange, 'all'>,
  latestDate: string,
  offset = 0
): { startDate: string; endDate: string } {
  const months = RANGE_MONTHS[range];
  const latest = parseDate(latestDate);
  const end = shiftDateByMonths(latest, -months * offset);
  const start = shiftDateByMonths(end, -months);
  return { startDate: toDateText(start), endDate: toDateText(end) };
}

function formatTick(date: Date, range: ChartRange): string {
  if (range === 'all') return String(date.getFullYear());
  if (range === '3m') return `${date.getMonth() + 1}/${date.getDate()}`;
  return `${date.getMonth() + 1}月`;
}

function formatPeriod(firstDate: string, lastDate: string): string {
  const first = parseDate(firstDate);
  const last = parseDate(lastDate);
  return `${first.getFullYear()}.${String(first.getMonth() + 1).padStart(2, '0')} — ${last.getFullYear()}.${String(last.getMonth() + 1).padStart(2, '0')}`;
}

export function ZoomableChart({
  data,
  color = '#10B981',
  height = 220,
  unit = '',
}: ZoomableChartProps) {
  const [range, setRange] = useState<ChartRange>('all');
  const [windowOffset, setWindowOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const swipeStartXRef = useRef<number | null>(null);

  const chartData = useMemo(() => normalizeChartData(data), [data]);
  const latestDate = chartData[chartData.length - 1]?.date;
  const chartWindow = useMemo(() => {
    if (range === 'all' || !latestDate) return null;
    return getChartWindow(range, latestDate, windowOffset);
  }, [latestDate, range, windowOffset]);
  const visibleData = useMemo(
    () => filterChartDataByRange(chartData, range, chartWindow?.endDate),
    [chartData, chartWindow?.endDate, range]
  );

  const timeDomain = useMemo(() => {
    if (chartWindow) {
      return {
        start: parseDate(chartWindow.startDate),
        end: parseDate(chartWindow.endDate),
      };
    }
    if (chartData.length === 0) return null;
    return {
      start: parseDate(chartData[0].date),
      end: parseDate(chartData[chartData.length - 1].date),
    };
  }, [chartData, chartWindow]);

  const geometry = useMemo(() => {
    if (visibleData.length === 0) {
      return {
        points: [] as RenderedPoint[],
        path: '',
        areaPath: '',
        average: 0,
        averageY: 0,
      };
    }

    const values = visibleData.map((item) => item.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const minimumVisualRange = Math.max(Math.abs(average) * 0.08, 2);
    const visualRange = Math.max((rawMax - rawMin) * 1.3, minimumVisualRange);
    const center = (rawMin + rawMax) / 2;
    const minValue = center - visualRange / 2;
    const valueRange = visualRange || 1;
    const times = visibleData.map((item) => parseDate(item.date).getTime());
    const firstTime = timeDomain?.start.getTime() ?? times[0];
    const timeRange = (timeDomain?.end.getTime() ?? times[times.length - 1]) - firstTime;
    const yForValue = (value: number) =>
      PLOT_BOTTOM - ((value - minValue) / valueRange) * (PLOT_BOTTOM - PLOT_TOP);

    const points = visibleData.map((item, index) => ({
      ...item,
      x: timeRange === 0
        ? BASE_WIDTH / 2
        : SIDE_PADDING + ((times[index] - firstTime) / timeRange) * (BASE_WIDTH - SIDE_PADDING * 2),
      y: yForValue(item.value),
    }));

    const smoothingRadius = range === 'all'
      ? Math.max(1, Math.ceil(values.length / 55))
      : range === '1y'
        ? 1
        : 0;
    const renderedValues = rollingAverageValues(values, smoothingRadius);
    const pathPoints = points.map((point, index) => ({
      x: point.x,
      y: yForValue(renderedValues[index]),
    }));
    const path = buildSmoothPath(pathPoints);
    const areaPath = path && pathPoints.length > 1
      ? `${path} L ${pathPoints[pathPoints.length - 1].x} ${PLOT_BOTTOM} L ${pathPoints[0].x} ${PLOT_BOTTOM} Z`
      : '';

    return {
      points,
      path,
      areaPath,
      average,
      averageY: yForValue(average),
    };
  }, [range, timeDomain, visibleData]);

  const axisTicks = useMemo(() => {
    if (!timeDomain) return [];
    const startTime = timeDomain.start.getTime();
    const timeRange = timeDomain.end.getTime() - startTime;
    const count = range === '3m' ? 5 : 6;
    return Array.from({ length: count }, (_, index) => {
      const ratio = index / (count - 1);
      const date = new Date(startTime + timeRange * ratio);
      return {
        x: SIDE_PADDING + ratio * (BASE_WIDTH - SIDE_PADDING * 2),
        label: formatTick(date, range),
      };
    });
  }, [range, timeDomain]);
  const selectedPoint = selectedDate
    ? geometry.points.find((point) => point.date === selectedDate)
    : undefined;
  const showPoints = range === '3m';
  const periodText = timeDomain
    ? formatPeriod(toDateText(timeDomain.start), toDateText(timeDomain.end))
    : '';
  const rangeOptions: { id: ChartRange; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: '1y', label: '1年' },
    { id: '6m', label: '6个月' },
    { id: '3m', label: '3个月' },
  ];

  const selectRange = (nextRange: ChartRange) => {
    setRange(nextRange);
    setWindowOffset(0);
    setSelectedDate(null);
  };

  const canGoOlder = Boolean(
    range !== 'all' &&
    chartWindow &&
    chartData[0] &&
    parseDate(chartData[0].date) < parseDate(chartWindow.startDate)
  );
  const canGoNewer = range !== 'all' && windowOffset > 0;

  const goOlder = () => {
    if (!canGoOlder) return;
    setWindowOffset((current) => current + 1);
    setSelectedDate(null);
  };

  const goNewer = () => {
    if (!canGoNewer) return;
    setWindowOffset((current) => Math.max(0, current - 1));
    setSelectedDate(null);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    swipeStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const startX = swipeStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    swipeStartXRef.current = null;
    if (range === 'all' || startX === null || endX === undefined) return;

    const distance = endX - startX;
    if (Math.abs(distance) < 50) return;
    if (distance > 0) goOlder();
    else goNewer();
  };

  return (
    <div
      className="w-full rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
      style={{ minHeight: height }}
    >
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/90 p-1">
        {rangeOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => selectRange(option.id)}
            className={`h-7 rounded-lg text-[10px] font-bold transition-colors ${
              range === option.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-[28px_1fr_28px] items-center">
        <button
          onClick={goOlder}
          disabled={!canGoOlder}
          className={`grid h-7 w-7 place-items-center rounded-lg text-slate-400 disabled:opacity-20 ${range === 'all' ? 'invisible' : ''}`}
          aria-label="查看上一时间区间"
        >
          <i className="fas fa-chevron-left text-[10px]" />
        </button>
        <span className="text-center text-[10px] font-bold text-slate-400">
          {periodText}
        </span>
        <button
          onClick={goNewer}
          disabled={!canGoNewer}
          className={`grid h-7 w-7 place-items-center rounded-lg text-slate-400 disabled:opacity-20 ${range === 'all' ? 'invisible' : ''}`}
          aria-label="查看下一时间区间"
        >
          <i className="fas fa-chevron-right text-[10px]" />
        </button>
      </div>

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {visibleData.length > 0 ? (
          <>
            <div className="mt-1 flex items-center justify-between px-1 text-[10px] font-semibold text-slate-400">
              <span>
                {selectedPoint
                  ? `${selectedPoint.date} · ${selectedPoint.value.toFixed(1)}${unit ? ` ${unit}` : ''}`
                  : `${visibleData.length} 条记录`}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 border-t border-dashed border-slate-400" />
                平均 {geometry.average.toFixed(1)}{unit ? ` ${unit}` : ''}
              </span>
            </div>

            <svg
              className="mt-1 w-full"
              viewBox={`0 0 ${BASE_WIDTH} ${SVG_HEIGHT}`}
              style={{ height: Math.max(height - 104, 122) }}
              aria-label="身体记录趋势图"
              onClick={() => setSelectedDate(null)}
            >
            <defs>
              <linearGradient id="body-chart-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {geometry.areaPath && <path d={geometry.areaPath} fill="url(#body-chart-area)" />}

            <line
              x1={SIDE_PADDING}
              y1={geometry.averageY}
              x2={BASE_WIDTH - SIDE_PADDING}
              y2={geometry.averageY}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="5 5"
              opacity="0.65"
            />

            {geometry.path && (
              <path
                d={geometry.path}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {selectedPoint && (
              <line
                x1={selectedPoint.x}
                y1={PLOT_TOP}
                x2={selectedPoint.x}
                y2={PLOT_BOTTOM}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="3 4"
                opacity="0.35"
              />
            )}

            {showPoints && geometry.points.map((point) => {
              const selected = point.date === selectedDate;
              return (
                <g
                  key={point.date}
                  role="button"
                  aria-label={`${point.date} ${point.value.toFixed(1)}${unit ? ` ${unit}` : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedDate(point.date);
                  }}
                  className="cursor-pointer"
                >
                  <circle cx={point.x} cy={point.y} r="10" fill="transparent" />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={selected ? 5 : 3}
                    fill={selected ? color : 'white'}
                    stroke={color}
                    strokeWidth="2"
                  />
                  <title>{point.date} · {point.value.toFixed(1)}{unit ? ` ${unit}` : ''}</title>
                </g>
              );
            })}

            {axisTicks.map((tick, index) => {
              const isFirst = index === 0;
              const isLast = index === axisTicks.length - 1;
              return (
                <text
                  key={`tick-${index}-${tick.label}`}
                  x={tick.x}
                  y="136"
                  fontSize="8.5"
                  fill="#94a3b8"
                  textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                  fontWeight="600"
                >
                  {tick.label}
                </text>
              );
            })}
            </svg>

          </>
        ) : (
          <div className="flex min-h-32 items-center justify-center text-sm text-slate-400">
            该区间暂无记录
          </div>
        )}
      </div>
    </div>
  );
}
