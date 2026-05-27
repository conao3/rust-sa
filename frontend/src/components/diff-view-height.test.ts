// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { computeWrapperMinHeight, useStableHeight } from './diff-view-height'

describe('computeWrapperMinHeight', () => {
  it('returns undefined for collapsed blocks so the wrapper hugs its sticky header', () => {
    expect(
      computeWrapperMinHeight({
        collapsed: true,
        inRange: true,
        stableHeight: 1000,
        reservedHeight: 500,
      }),
    ).toBeUndefined()
  })

  it('returns reservedHeight when in range, ignoring a larger stableHeight from a previous layout', () => {
    // The mounted content is the source of truth for its own height. A
    // previously-observed stableHeight (e.g. from unified mode) must not
    // keep the wrapper inflated after the layout switches to split, since
    // that is exactly the gap-between-files regression we are guarding.
    expect(
      computeWrapperMinHeight({
        collapsed: false,
        inRange: true,
        stableHeight: 1000,
        reservedHeight: 400,
      }),
    ).toBe(400)
  })

  it('returns reservedHeight when in range and stableHeight is null', () => {
    expect(
      computeWrapperMinHeight({
        collapsed: false,
        inRange: true,
        stableHeight: null,
        reservedHeight: 250,
      }),
    ).toBe(250)
  })

  it('returns max(stableHeight, reservedHeight) when out of range so the placeholder keeps its measured size', () => {
    expect(
      computeWrapperMinHeight({
        collapsed: false,
        inRange: false,
        stableHeight: 1000,
        reservedHeight: 400,
      }),
    ).toBe(1000)
    expect(
      computeWrapperMinHeight({
        collapsed: false,
        inRange: false,
        stableHeight: 300,
        reservedHeight: 500,
      }),
    ).toBe(500)
  })

  it('falls back to reservedHeight when out of range and stableHeight is null', () => {
    expect(
      computeWrapperMinHeight({
        collapsed: false,
        inRange: false,
        stableHeight: null,
        reservedHeight: 320,
      }),
    ).toBe(320)
  })
})

describe('useStableHeight', () => {
  it('starts at null', () => {
    const { result } = renderHook(() =>
      useStableHeight({ layout: 'unified', observe: noopObserver }),
    )
    expect(result.current.stableHeight).toBeNull()
  })

  it('records observed heights and keeps the maximum', () => {
    let emit: ((h: number) => void) | null = null
    const observer = (cb: (h: number) => void) => {
      emit = cb
      return () => {
        emit = null
      }
    }
    const { result } = renderHook(() => useStableHeight({ layout: 'unified', observe: observer }))
    act(() => emit?.(500))
    expect(result.current.stableHeight).toBe(500)
    act(() => emit?.(700))
    expect(result.current.stableHeight).toBe(700)
    act(() => emit?.(400))
    // Keep the larger value so the placeholder does not shrink while the
    // file is still mounted and the user is scrolling around it.
    expect(result.current.stableHeight).toBe(700)
  })

  it('resets stableHeight to null when layout changes', () => {
    let emit: ((h: number) => void) | null = null
    const observer = (cb: (h: number) => void) => {
      emit = cb
      return () => {
        emit = null
      }
    }
    const { result, rerender } = renderHook(
      ({ layout }: { layout: 'unified' | 'split' }) =>
        useStableHeight({ layout, observe: observer }),
      { initialProps: { layout: 'unified' } },
    )
    act(() => emit?.(900))
    expect(result.current.stableHeight).toBe(900)
    rerender({ layout: 'split' })
    expect(result.current.stableHeight).toBeNull()
  })

  it('calls the observer cleanup on unmount', () => {
    const cleanup = vi.fn()
    const observer = () => cleanup
    const { unmount } = renderHook(() => useStableHeight({ layout: 'unified', observe: observer }))
    unmount()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})

function noopObserver(): () => void {
  return () => {}
}
