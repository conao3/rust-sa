import { useEffect, useState } from 'react'

export interface ComputeWrapperMinHeightOptions {
  collapsed: boolean
  inRange: boolean
  stableHeight: number | null
  reservedHeight: number
}

/** Pick the right `min-height` for a file block wrapper based on whether the
 * diff content is currently mounted. When in range the mounted content is the
 * source of truth and we only reserve the streaming-CLS guard
 * (`reservedHeight`). When the block has been virtualised out we keep the
 * larger of the last measured height and the reservation so the placeholder
 * does not collapse. Critically, `stableHeight` is intentionally ignored while
 * in range, otherwise a height observed in unified mode would pin the
 * wrapper open after switching to split mode and produce visible whitespace
 * between files. */
export function computeWrapperMinHeight({
  collapsed,
  inRange,
  stableHeight,
  reservedHeight,
}: ComputeWrapperMinHeightOptions): number | undefined {
  if (collapsed) return undefined
  if (!inRange) return Math.max(stableHeight ?? 0, reservedHeight)
  return reservedHeight
}

type HeightObserver = (cb: (h: number) => void) => () => void

export interface UseStableHeightOptions {
  layout: 'unified' | 'split'
  observe: HeightObserver
}

/** Track the largest height observed for a file block, but reset whenever
 * `layout` changes. Without the reset, a unified-mode measurement would carry
 * over into split mode and leave the wrapper minHeight inflated above the
 * actual rendered split content. */
export function useStableHeight({ layout, observe }: UseStableHeightOptions): {
  stableHeight: number | null
} {
  const [stableHeight, setStableHeight] = useState<number | null>(null)

  useEffect(() => {
    setStableHeight(null)
  }, [layout])

  useEffect(() => {
    return observe((h) => {
      setStableHeight((prev) => (prev != null && prev > h ? prev : h))
    })
  }, [observe])

  return { stableHeight }
}
