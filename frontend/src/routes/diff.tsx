import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DiffView } from '#/components/diff-view'
import { FileTreeView } from '#/components/file-tree-view'
import { HelpSheet } from '#/components/help-sheet'
import { TopBar, type Mode } from '#/components/top-bar'

export const Route = createFileRoute('/diff')({
  component: DiffPage,
})

const SAMPLE_PATHS = [
  'README.md',
  'src/index.ts',
  'src/components/Button.tsx',
  'src/components/Header.tsx',
  'src/lib/apollo.ts',
  'frontend/src/styles.css',
  'crates/server/src/revspec.rs',
  'crates/server/src/lib.rs',
]

const SAMPLE_PATCH = [
  'diff --git a/src/index.ts b/src/index.ts',
  'index 1234567..89abcde 100644',
  '--- a/src/index.ts',
  '+++ b/src/index.ts',
  '@@ -1,5 +1,7 @@',
  "-import { greet } from './greet'",
  "+import { greet, farewell } from './greet'",
  ' ',
  "-console.log(greet('world'))",
  "+console.log(greet('rust-sa'))",
  "+console.log(farewell('rust-sa'))",
  '+',
  ' export {}',
  '',
].join('\n')

function DiffPage() {
  const [mode, setMode] = useState<Mode>('unified')
  const [helpOpen, setHelpOpen] = useState(false)

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
          <FileTreeView paths={SAMPLE_PATHS} header={<TreeHeader />} />
        </aside>
        <main className="overflow-y-auto bg-bg min-w-0">
          <DiffView patch={SAMPLE_PATCH} layout={mode} />
        </main>
      </div>
      <HelpSheet isOpen={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  )
}

function TreeHeader() {
  return (
    <div className="px-3 pt-4 pb-3 border-b border-hairline flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.08em] text-mute">
      <span>files</span>
      <span className="text-ink normal-case tracking-normal text-[11px]">
        0 / {SAMPLE_PATHS.length} viewed
      </span>
    </div>
  )
}
