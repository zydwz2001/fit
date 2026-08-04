import { describe, expect, it } from 'vitest';
import {
  buildSmoothPath,
  formatChartDateLabel,
  normalizeChartData,
} from './ZoomableChart';

describe('formatChartDateLabel', () => {
  it('shows a month for the initial overview within one year', () => {
    expect(formatChartDateLabel('2026-07-20', 'overview')).toBe('7月');
  });

  it('includes the year when the overview spans multiple years', () => {
    expect(formatChartDateLabel('2025-12-31', 'overview', true)).toBe('2025年12月');
  });

  it('shows the day as the chart is enlarged and the full date at close range', () => {
    expect(formatChartDateLabel('2026-07-20', 'detail')).toBe('7月20日');
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
});
