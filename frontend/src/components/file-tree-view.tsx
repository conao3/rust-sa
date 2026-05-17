import { FileTree, useFileTree, useFileTreeSelection } from '@pierre/trees/react'
import type { GitStatusEntry } from '@pierre/trees'
import { useEffect, useRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react'

export interface FileTreeViewProps {
  paths: string[]
  gitStatus?: readonly GitStatusEntry[]
  header?: ReactNode
  renderContextMenu?: ComponentProps<typeof FileTree>['renderContextMenu']
  style?: CSSProperties
  search?: boolean
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
  ['--trees-search-bg-override' as string]: 'var(--bg)',
  ['--trees-search-fg-override' as string]: 'var(--ink)',
}

export function FileTreeView({
  paths,
  gitStatus,
  header,
  renderContextMenu,
  style,
  search = false,
  onSelectionChange,
  initialExpansion = 'open',
}: FileTreeViewProps) {
  const { model } = useFileTree({
    initialExpansion,
    paths,
    search,
  })
  const selection = useFileTreeSelection(model)
  const onSelectionChangeRef = useRef(onSelectionChange)
  onSelectionChangeRef.current = onSelectionChange
  useEffect(() => {
    onSelectionChangeRef.current?.(selection)
  }, [selection])

  useEffect(() => {
    model.resetPaths(paths)
  }, [model, paths])

  useEffect(() => {
    model.setGitStatus(gitStatus)
  }, [model, gitStatus])

  return (
    <FileTree
      model={model}
      header={header}
      renderContextMenu={renderContextMenu}
      style={{ ...THEME_STYLE, ...style }}
    />
  )
}
