import type { BodyPhoto } from '@/types';

export interface BodyPhotoDayGroup {
  date: string;
  dayLabel: string;
  photos: BodyPhoto[];
}

export interface BodyPhotoMonthGroup {
  key: string;
  label: string;
  days: BodyPhotoDayGroup[];
}

function parsePhotoDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function groupBodyPhotosByMonth(photos: BodyPhoto[]): BodyPhotoMonthGroup[] {
  const sortedPhotos = [...photos].sort(
    (a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp
  );
  const monthGroups = new Map<string, BodyPhotoMonthGroup>();
  const dayGroups = new Map<string, BodyPhotoDayGroup>();

  sortedPhotos.forEach((photo) => {
    const parsedDate = parsePhotoDate(photo.date);
    const monthKey = parsedDate
      ? `${parsedDate.year}-${String(parsedDate.month).padStart(2, '0')}`
      : 'unknown';

    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, {
        key: monthKey,
        label: parsedDate ? `${parsedDate.month}月 ${parsedDate.year}` : '日期未设置',
        days: [],
      });
    }

    let dayGroup = dayGroups.get(photo.date);
    if (!dayGroup) {
      dayGroup = {
        date: photo.date,
        dayLabel: parsedDate ? `${parsedDate.day} /` : '— /',
        photos: [],
      };
      dayGroups.set(photo.date, dayGroup);
      monthGroups.get(monthKey)?.days.push(dayGroup);
    }

    dayGroup.photos.push(photo);
  });

  return [...monthGroups.values()];
}
