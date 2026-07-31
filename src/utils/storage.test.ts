import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportData, importData, loadData } from './storage';

function createLocalStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('backup storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorage());
  });

  it('rejects malformed JSON without changing storage', async () => {
    const result = await importData('{not-json');

    expect(result).toEqual({
      success: false,
      message: 'JSON 格式无效，请检查文件内容。',
    });
    expect(localStorage.length).toBe(0);
  });

  it('rejects data that does not match the backup shape', async () => {
    const result = await importData(JSON.stringify({
      dailyWorkout: { id: 'missing-required-fields' },
    }));

    expect(result.success).toBe(false);
    expect(localStorage.length).toBe(0);
  });

  it('rejects malformed items nested inside an otherwise valid collection', async () => {
    const result = await importData(JSON.stringify({
      bodyMetrics: [null],
      workoutHistory: [],
    }));

    expect(result.success).toBe(false);
    expect(localStorage.length).toBe(0);
  });

  it('stores a valid backup and makes it immediately loadable', async () => {
    const backup = {
      dailyWorkout: null,
      workoutHistory: [],
      workoutTemplates: [],
      exerciseLibrary: [],
      weightUnit: 'lbs' as const,
    };
    const result = await importData(JSON.stringify(backup));

    expect(result).toEqual({ success: true, data: backup });
    await expect(loadData()).resolves.toEqual(backup);
  });

  it('exports the supplied in-memory state instead of stale storage', async () => {
    localStorage.setItem('vibe-fitness-data', JSON.stringify({ weightUnit: 'kg' }));

    const exported = await exportData({ weightUnit: 'lbs' });
    expect(JSON.parse(exported)).toEqual({ weightUnit: 'lbs' });
  });
});
