export function normalizeForExactMatch(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ")
}
