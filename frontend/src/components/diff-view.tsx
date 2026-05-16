import { PatchDiff } from '@pierre/diffs/react'
import type { ComponentProps, ReactNode } from 'react'
import { pathFromPatch, splitPatchByFile } from '#/lib/parse-patch'

type PatchDiffProps = ComponentProps<typeof PatchDiff>
type RenderHeaderMetadata = PatchDiffProps['renderHeaderMetadata']
type LineAnnotations = PatchDiffProps['lineAnnotations']

export interface DiffViewProps {
  patch: string
  layout?: 'unified' | 'split'
  theme?: 'light' | 'dark'
  className?: string
  renderHeaderMetadata?: RenderHeaderMetadata
  lineAnnotationsFor?: (path: string) => LineAnnotations
  renderAnnotation?: (annotation: unknown) => ReactNode
}

export function DiffView({
  patch,
  layout = 'unified',
  theme = 'light',
  className,
  renderHeaderMetadata,
  lineAnnotationsFor,
  renderAnnotation,
}: DiffViewProps) {
  const options: PatchDiffProps['options'] = {
    diffStyle: layout,
    theme: theme === 'dark' ? 'github-dark' : 'github-light',
  }
  const files = splitPatchByFile(patch)

  return (
    <div className={className}>
      {files.map((filePatch) => {
        const path = pathFromPatch(filePatch)
        return (
          <PatchDiff
            key={path}
            patch={filePatch}
            options={options}
            renderHeaderMetadata={renderHeaderMetadata}
            lineAnnotations={lineAnnotationsFor?.(path)}
            renderAnnotation={renderAnnotation as PatchDiffProps['renderAnnotation']}
          />
        )
      })}
    </div>
  )
}
