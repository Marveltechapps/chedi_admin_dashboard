const REF_PATTERN = /^(?:[A-Z0-9]{12}|[A-Z0-9]{16}|[A-Z0-9]{22})$/;

export function normalizeCollectionRef(raw: string) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

export function formatCollectionRef(raw: string) {
  const value = normalizeCollectionRef(raw);
  if (!REF_PATTERN.test(value)) return String(raw || '').trim();
  return value.replace(/(.{4})(?=.)/g, '$1 ');
}

export function describeCollectionRef(raw: string, taken: string[] = []) {
  const value = normalizeCollectionRef(raw);
  if (!value) {
    return {
      ok: false as const,
      tone: 'hint' as const,
      message: 'UPI/IMPS is 12 digits, NEFT is 16 characters, RTGS is 22 characters.',
    };
  }
  if (!REF_PATTERN.test(value)) {
    return {
      ok: false as const,
      tone: 'error' as const,
      message: 'Use a 12, 16, or 22 character UTR. Each one can be used once.',
    };
  }
  const used = new Set(taken.map((item) => normalizeCollectionRef(item)).filter((item) => REF_PATTERN.test(item)));
  if (used.has(value)) {
    return {
      ok: false as const,
      tone: 'error' as const,
      message: 'This UTR is already used.',
    };
  }
  return {
    ok: true as const,
    tone: 'ok' as const,
    message: `Valid ID · ${formatCollectionRef(value)}`,
    value,
  };
}
