import { useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useLocation, useRouter } from '@tanstack/react-router'
import { isTauri } from '#/lib/apollo'

export function UrlBar() {
  const location = useLocation()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const current = `${location.pathname}${location.searchStr}${location.hash ? `#${location.hash}` : ''}`
  const [value, setValue] = useState(current)
  const tauri = isTauri()

  // Reflect router-initiated navigations back into the bar.
  useEffect(() => {
    setValue(current)
  }, [current])

  // Browser-style window shortcuts. Only register them inside the tauri
  // webview so we don't preventDefault on a real browser's Cmd+L / Cmd+N.
  const hotkeys = useMemo(() => {
    if (!tauri) return []
    return [
      {
        hotkey: { key: 'l', mod: true },
        callback: () => {
          const el = inputRef.current
          if (!el) return
          el.focus()
          el.select()
        },
      },
      {
        hotkey: { key: 'n', mod: true },
        callback: () => {
          void (async () => {
            const { invoke } = await import('@tauri-apps/api/core')
            try {
              await invoke('open_new_window')
            } catch (err) {
              console.error('open_new_window failed', err)
            }
          })()
        },
      },
    ]
  }, [tauri])
  useHotkeys(hotkeys, { preventDefault: true })

  if (!tauri) return null

  const submit = () => {
    let path = value.trim()
    if (path === '') return
    try {
      // Accept full URLs like "https://sa.localhost/browse?repo=..." by
      // dropping origin so the SPA router can take over.
      const parsed = new URL(path, window.location.origin)
      path = `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      if (!path.startsWith('/')) path = `/${path}`
    }
    router.history.push(path)
  }

  return (
    <div className="flex items-center px-4 py-1.5 bg-bg-card border-b border-hairline flex-shrink-0">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          } else if (e.key === 'Escape') {
            setValue(current)
            inputRef.current?.blur()
          }
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Address bar"
        className="flex-1 h-7 px-2 rounded-sm border border-hairline bg-bg font-mono text-xs text-ink outline-none focus:border-rust"
      />
    </div>
  )
}
