import { useEffect, useState } from 'react'

export type Side = 'deletions' | 'additions'

export interface Comment {
  id: string
  path: string
  side: Side
  startLineNumber: number
  endLineNumber: number
  author: string
  body: string
  createdAt: string
}

export interface CommentsState {
  comments: Comment[]
  add: (input: Omit<Comment, 'id' | 'createdAt'>) => Comment
  remove: (id: string) => void
  clear: () => void
}

interface StoredCommentV1 extends Omit<Comment, 'startLineNumber' | 'endLineNumber'> {
  lineNumber?: number
  startLineNumber?: number
  endLineNumber?: number
}

function migrate(raw: StoredCommentV1[]): Comment[] {
  return raw.map((c) => {
    const start = c.startLineNumber ?? c.lineNumber ?? 0
    const end = c.endLineNumber ?? c.lineNumber ?? start
    return {
      id: c.id,
      path: c.path,
      side: c.side,
      author: c.author,
      body: c.body,
      createdAt: c.createdAt,
      startLineNumber: start,
      endLineNumber: end,
    }
  })
}

export function useComments(rev: string): CommentsState {
  const key = `rust-sa:comments:${rev}`
  const [comments, setComments] = useState<Comment[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? migrate(JSON.parse(raw) as StoredCommentV1[]) : []
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
    clear: () => setComments([]),
  }
}
