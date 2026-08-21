import { describe, expect, it } from 'vitest'
import { findMatchOffsets, locateOffset } from './search-highlight'

describe('findMatchOffsets', () => {
  it('finds every non-overlapping occurrence case-insensitively', () => {
    expect(findMatchOffsets('Needle needle NEEDLEneedle', 'needle')).toEqual([0, 7, 14, 20])
  })

  it('returns nothing for an empty needle', () => {
    expect(findMatchOffsets('abc', '')).toEqual([])
  })
})

describe('locateOffset', () => {
  it('maps a global start offset into the owning segment', () => {
    expect(locateOffset([2, 3, 4], 0)).toEqual({ index: 0, offset: 0 })
    expect(locateOffset([2, 3, 4], 2)).toEqual({ index: 1, offset: 0 })
    expect(locateOffset([2, 3, 4], 6)).toEqual({ index: 2, offset: 1 })
    expect(locateOffset([2, 3, 4], 9)).toBeNull()
  })

  it('maps an end offset onto the segment that closes it', () => {
    expect(locateOffset([2, 3, 4], 2, true)).toEqual({ index: 0, offset: 2 })
    expect(locateOffset([2, 3, 4], 5, true)).toEqual({ index: 1, offset: 3 })
    expect(locateOffset([2, 3, 4], 9, true)).toEqual({ index: 2, offset: 4 })
    expect(locateOffset([2, 3, 4], 10, true)).toBeNull()
  })
})
