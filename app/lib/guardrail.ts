export const MAX_EXCUSE_LEN = 48

const JAILBREAK_MARKERS = [
  'ignore previous instructions',
  'ignore all previous',
  'system prompt',
  'developer mode',
  'dan mode',
  'sudo ',
  'give me the money',
  'please send',
]

export function sanitizeExcuse(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_EXCUSE_LEN)
    .trim()
}

export function sanitizeExcuseList(
  values: readonly string[],
  limit = 64,
): string[] {
  const out: string[] = []
  for (const value of values) {
    if (out.length >= limit) break
    const clean = sanitizeExcuse(typeof value === 'string' ? value : '')
    if (clean && !out.includes(clean)) out.push(clean)
  }
  return out
}

export function messageLooksLikeJailbreak(message: string): boolean {
  const lower = message.toLowerCase()
  return JAILBREAK_MARKERS.some((marker) => lower.includes(marker))
}
