import { API_ORIGIN } from '#/lib/apollo'

const cache = new Map<string, Promise<string>>()

function blobUrl(rev: string, repo: string, path: string): string {
  const params = new URLSearchParams({ rev, repo, path })
  return `${API_ORIGIN}/api/blob?${params.toString()}`
}

export function fetchBlob(rev: string, repo: string, path: string): Promise<string> {
  const url = blobUrl(rev, repo, path)
  const existing = cache.get(url)
  if (existing) return existing
  const promise = fetch(url)
    .then(async (r) => {
      if (!r.ok) {
        cache.delete(url)
        throw new Error(`${r.status} ${await r.text()}`)
      }
      return r.text()
    })
    .catch((err: unknown) => {
      cache.delete(url)
      throw err
    })
  cache.set(url, promise)
  return promise
}
