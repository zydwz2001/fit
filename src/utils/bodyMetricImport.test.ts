import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { importData, loadData } from './storage';
import { createInitialState } from './initialState';
import { appReducer } from '@/contexts/AppContext';
import type { BodyMetric } from '@/types';
import { BODY_METRIC_IMPORT_FORMAT } from './bodyMetricImport';

const calf: BodyMetric = { id: 'keep-calf', type: 'calf', value: 36, date: '2025-10-22', timestamp: Date.parse('2025-10-22T13:10:00+08:00') };
const arms: BodyMetric[] = [26, 25.5].map((value, index) => ({
  id: `keep-arm-${index}`, type: 'arm', value, date: '2023-12-24', timestamp: Date.parse('2023-12-24T11:03:00+08:00'),
}));
const envelope = (bodyMetrics: BodyMetric[]) => ({ format: BODY_METRIC_IMPORT_FORMAT, version: 1, mode: 'merge', data: { bodyMetrics } });
const existing = () => ({ ...createInitialState(),
  bodyMetrics: [{ id: 'weight', type: 'weight' as const, value: 51.5, date: '2026-08-19', timestamp: 1787097600000 }],
  notes: [{ id: 'note', title: 'Keep my note', content: 'existing text', folderId: null, createdAt: 1, updatedAt: 1 }],
  metricTargets: [{ type: 'waist' as const, target: 72 }],
});

describe('body measurement file import', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });

  it('adds calves and both same-minute arm values while retaining existing app data', async () => {
    const current = existing();
    const result = await importData(JSON.stringify(envelope([calf, ...arms])), current);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.kind).toBe('body-metrics');
    expect(result.addedCount).toBe(3);
    const next = appReducer(current, { type: 'IMPORT_BODY_METRICS', payload: result.data.bodyMetrics! });
    expect(next).toEqual({ ...current, bodyMetrics: [...current.bodyMetrics, calf, ...arms], bodyUnlocked: false });
    expect(await loadData()).toEqual(next);
  });

  it('reimport does not duplicate records or undo an edit to a previously imported record', async () => {
    const current = { ...existing(), bodyMetrics: [{ ...calf, value: 35 }] };
    const result = await importData(JSON.stringify(envelope([calf])), current);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.addedCount).toBe(0);
      expect(result.data.bodyMetrics).toEqual(current.bodyMetrics);
    }
  });

  it('rejects unsupported versions, invalid dates, duplicate IDs and negative values without writing', async () => {
    const sentinel = JSON.stringify(existing());
    localStorage.setItem('vibe-fitness-data', sentinel);
    for (const packet of [
      { ...envelope([calf]), version: 2 },
      envelope([{ ...calf, date: '2025-02-30' }]),
      envelope([calf, { ...calf, value: 35 }]),
      envelope([{ ...calf, value: -1 }]),
    ]) {
      expect((await importData(JSON.stringify(packet), existing())).success).toBe(false);
      expect(localStorage.getItem('vibe-fitness-data')).toBe(sentinel);
    }
  });

  it('requires current state for a merge and keeps the envelope distinct from a full backup', async () => {
    const packet = envelope([calf]);
    expect('bodyMetrics' in packet).toBe(false);
    expect((await importData(JSON.stringify(packet))).success).toBe(false);
    expect(localStorage.getItem('vibe-fitness-data')).toBeNull();
  });

  it.runIf(Boolean(process.env.MY_KEEP_BODY_IMPORT_FILE))('imports the actual local file without changing any other collection', async () => {
    const content = readFileSync(process.env.MY_KEEP_BODY_IMPORT_FILE!, 'utf8');
    const packet = JSON.parse(content);
    const current = existing();
    const result = await importData(content, current);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.addedCount).toBe(packet.summary.measurementCount);
    const next = appReducer(current, { type: 'IMPORT_BODY_METRICS', payload: result.data.bodyMetrics! });
    expect(next.bodyMetrics).toEqual([...current.bodyMetrics, ...packet.data.bodyMetrics]);
    expect({ ...next, bodyMetrics: [] }).toEqual({ ...current, bodyMetrics: [] });
    expect(await loadData()).toEqual(next);
    const again = await importData(content, next);
    expect(again.success && again.addedCount).toBe(0);
  });
});
