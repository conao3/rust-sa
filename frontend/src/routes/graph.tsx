import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FileDiff, GitCommitHorizontal, RotateCcw, Split } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { HelpSheet } from '#/components/help-sheet'
import { TopBar, type Mode, type Theme, type View } from '#/components/top-bar'
import { Button } from '#/components/ui/button'
import { Tag } from '#/components/ui/tag'
import clsx from 'clsx'
import { DiffView } from '#/components/diff-view'
import { GraphColumn } from '#/components/graph-column'
import { layoutGraph, type GraphNode } from '#/lib/git-graph'
import { usePreference, useRootAttribute } from '#/lib/preference'
import { shortSha } from '#/lib/short-sha'

interface GraphSearch {
  repo?: string
}

export const Route = createFileRoute('/graph')({
  validateSearch: (search: Record<string, unknown>): GraphSearch => ({
    repo: typeof search.repo === 'string' ? search.repo : undefined,
  }),
  loaderDeps: ({ search }) => ({ repo: search.repo }),
  loader: ({ deps }) => {
    if (!deps.repo) {
      throw new Error('?repo=<absolute-path> query parameter is required')
    }
    return { repo: deps.repo }
  },
  component: GraphPage,
})

interface Commit {
  sha: string
  short: string
  message: string
  author: string
  when: string
  refs: string
  parents: string[]
}

const COMMITS_QUERY = gql`
  query Commits($limit: Int, $repo: String!) {
    commits(limit: $limit, repo: $repo) {
      sha
      short
      message
      author
      when
      refs
      parents
    }
  }
`

interface PreviewFile {
  path: string
  status: string
  additions: number
  deletions: number
}

const PREVIEW_FILES_QUERY = gql`
  query PreviewFiles($rev: String!, $repo: String!) {
    files(rev: $rev, repo: $repo) {
      path
      status
      additions
      deletions
    }
  }
`

function GraphPage() {
  const navigate = useNavigate()
  const [mode, setMode] = usePreference<Mode>('rust-sa:mode', 'unified')
  const [theme, setTheme] = usePreference<Theme>('rust-sa:theme', 'light')
  const [density] = usePreference<'compact' | 'regular' | 'comfy'>('rust-sa:density', 'regular')
  const [helpOpen, setHelpOpen] = useState(false)
  const [base, setBase] = useState<string | null>(null)
  const [head, setHead] = useState<string | null>(null)
  const [threeDot, setThreeDot] = useState(true)

  useRootAttribute('data-theme', theme)
  useRootAttribute('data-density', density)

  const { repo } = Route.useLoaderData()
  const { data, loading, error } = useQuery<{ commits: Commit[] }>(COMMITS_QUERY, {
    variables: { limit: 80, repo },
  })
  const commits = data?.commits ?? []

  useHotkeys(
    [
      { hotkey: { key: '/', shift: true }, callback: () => setHelpOpen((o) => !o) },
      { hotkey: 'S', callback: () => setMode(mode === 'unified' ? 'split' : 'unified') },
    ],
    { preventDefault: true, ignoreInputs: true },
  )

  const onRowClick = (e: MouseEvent, sha: string) => {
    if (e.shiftKey) setHead(sha)
    else setBase(sha)
  }

  const onViewChange = (next: View) => {
    if (next === 'diff')
      navigate({ to: '/compare/$', params: { _splat: 'HEAD' }, search: { repo } })
  }

  const previewSpec = base ? (head ? `${base}${threeDot ? '...' : '..'}${head}` : base) : null

  const openDiff = () => {
    if (!previewSpec) return
    navigate({ to: '/compare/$', params: { _splat: previewSpec }, search: { repo } })
  }

  return (
    <div className="grid grid-rows-[var(--topbar-h)_1fr] h-screen bg-bg text-ink">
      <TopBar
        base={base ? shortSha(base) : '—'}
        head={head ? shortSha(head) : '—'}
        separator={threeDot ? '···' : '··'}
        mode={mode}
        onModeChange={setMode}
        theme={theme}
        onThemeChange={setTheme}
        view="graph"
        onViewChange={onViewChange}
        viewedCount={0}
        totalCount={0}
      />
      <div className="border-t border-hairline grid grid-cols-[420px_1fr] min-h-0">
        <aside className="bg-bg-soft border-r border-hairline overflow-y-auto">
          <div className="px-4 pt-4 pb-2 font-mono text-xs uppercase tracking-widest text-mute inline-flex items-center gap-1.5">
            <GitCommitHorizontal size={16} aria-hidden="true" />
            commits
          </div>
          {loading && <div className="px-4 py-2 font-mono text-xs text-mute">loading…</div>}
          {error && <div className="px-4 py-2 font-mono text-xs text-crimson">{error.message}</div>}
          <CommitList commits={commits} base={base} head={head} onRowClick={onRowClick} />
        </aside>
        <main className="relative overflow-hidden bg-bg">
          {previewSpec ? (
            <DiffPreview rev={previewSpec} repo={repo} layout={mode} theme={theme} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <h2 className="m-0 font-serif text-4xl tracking-tight text-faint">
                  pick a commit.
                </h2>
                <p className="m-0 font-sans text-sm text-mute max-w-md">
                  Click to set <span className="text-rust font-medium">base</span> (older)
                  {' · '}
                  Shift-click to set <span className="text-moss font-medium">head</span> (newer).
                </p>
                <p className="m-0 font-sans text-xs text-faint max-w-md">
                  Selecting only base shows that commit&apos;s diff against its parent. Selecting
                  both shows base
                  {threeDot ? '…head' : '..head'}.
                </p>
              </div>
            </div>
          )}
          <GraphSummary
            base={base}
            head={head}
            threeDot={threeDot}
            onToggleThreeDot={() => setThreeDot((t) => !t)}
            onOpen={openDiff}
            onClear={() => {
              setBase(null)
              setHead(null)
            }}
          />
        </main>
      </div>
      <HelpSheet isOpen={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}

function DiffPreview({
  rev,
  repo,
  layout,
  theme,
}: {
  rev: string
  repo: string
  layout: Mode
  theme: Theme
}) {
  const { data, loading, error } = useQuery<{ files: PreviewFile[] }>(PREVIEW_FILES_QUERY, {
    variables: { rev, repo },
    fetchPolicy: 'cache-and-network',
  })
  const files = data?.files ?? []
  if (loading && files.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-mute">
        loading diff…
      </div>
    )
  }
  if (error) {
    return (
      <div className="absolute inset-0 flex items-start justify-center px-6 pt-10 font-mono text-xs text-crimson">
        {error.message}
      </div>
    )
  }
  if (files.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-mute">
        no changes in this range
      </div>
    )
  }
  return (
    <div className="absolute inset-0 pb-20 overflow-y-auto">
      <DiffView rev={rev} refreshKey={0} files={files} repo={repo} layout={layout} theme={theme} />
    </div>
  )
}

const ROW_HEIGHT = 28

function CommitList({
  commits,
  base,
  head,
  onRowClick,
}: {
  commits: Commit[]
  base: string | null
  head: string | null
  onRowClick: (e: MouseEvent, sha: string) => void
}) {
  const nodes = layoutGraph(commits)
  const totalLanes = nodes.reduce(
    (max, n) =>
      Math.max(max, n.lane + 1, ...n.parentLanes.map((p) => p + 1), ...n.passing.map((p) => p + 1)),
    1,
  )
  return (
    <>
      {commits.map((c, i) => (
        <CommitRow
          key={c.sha}
          commit={c}
          node={nodes[i]}
          nextNode={nodes[i + 1]}
          totalLanes={totalLanes}
          isBase={base === c.sha}
          isHead={head === c.sha}
          onClick={(e) => onRowClick(e, c.sha)}
        />
      ))}
    </>
  )
}

function CommitRow({
  commit,
  node,
  nextNode,
  totalLanes,
  isBase,
  isHead,
  onClick,
}: {
  commit: Commit
  node: GraphNode
  nextNode: GraphNode | undefined
  totalLanes: number
  isBase: boolean
  isHead: boolean
  onClick: (e: MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: ROW_HEIGHT }}
      className={clsx(
        'w-full text-left flex items-center gap-2 pr-3 border-b border-hairline-soft font-mono text-xs cursor-pointer hover:bg-bg-card',
        isBase && 'bg-rust-soft',
        isHead && 'bg-moss-soft',
      )}
    >
      <GraphColumn node={node} nextNode={nextNode} rowHeight={ROW_HEIGHT} totalLanes={totalLanes} />
      <span className="text-rust">{commit.short}</span>
      <span className="text-ink flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
        {commit.message}
      </span>
      {commit.refs && <RefBadges refs={commit.refs} isBase={isBase} isHead={isHead} />}
      <span className="text-mute text-xs flex-shrink-0">{commit.when}</span>
    </button>
  )
}

function RefBadges({ refs, isBase, isHead }: { refs: string; isBase: boolean; isHead: boolean }) {
  const parts = refs
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
  return (
    <span className="inline-flex gap-1 flex-shrink-0">
      {parts.map((p) => {
        const isHeadRef = p.includes('HEAD')
        const isTag = p.startsWith('tag:')
        const label = isTag ? p.replace('tag: ', '') : p.replace('HEAD -> ', '')
        return (
          <Tag key={p} tone={isHeadRef ? 'rust' : isTag ? 'neutral' : 'moss'}>
            {label}
          </Tag>
        )
      })}
      {isBase && <Tag tone="rust">base</Tag>}
      {isHead && <Tag tone="moss">head</Tag>}
    </span>
  )
}

function GraphSummary({
  base,
  head,
  threeDot,
  onToggleThreeDot,
  onOpen,
  onClear,
}: {
  base: string | null
  head: string | null
  threeDot: boolean
  onToggleThreeDot: () => void
  onOpen: () => void
  onClear: () => void
}) {
  return (
    <div className="absolute left-5 right-5 bottom-5 bg-bg border border-hairline rounded-sm px-5 py-4 font-mono text-xs flex items-center gap-4">
      <span className="text-xs uppercase tracking-wider text-mute">compare</span>
      <span className="inline-flex items-center gap-1.5 text-ink">
        <span className="w-2 h-2 rounded-full inline-block bg-rust" />
        {base ? shortSha(base) : '—'}
      </span>
      <span className="text-faint">{threeDot ? '···' : '··'}</span>
      <span className="inline-flex items-center gap-1.5 text-ink">
        <span className="w-2 h-2 rounded-full inline-block bg-moss" />
        {head ? shortSha(head) : '—'}
      </span>
      <Button variant="ghost" size="sm" onPress={onToggleThreeDot}>
        <Split size={16} aria-hidden="true" />
        {threeDot ? 'three-dot' : 'two-dot'}
      </Button>
      <span className="flex-1" />
      <Button variant="ghost" size="sm" onPress={onClear}>
        <RotateCcw size={16} aria-hidden="true" />
        clear
      </Button>
      <Button variant="primary" size="sm" onPress={onOpen} isDisabled={!base}>
        <FileDiff size={16} aria-hidden="true" />
        open diff
      </Button>
    </div>
  )
}
