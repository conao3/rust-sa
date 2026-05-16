import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { DiffView } from '#/components/diff-view'
import { FileTreeView } from '#/components/file-tree-view'
import { HelpSheet } from '#/components/help-sheet'
import { TopBar, type Mode } from '#/components/top-bar'
import { pathFromPatch, splitPatchByFile } from '#/lib/parse-patch'

export const Route = createFileRoute('/diff')({
  component: DiffPage,
})

const DIFF_QUERY = gql`
  query Diff($rev: String!) {
    diff(rev: $rev)
  }
`

function DiffPage() {
  const [mode, setMode] = useState<Mode>('unified')
  const [helpOpen, setHelpOpen] = useState(false)

  const { data, loading, error } = useQuery<{ diff: string }>(DIFF_QUERY, {
    variables: { rev: 'HEAD' },
  })
  const patch = data?.diff ?? ''
  const paths = useMemo(() => splitPatchByFile(patch).map(pathFromPatch), [patch])

  return (
    <div className="grid grid-rows-[var(--topbar-h)_1fr] h-screen bg-bg text-ink">
      <TopBar
        base="main"
        head="working"
        mode={mode}
        onModeChange={setMode}
        onHelp={() => setHelpOpen(true)}
        isLive
      />
      <div className="grid grid-cols-[var(--tree-w)_1fr] min-h-0 border-t border-hairline">
        <aside className="bg-bg-soft border-r border-hairline min-h-0 overflow-hidden">
          <FileTreeView paths={paths} header={<TreeHeader count={paths.length} />} />
        </aside>
        <main className="overflow-y-auto bg-bg min-w-0">
          {loading && (
            <div className="p-6 font-mono text-[12px] text-mute">loading diff…</div>
          )}
          {error && (
            <div className="p-6 font-mono text-[12px] text-crimson">
              {error.message}
            </div>
          )}
          {!loading && !error && <DiffView patch={patch} layout={mode} />}
        </main>
      </div>
      <HelpSheet isOpen={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}

function TreeHeader({ count }: { count: number }) {
  return (
    <div className="px-3 pt-4 pb-3 border-b border-hairline flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">
      <span>files</span>
      <span className="text-ink normal-case tracking-normal text-[11px]">
        0 / {count} viewed
      </span>
    </div>
  )
}
