import { useEffect, useRef } from 'react'

export function useSSE(url: string, onMessage: (data: string) => void, debounceMs = 800) {
  const ref = useRef(onMessage)
  ref.current = onMessage

  useEffect(() => {
    if (typeof window === 'undefined') return
    const es = new EventSource(url)
    let timer = 0
    let lastData = ''
    es.onmessage = (ev) => {
      lastData = ev.data
      if (timer !== 0) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = 0
        ref.current(lastData)
      }, debounceMs)
    }
    return () => {
      if (timer !== 0) window.clearTimeout(timer)
      es.close()
    }
  }, [url, debounceMs])
}
