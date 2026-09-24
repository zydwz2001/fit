import type { BodyMetric } from '@/types';

export const BODY_METRIC_IMPORT_FORMAT = 'my-keep-body-metrics';

// Stable source IDs make repeated imports harmless. Keep local edits to
// previously imported records, and never deduplicate by date or timestamp.
export function mergeBodyMetrics(existing: BodyMetric[], incoming: BodyMetric[]): BodyMetric[] {
  const seen = new Set(existing.map((metric) => metric.id));
  const added = incoming.filter((metric) => {
    if (seen.has(metric.id)) return false;
    seen.add(metric.id);
    return true;
  });
  return [...existing, ...added];
}
