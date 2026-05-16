import { PatchDiff } from '@pierre/diffs/react'
import type { ComponentProps } from 'react'

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

  return <PatchDiff patch={patch} options={options} className={className} />
}
