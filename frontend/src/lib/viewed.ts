import { useEffect, useState } from 'react'

export interface ViewedState {
  viewed: Set<string>
  isViewed: (path: string) => boolean
  toggle: (path: string) => void
}

export function useViewed(rev: string): ViewedState {
  const key = `rust-sa:viewed:${rev}`
  const [viewed, setViewed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify([...viewed]))
  }, [key, viewed])

  return {
    viewed,
    isViewed: (path) => viewed.has(path),
    toggle: (path) =>
      setViewed((prev) => {
        const next = new Set(prev)
        if (next.has(path)) next.delete(path)
        else next.add(path)
        return next
      }),
  }
}
