import { useEffect, useRef, useState } from 'react'
import { getApiOrigin, isTauri } from '#/lib/apollo'

export interface DiffState {
  patch: string
  loading: boolean
  error: Error | null
}

async function fetchDiff(
  rev: string,
  repo: string,
  path?: string,
  w?: boolean,
): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke<string>('diff', {
      rev,
      repo,
      path: path ?? null,
      w: w ?? false,
    })
  }
  const params = new URLSearchParams({ rev, repo })
  if (path) params.set('path', path)
  if (w) params.set('w', '1')
  const url = `${getApiOrigin()}/api/diff?${params.toString()}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.text()
}

export function useDiff(
  rev: string,
  repo: string,
  refreshKey: number = 0,
  path?: string,
  initial?: string,
  w?: boolean,
): DiffState {
  const [state, setState] = useState<DiffState>(() =>
    initial !== undefined
      ? { patch: initial, loading: false, error: null }
      : { patch: '', loading: true, error: null },
  )
  const skipNextFetch = useRef(initial !== undefined && refreshKey === 0)

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchDiff(rev, repo, path, w)
      .then((text) => {
        if (cancelled) return
        setState({ patch: text, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          patch: '',
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        })
      })
    return () => {
      cancelled = true
    }
  }, [rev, repo, refreshKey, path, w])

  return state
}
