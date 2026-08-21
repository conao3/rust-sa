import { FileTree, useFileTree, useFileTreeSearch, useFileTreeSelection } from '@pierre/trees/react'
import type { GitStatusEntry } from '@pierre/trees'
import { Search, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Button as AriaButton, Input, SearchField } from 'react-aria-components'
import {
  SEARCH_HIGHLIGHT_CSS,
  clearSearchHighlights,
  collectMatchRanges,
  setSearchHighlights,
} from '#/lib/search-highlight'
// a11y patches for the tree's shadow DOM are installed globally in __root.tsx.

interface FileLineCounts {
  additions: number
  deletions: number
}

export interface FileTreeViewProps {
  paths: string[]
  gitStatus?: readonly GitStatusEntry[]
  lineCounts?: ReadonlyMap<string, FileLineCounts>
  header?: ReactNode
  renderContextMenu?: ComponentProps<typeof FileTree>['renderContextMenu']
  style?: CSSProperties
  onSelectionChange?: (selectedPaths: readonly string[]) => void
  initialExpansion?: 'open' | 'closed' | number
}

const THEME_STYLE: CSSProperties = {
  height: '100%',
  paddingBlockStart: '8px',
  ['--trees-bg-override' as string]: 'var(--bg-soft)',
  ['--trees-fg-override' as string]: 'var(--ink)',
  ['--trees-fg-muted-override' as string]: 'var(--mute)',
  ['--trees-border-color-override' as string]: 'var(--hairline)',
  ['--trees-selected-bg-override' as string]: 'var(--bg-strong)',
  ['--trees-hover-bg-override' as string]: 'var(--bg-card)',
  ['--trees-muted-fg-override' as string]: 'var(--mute)',
  // Pierre defaults colour file names by git status (#16a994 added, #1ca1c7
  // modified, etc.) which fails WCAG 4.5:1 on our warm-paper backgrounds.
  // Pin every status colour to --moss/--rust/--crimson so contrast clears.
  ['--trees-git-added-color-override' as string]: 'var(--moss)',
  ['--trees-git-modified-color-override' as string]: 'var(--rust)',
  ['--trees-git-renamed-color-override' as string]: 'var(--rust)',
  ['--trees-git-untracked-color-override' as string]: 'var(--moss)',
  ['--trees-git-deleted-color-override' as string]: 'var(--crimson)',
  ['--trees-git-ignored-color-override' as string]: 'var(--mute)',
  ['--trees-status-added-override' as string]: 'var(--moss)',
  ['--trees-status-modified-override' as string]: 'var(--rust)',
  ['--trees-status-renamed-override' as string]: 'var(--rust)',
  ['--trees-status-untracked-override' as string]: 'var(--moss)',
  ['--trees-status-deleted-override' as string]: 'var(--crimson)',
  ['--trees-status-ignored-override' as string]: 'var(--mute)',
}

export function FileTreeView({
  paths,
  gitStatus,
  lineCounts,
  header,
  renderContextMenu,
  style,
  onSelectionChange,
  initialExpansion = 'open',
}: FileTreeViewProps) {
  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange
  const lineCountsRef = useRef(lineCounts)
  lineCountsRef.current = lineCounts
  const lastEmittedRef = useRef('')
  const emitSelection = useCallback((selectedPaths: readonly string[], force = false) => {
    const key = selectedPaths.join('\n')
    if (!force && key === lastEmittedRef.current) return
    lastEmittedRef.current = key
    onSelectionChangeRef.current?.(selectedPaths)
  }, [])
  const { model } = useFileTree({
    initialExpansion,
    fileTreeSearchMode: 'hide-non-matches',
    onSelectionChange: (selection) => emitSelection(selection),
    paths,
    renderRowDecoration: ({ item }) => {
      if (item.kind !== 'file') return null
      const counts = lineCountsRef.current?.get(item.path)
      if (!counts) return null
      return { text: `-${counts.deletions} +${counts.additions}` }
    },
    unsafeCSS: SEARCH_HIGHLIGHT_CSS,
  })
  const selection = useFileTreeSelection(model)
  useEffect(() => {
    emitSelection(selection)
  }, [emitSelection, selection])

  useEffect(() => {
    model.resetPaths(paths)
  }, [model, paths])

  useEffect(() => {
    model.setGitStatus(gitStatus)
  }, [model, gitStatus])

  const [query, setQuery] = useState('')
  const needle = query.trim()
  useEffect(() => {
    model.setSearch(needle || null)
  }, [model, needle])
  const search = useFileTreeSearch(model)
  const matchingFiles = search.matchingPaths.filter((p) => !p.endsWith('/'))

  const hostRef = useRef<HTMLDivElement>(null)
  const highlightOwner = useId()
  useEffect(() => {
    const wrapper = hostRef.current
    if (!needle || !wrapper) {
      clearSearchHighlights(highlightOwner)
      return
    }
    const shadowRootOf = () => wrapper.querySelector('file-tree-container')?.shadowRoot ?? null
    const apply = () => {
      const root = shadowRootOf()
      if (!root) {
        clearSearchHighlights(highlightOwner)
        return
      }
      const ranges: Range[] = []
      for (const el of root.querySelectorAll('[data-type="item"] [data-item-section="content"]')) {
        ranges.push(...collectMatchRanges(el, needle))
      }
      setSearchHighlights(highlightOwner, ranges, [])
    }
    let raf = 0
    const schedule = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        apply()
      })
    }
    const inner = new MutationObserver(schedule)
    let observedRoot: ShadowRoot | null = null
    const sync = () => {
      const root = shadowRootOf()
      if (root !== observedRoot) {
        inner.disconnect()
        observedRoot = root
        if (root) inner.observe(root, { childList: true, subtree: true, characterData: true })
      }
      schedule()
    }
    const outer = new MutationObserver(sync)
    outer.observe(wrapper, { childList: true, subtree: true })
    sync()
    return () => {
      inner.disconnect()
      outer.disconnect()
      if (raf) window.cancelAnimationFrame(raf)
      clearSearchHighlights(highlightOwner)
    }
  }, [highlightOwner, needle])

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      search.focusNextMatch()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      search.focusPreviousMatch()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const focused = model.getFocusedPath()
      const target = focused && !focused.endsWith('/') ? focused : matchingFiles[0]
      if (target) emitSelection([target], true)
    } else if (event.key === 'Escape' && query) {
      event.preventDefault()
      event.stopPropagation()
      setQuery('')
    }
  }

  const onTreeClickCapture = (event: MouseEvent<HTMLElement>) => {
    for (const node of event.nativeEvent.composedPath()) {
      if (!(node instanceof HTMLElement)) continue
      if (node.dataset.type !== 'item') continue
      if (node.dataset.itemType !== 'file') return
      const path = node.dataset.itemPath
      if (path) emitSelection([path], true)
      return
    }
  }

  return (
    <div ref={hostRef} className="contents">
      <FileTree
        model={model}
        header={
          <>
            {header}
            <SearchField
              value={query}
              onChange={setQuery}
              aria-label="Filter files"
              className="group mx-3 mb-2 flex h-7 items-center gap-2 rounded-sm border border-hairline bg-bg px-2 font-mono text-xs text-mute focus-within:border-rust"
            >
              <Search size={14} aria-hidden="true" className="text-faint flex-shrink-0" />
              <Input
                placeholder="filter files"
                onKeyDown={onSearchKeyDown}
                className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint"
              />
              {needle && (
                <span
                  className={`whitespace-nowrap ${matchingFiles.length === 0 ? 'text-crimson' : 'text-faint'}`}
                >
                  {matchingFiles.length} / {paths.length}
                </span>
              )}
              <AriaButton
                slot="clear"
                aria-label="clear filter"
                className="group-data-[empty]:hidden inline-flex cursor-pointer items-center text-faint hover:text-ink"
              >
                <X size={14} aria-hidden="true" />
              </AriaButton>
            </SearchField>
          </>
        }
        renderContextMenu={renderContextMenu}
        onClickCapture={onTreeClickCapture}
        style={{ ...THEME_STYLE, ...style }}
      />
    </div>
  )
}
