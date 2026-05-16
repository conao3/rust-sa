import { useEffect, useRef } from 'react'

export function useSSE(url: string, onMessage: (data: string) => void) {
  const ref = useRef(onMessage)
  ref.current = onMessage

  useEffect(() => {
    if (typeof window === 'undefined') return
    const es = new EventSource(url)
    es.onmessage = (ev) => ref.current(ev.data)
    return () => es.close()
  }, [url])
}
