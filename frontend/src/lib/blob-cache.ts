import { getApiOrigin, isTauri } from '#/lib/apollo'

const cache = new Map<string, Promise<string>>()

function cacheKey(rev: string, repo: string, path: string): string {
  return `${rev}|${repo}|${path}`
}

async function loadBlob(rev: string, repo: string, path: string): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<string>('blob', { rev, repo, path })
  }
  const params = new URLSearchParams({ rev, repo, path })
  const url = `${getApiOrigin()}/api/blob?${params.toString()}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.text()
}

export function fetchBlob(rev: string, repo: string, path: string): Promise<string> {
  const key = cacheKey(rev, repo, path)
  const existing = cache.get(key)
  if (existing) return existing
  const promise = loadBlob(rev, repo, path).catch((err: unknown) => {
    cache.delete(key)
    throw err
  })
  cache.set(key, promise)
  return promise
}
