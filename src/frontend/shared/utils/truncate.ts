export function truncate(text: string | null | undefined, max = 50, suffix = '…'): string {
  if (text === null || text === undefined) return '';
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - suffix.length)) + suffix;
}
