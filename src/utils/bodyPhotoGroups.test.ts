import { describe, expect, it } from 'vitest';
import type { BodyPhoto } from '@/types';
import { groupBodyPhotosByMonth } from './bodyPhotoGroups';

const photo = (id: string, date: string, timestamp: number): BodyPhoto => ({
  id,
  date,
  timestamp,
  uri: `data:image/jpeg;base64,${id}`,
});

describe('groupBodyPhotosByMonth', () => {
  it('groups photos by month and day in newest-first order', () => {
    const groups = groupBodyPhotosByMonth([
      photo('feb', '2023-02-13', 1),
      photo('july-a', '2025-07-12', 2),
      photo('dec', '2023-12-10', 3),
      photo('july-b', '2025-07-12', 4),
    ]);

    expect(groups.map((group) => group.label)).toEqual(['7月 2025', '12月 2023', '2月 2023']);
    expect(groups[0].days[0].dayLabel).toBe('12 /');
    expect(groups[0].days[0].photos.map((item) => item.id)).toEqual(['july-b', 'july-a']);
  });

  it('keeps different days in the same month under one heading', () => {
    const groups = groupBodyPhotosByMonth([
      photo('early', '2025-07-03', 1),
      photo('late', '2025-07-20', 2),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].days.map((day) => day.dayLabel)).toEqual(['20 /', '3 /']);
  });
});
