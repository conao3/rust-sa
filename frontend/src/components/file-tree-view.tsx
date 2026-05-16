import { FileTree, useFileTree } from '@pierre/trees/react'
import { useEffect, type ComponentProps, type CSSProperties, type ReactNode } from 'react'

export interface FileTreeViewProps {
  paths: string[]
  header?: ReactNode
  renderContextMenu?: ComponentProps<typeof FileTree>['renderContextMenu']
  style?: CSSProperties
  search?: boolean
}

export function FileTreeView({
  paths,
  header,
  renderContextMenu,
  style,
  search = true,
}: FileTreeViewProps) {
  const { model } = useFileTree({
    initialExpansion: 'open',
    paths,
    search,
  })

  useEffect(() => {
    model.resetPaths(paths)
  }, [model, paths])

  return (
    <FileTree
      model={model}
      header={header}
      renderContextMenu={renderContextMenu}
      style={{ height: '100%', ...style }}
    />
  )
}
