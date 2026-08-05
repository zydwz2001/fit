import { describe, expect, it } from 'vitest';
import {
  buildSmoothPath,
  filterChartDataByRange,
  formatChartDateLabel,
  getChartWindow,
  normalizeChartData,
  rollingAverageValues,
} from './ZoomableChart';

describe('formatChartDateLabel', () => {
  it('shows a month for the initial overview within one year', () => {
    expect(formatChartDateLabel('2026-07-20', 'overview')).toBe('7月');
  });

  it('uses simple years for a long-range overview', () => {
    expect(formatChartDateLabel('2020-08-05', 'year', true)).toBe('2020年');
  });

  it('includes the year when the overview spans multiple years', () => {
    expect(formatChartDateLabel('2025-12-31', 'overview', true)).toBe('2025年12月');
  });

  it('shows the day as the chart is enlarged and the full date at close range', () => {
    expect(formatChartDateLabel('2026-07-20', 'detail')).toBe('7月20日');
    expect(formatChartDateLabel('2026-07-20', 'detail', true)).toBe('2026年7月');
    expect(formatChartDateLabel('2026-07-20', 'exact')).toBe('2026-07-20');
  });
});

describe('chart geometry', () => {
  it('keeps only the latest value for duplicate dates', () => {
    expect(normalizeChartData([
      { date: '2026-08-02', value: 52 },
      { date: '2026-08-01', value: 51 },
      { date: '2026-08-02', value: 53 },
    ])).toEqual([
      { date: '2026-08-01', value: 51 },
      { date: '2026-08-02', value: 53 },
    ]);
  });

  it('creates one continuous cubic curve without quadratic stair steps', () => {
    const path = buildSmoothPath([
      { x: 0, y: 20 },
      { x: 50, y: 10 },
      { x: 100, y: 30 },
    ]);

    expect(path).toContain(' C ');
    expect(path).not.toContain(' Q ');
    expect(path).not.toContain('NaN');
  });

  it('softens small overview fluctuations without changing the data length', () => {
    const values = rollingAverageValues([50, 54, 51, 55, 52]);

    expect(values).toHaveLength(5);
    expect(values[2]).toBeCloseTo(53.33, 1);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(5);
  });

  it('keeps only the latest three months for the close-up view', () => {
    expect(filterChartDataByRange([
      { date: '2025-12-01', value: 54 },
      { date: '2026-04-01', value: 53.5 },
      { date: '2026-06-01', value: 53 },
      { date: '2026-08-01', value: 52.5 },
    ], '3m')).toEqual([
      { date: '2026-06-01', value: 53 },
      { date: '2026-08-01', value: 52.5 },
    ]);
  });

  it('moves through equal calendar windows', () => {
    expect(getChartWindow('1y', '2026-08-04', 0)).toEqual({
      startDate: '2025-08-04',
      endDate: '2026-08-04',
    });
    expect(getChartWindow('1y', '2026-08-04', 1)).toEqual({
      startDate: '2024-08-04',
      endDate: '2025-08-04',
    });
    expect(getChartWindow('6m', '2026-08-04', 2)).toEqual({
      startDate: '2025-02-04',
      endDate: '2025-08-04',
    });
  });
});
