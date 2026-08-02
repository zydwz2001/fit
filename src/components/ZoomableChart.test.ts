import { describe, expect, it } from 'vitest';
import { formatChartDateLabel } from './ZoomableChart';

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
