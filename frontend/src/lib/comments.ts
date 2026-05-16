import { useEffect, useState } from 'react'

export type Side = 'deletions' | 'additions'

export interface Comment {
  id: string
  path: string
  side: Side
  lineNumber: number
  author: string
  body: string
  createdAt: string
}

export interface CommentsState {
  comments: Comment[]
  add: (input: Omit<Comment, 'id' | 'createdAt'>) => Comment
  remove: (id: string) => void
}

export function useComments(rev: string): CommentsState {
  const key = `rust-sa:comments:${rev}`
  const [comments, setComments] = useState<Comment[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as Comment[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(comments))
  }, [key, comments])

  return {
    comments,
    add: (input) => {
      const next: Comment = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      setComments((prev) => [...prev, next])
      return next
    },
    remove: (id) => setComments((prev) => prev.filter((c) => c.id !== id)),
  }
}
