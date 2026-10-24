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

export function isSaturdayIso(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return new Date(`${iso}T00:00:00.000Z`).getUTCDay() === 6;
}

/** The next Saturdays, starting with the coming one (or the following one if today is Saturday). */
export function upcomingSaturdayIsos(count = 6, from = new Date()): { iso: string; label: string }[] {
  const start = nextSaturdayIso(from);
  const [year, month, day] = start.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 1, day));
  const out: { iso: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const dt = new Date(first);
    dt.setUTCDate(first.getUTCDate() + i * 7);
    const iso = dt.toISOString().slice(0, 10);
    out.push({
      iso,
      label: dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
    });
  }
  return out;
}

export function capitalize(value?: string | null): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
