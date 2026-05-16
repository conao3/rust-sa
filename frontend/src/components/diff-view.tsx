import { PatchDiff } from '@pierre/diffs/react'
import type { ComponentProps } from 'react'
import { pathFromPatch, splitPatchByFile } from '#/lib/parse-patch'

export interface DiffViewProps {
  patch: string
  layout?: 'unified' | 'split'
  theme?: 'light' | 'dark'
  className?: string
}

export function DiffView({ patch, layout = 'unified', theme = 'light', className }: DiffViewProps) {
  const options: ComponentProps<typeof PatchDiff>['options'] = {
    diffStyle: layout,
    theme: theme === 'dark' ? 'github-dark' : 'github-light',
  }
  const files = splitPatchByFile(patch)

  return (
    <div className={className}>
      {files.map((filePatch) => (
        <PatchDiff key={pathFromPatch(filePatch)} patch={filePatch} options={options} />
      ))}
    </div>
  )
}
