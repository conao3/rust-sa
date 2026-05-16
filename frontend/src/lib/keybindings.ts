import { useEffect, useRef } from 'react'

export type KeyHandler = () => void
export type Keymap = Record<string, KeyHandler>

export function useKeybindings(map: Keymap) {
  const ref = useRef<Keymap>(map)
  ref.current = map

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const fn = ref.current[e.key]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
