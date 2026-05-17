const SHA_LIKE = /^[0-9a-f]{7,}$/i

export function shortSha(s: string): string {
  return SHA_LIKE.test(s) ? s.slice(0, 7) : s
}
