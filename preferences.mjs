export const emptyUsage = () => ({ counts: {} });

export function preferenceKey(item) {
  const name = String(item?.name || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '');
  return `${item?.chain || 'unknown'}:${name}`;
}

export function sanitizeUsage(value) {
  const usage = emptyUsage();
  if (!value || typeof value !== 'object' || !value.counts || typeof value.counts !== 'object') {
    return usage;
  }

  for (const [key, count] of Object.entries(value.counts)) {
    if (Number.isSafeInteger(count) && count > 0) usage.counts[key] = count;
  }
  return usage;
}

export function usageCount(usage, item) {
  return usage?.counts?.[preferenceKey(item)] || 0;
}

export function changeUsage(usage, item, delta) {
  const key = preferenceKey(item);
  const next = Math.max(0, usageCount(usage, item) + delta);
  if (next === 0) delete usage.counts[key];
  else usage.counts[key] = next;
  return next;
}

export function compareUsage(usage, a, b) {
  return usageCount(usage, b) - usageCount(usage, a);
}
