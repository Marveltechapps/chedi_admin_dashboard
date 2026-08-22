export function formatDay(iso?: string | null): string {
  if (!iso) return '';
  const value = iso.length <= 10 ? `${iso}T00:00:00Z` : iso;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Next Saturday in UTC (YYYY-MM-DD). If today is Saturday, returns the following one. */
export function nextSaturdayIso(from = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay();
  const add = day === 6 ? 7 : 6 - day;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

export function capitalize(value?: string | null): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
