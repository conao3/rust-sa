import { processFile, type FileDiffMetadata } from '@pierre/diffs'
import { FileDiff, PatchDiff } from '@pierre/diffs/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { CommentComposer } from '#/components/comment-composer'
import { CommentThread } from '#/components/comment-thread'
import { ViewedCheck } from '#/components/ui/viewed-check'
import type { Comment, Side } from '#/lib/comments'
import { useDiff, useFileBlobs } from '#/lib/diff-api'

type PatchDiffProps = ComponentProps<typeof PatchDiff>
type RenderCustomHeader = PatchDiffProps['renderCustomHeader']
interface SelectedLineRange {
  start: number
  end: number
  side?: Side
  endSide?: Side
}

interface DiffViewFile {
  path: string
  additions?: number
  deletions?: number
  /** Row count the unified-mode renderer will paint. */
  visibleLines?: number
  /** Row count the split-mode renderer will paint (paired add/del rows share
   * a single visual row). The active layout picks one of the two. */
  visibleLinesSplit?: number
}

interface AddCommentInput {
  path: string
  side: Side
  startLineNumber: number
  endLineNumber: number
  body: string
}

export interface DiffViewProps {
  rev: string
  refreshKey: number
  files: DiffViewFile[]
  repo: string
  initialPatches?: Record<string, string>
  layout?: 'unified' | 'split'
  theme?: 'light' | 'dark'
  className?: string
  comments?: Comment[]
  isViewed?: (path: string) => boolean
  onToggleViewed?: (path: string) => void
  onAddComment?: (input: AddCommentInput) => void
  onDeleteComment?: (id: string) => void
  ignoreWhitespace?: boolean
}

export function DiffView({
  rev,
  refreshKey,
  files,
  repo,
  initialPatches,
  layout = 'unified',
  theme = 'light',
  className,
  comments,
  isViewed,
  onToggleViewed,
  onAddComment,
  onDeleteComment,
  ignoreWhitespace,
}: DiffViewProps) {
  return (
    <div className={className}>
      {files.map((f) => (
        <FileBlock
          key={f.path}
          rev={rev}
          path={f.path}
          repo={repo}
          additions={f.additions ?? 0}
          deletions={f.deletions ?? 0}
          visibleLines={f.visibleLines}
          visibleLinesSplit={f.visibleLinesSplit}
          refreshKey={refreshKey}
          initialPatch={initialPatches?.[f.path]}
          layout={layout}
          theme={theme}
          comments={comments?.filter((c) => c.path === f.path)}
          viewed={isViewed?.(f.path) ?? false}
          onToggleViewed={onToggleViewed ? () => onToggleViewed(f.path) : undefined}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          ignoreWhitespace={ignoreWhitespace}
        />
      ))}
    </div>
  )
}

interface FileBlockProps {
  rev: string
  path: string
  repo: string
  additions: number
  deletions: number
  visibleLines?: number
  visibleLinesSplit?: number
  refreshKey: number
  initialPatch?: string
  layout: 'unified' | 'split'
  theme: 'light' | 'dark'
  comments?: Comment[]
  viewed: boolean
  onToggleViewed?: () => void
  onAddComment?: (input: AddCommentInput) => void
  onDeleteComment?: (id: string) => void
  ignoreWhitespace?: boolean
}

interface ComposingState {
  side: Side
  startLineNumber: number
  endLineNumber: number
}

function FileBlock({
  rev,
  path,
  repo,
  additions,
  deletions,
  visibleLines,
  visibleLinesSplit,
  refreshKey,
  initialPatch,
  layout,
  theme,
  comments = [],
  viewed,
  onToggleViewed,
  onAddComment,
  onDeleteComment,
  ignoreWhitespace,
}: FileBlockProps) {
  const { patch, loading, error } = useDiff(
    rev,
    repo,
    refreshKey,
    path,
    initialPatch,
    ignoreWhitespace,
  )
  const blobs = useFileBlobs(rev, repo, path, refreshKey)
  const fileDiff = useMemo<FileDiffMetadata | undefined>(() => {
    if (!patch || !blobs.available || blobs.error) return undefined
    try {
      return processFile(patch, {
        isGitDiff: true,
        oldFile: { name: path, contents: blobs.oldText ?? '' },
        newFile: { name: path, contents: blobs.newText ?? '' },
      })
    } catch {
      return undefined
    }
  }, [patch, blobs.available, blobs.error, blobs.oldText, blobs.newText, path])
  // visibleLines / visibleLinesSplit come from the backend's parse of the
  // unified diff and match pierre/diffs' row count for each mode to within
  // ±1. The active layout decides which one we reserve against. Fall back to
  // a generous additions+deletions estimate only when neither field is
  // present (older API).
  const visibleForLayout = layout === 'split' ? visibleLinesSplit : visibleLines
  const reservedHeight =
    visibleForLayout != null
      ? Math.max(80, visibleForLayout * LINE_HEIGHT + FILE_HEADER_HEIGHT)
      : Math.max(240, (additions + deletions + 30) * 22)
  const [composing, setComposing] = useState<ComposingState | null>(null)
  const [composerBody, setComposerBody] = useState('')
  const [selectedLines, setSelectedLines] = useState<SelectedLineRange | null>(null)
  const [collapsed, setCollapsed] = useState(viewed)
  const containerRef = useRef<HTMLDivElement>(null)
  // Once a block has come within 1.5 viewports of the scroll port, drop the
  // content-visibility:auto so pierre starts tokenizing before the user
  // actually arrives. Without this, fast scrolling reveals a blank wrapper
  // for ~200-500 ms while shiki runs on the freshly-uncovered block.
  const [warmed, setWarmed] = useState(false)

  const handleToggleViewed = () => {
    setCollapsed(!viewed)
    onToggleViewed?.()
  }

  useEffect(() => {
    if (warmed || collapsed) return
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setWarmed(true)
      return
    }
    let cancelled = false
    const finish = () => {
      if (cancelled) return
      cancelled = true
      setWarmed(true)
    }
    // Pre-warm when the block enters a 3-viewport-tall margin so fast
    // scrolling has somewhere already-rendered to arrive at.
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          obs.disconnect()
          finish()
        }
      },
      { rootMargin: '3000px 0px' },
    )
    obs.observe(el)
    // Background pre-render in idle time so even blocks far below get
    // tokenized before the user reaches them. The intersection observer is
    // still the primary trigger; this only catches the long-tail case.
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(cb, { timeout: 4000 })
        : window.setTimeout(cb, 1500)
    const cancelIdle = (handle: number) => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
    const handle = idle(() => {
      obs.disconnect()
      finish()
    })
    return () => {
      cancelled = true
      obs.disconnect()
      cancelIdle(handle)
    }
  }, [warmed, collapsed])

  useEffect(() => {
    if (loading || error || collapsed) return
    const sheet = getDiffsScrollbarSheet()
    if (!sheet) return
    const adopt = () => {
      const container = containerRef.current?.querySelector('diffs-container')
      const root = container?.shadowRoot
      if (!root) return false
      if (root.adoptedStyleSheets.includes(sheet)) return true
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
      return true
    }
    if (adopt()) return
    const id = window.setInterval(() => {
      if (adopt()) window.clearInterval(id)
    }, 100)
    return () => window.clearInterval(id)
  }, [loading, error, collapsed, patch])

  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const eventPath = e.composedPath() as Element[]
      const insideContainer =
        containerRef.current != null && eventPath.includes(containerRef.current)
      const insideComposer = eventPath.some(
        (el) => el instanceof HTMLElement && el.hasAttribute('data-rust-sa-composer'),
      )
      const onGutterUtility = eventPath.some(
        (el) => el instanceof HTMLElement && el.hasAttribute('data-utility-button'),
      )
      if (composing && !insideComposer && !onGutterUtility && !composerBody.trim()) {
        setComposing(null)
        setComposerBody('')
      }
      if (selectedLines && !insideContainer) {
        setSelectedLines(null)
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown, true)
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true)
  }, [composing, composerBody, selectedLines])

  const onGutterUtilityClick = (range: SelectedLineRange) => {
    if (!onAddComment) return
    const side = (range.side ?? 'additions') as Side
    const [start, end] =
      range.start <= range.end ? [range.start, range.end] : [range.end, range.start]
    setComposing({ side, startLineNumber: start, endLineNumber: end })
    setComposerBody('')
  }

  const options: PatchDiffProps['options'] = {
    diffStyle: layout,
    theme: theme === 'dark' ? 'github-dark' : 'github-light',
    enableGutterUtility: true,
    enableLineSelection: true,
    hunkSeparators: 'line-info',
    expandUnchanged: false,
    onGutterUtilityClick,
    onLineSelectionStart: setSelectedLines,
    onLineSelectionChange: setSelectedLines,
    onLineSelectionEnd: setSelectedLines,
    onLineSelected: setSelectedLines,
  }

  const grouped = new Map<string, Comment[]>()
  for (const c of comments) {
    const key = `${c.side}:${c.startLineNumber}:${c.endLineNumber}`
    const arr = grouped.get(key) ?? []
    arr.push(c)
    grouped.set(key, arr)
  }
  const annotations = [
    ...[...grouped.entries()].map(([key, list]) => {
      const [side, , endLn] = key.split(':')
      return {
        side: side as Side,
        lineNumber: Number(endLn),
        metadata: { kind: 'thread' as const, comments: list },
      }
    }),
    ...(composing
      ? [
          {
            side: composing.side,
            lineNumber: composing.endLineNumber,
            metadata: { kind: 'composer' as const },
          },
        ]
      : []),
  ]

  const renderAnnotation = (ann: unknown) => {
    const m = (ann as { metadata?: unknown }).metadata
    if (!m || typeof m !== 'object') return null
    if ((m as { kind: string }).kind === 'thread') {
      const list = (m as { comments: Comment[] }).comments
      return <CommentThread comments={list} onDelete={onDeleteComment} />
    }
    if ((m as { kind: string }).kind === 'composer' && composing) {
      return (
        <CommentComposer
          startLineNumber={composing.startLineNumber}
          endLineNumber={composing.endLineNumber}
          value={composerBody}
          onChange={setComposerBody}
          onCancel={() => {
            setComposing(null)
            setComposerBody('')
          }}
          onSubmit={(body) => {
            onAddComment?.({
              path,
              side: composing.side,
              startLineNumber: composing.startLineNumber,
              endLineNumber: composing.endLineNumber,
              body,
            })
            setComposing(null)
            setComposerBody('')
          }}
        />
      )
    }
    return null
  }

  const wrapperStyle: React.CSSProperties = collapsed
    ? {}
    : {
        // Skip rendering for blocks that haven't entered the warm-up margin
        // yet. Once warmed, drop the skip so the block stays painted (toggling
        // back into 'auto' would risk re-blanking it on scroll-out).
        contentVisibility: warmed ? undefined : 'auto',
        containIntrinsicSize: warmed ? undefined : `auto ${reservedHeight}px`,
        // Reserve the rendered height up-front so streaming hunks don't push
        // subsequent files down. visibleLines-based estimates are accurate to
        // ±1 row so this leaves at most ~20px of slack per file.
        minHeight: visibleForLayout != null ? reservedHeight : undefined,
      }

  if (loading && !patch) {
    return (
      <div
        className="px-4 py-3 font-mono text-xs text-mute border-b border-hairline-soft"
        style={{ minHeight: reservedHeight }}
      >
        {path} — loading…
      </div>
    )
  }
  if (error) {
    return (
      <div className="px-4 py-3 font-mono text-xs text-crimson border-b border-hairline-soft">
        {path} — {error.message}
      </div>
    )
  }

  return (
    <div ref={containerRef} style={wrapperStyle} className="relative">
      <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-2 bg-bg border-b border-hairline">
        <button
          type="button"
          aria-label={collapsed ? 'Expand file' : 'Collapse file'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center justify-center w-6 h-6 rounded-sm text-mute hover:text-ink hover:bg-bg-card cursor-pointer flex-shrink-0"
        >
          {collapsed ? (
            <ChevronRight size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </button>
        <span className="font-mono text-sm text-ink truncate">{path}</span>
        <span className="font-mono text-xs whitespace-nowrap">
          <span className="text-crimson">-{deletions}</span>
          <span className="text-faint"> </span>
          <span className="text-moss">+{additions}</span>
        </span>
        {onToggleViewed && (
          <span className="ml-auto">
            <ViewedCheck isOn={viewed} onToggle={handleToggleViewed} />
          </span>
        )}
      </div>
      {!collapsed &&
        (fileDiff ? (
          <FileDiff
            fileDiff={fileDiff}
            options={options}
            lineAnnotations={annotations}
            selectedLines={selectedLines}
            renderCustomHeader={hideDefaultHeader}
            renderAnnotation={renderAnnotation}
          />
        ) : (
          <PatchDiff
            patch={patch}
            options={options}
            lineAnnotations={annotations}
            selectedLines={selectedLines}
            renderCustomHeader={hideDefaultHeader}
            renderAnnotation={renderAnnotation}
          />
        ))}
    </div>
  )
}

const hideDefaultHeader: NonNullable<RenderCustomHeader> = () => null
// Pierre/diffs renders each row at line-height 20px (font-size 13px / lh 20)
// regardless of our --hunkline-h token, and our sticky title bar measures
// ~40px. Slight under-estimation keeps the wrapper from over-reserving and
// leaving visible whitespace between files; tiny CLS during streaming is
// preferable to a permanent gap.
const LINE_HEIGHT = 20
const FILE_HEADER_HEIGHT = 40

let diffsScrollbarSheetCache: CSSStyleSheet | null = null
function getDiffsScrollbarSheet(): CSSStyleSheet | null {
  if (typeof CSSStyleSheet === 'undefined') return null
  if (diffsScrollbarSheetCache) return diffsScrollbarSheetCache
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(`
    [data-code]{scrollbar-width:thin;scrollbar-color:var(--hairline) transparent;}
    [data-code]::-webkit-scrollbar{width:8px;height:8px;}
    [data-code]::-webkit-scrollbar-track{background:transparent;}
    [data-code]::-webkit-scrollbar-thumb{background-color:var(--hairline);border:none;border-radius:9999px;}
    [data-code]:hover::-webkit-scrollbar-thumb,
    :is([data-diff],[data-file]):hover [data-code]::-webkit-scrollbar-thumb{background-color:var(--faint);}
    [data-code]::-webkit-scrollbar-corner{background:transparent;}
  `)
  diffsScrollbarSheetCache = sheet
  return sheet
}

// data-expand-button labels are applied by installA11yPatches in __root.tsx.
