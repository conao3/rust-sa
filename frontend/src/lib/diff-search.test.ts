import { describe, expect, it } from 'vitest'
import { buildDiffSearchHits } from './diff-search'

describe('buildDiffSearchHits', () => {
  it('matches patch content lines case-insensitively', () => {
    const hits = buildDiffSearchHits(
      [{ path: 'src/GeneratedClient.ts' }, { path: 'README.md' }],
      new Map([
        ['src/GeneratedClient.ts', 'diff --git a/x b/x\n+Needle line'],
        ['README.md', '+nothing'],
      ]),
      'needle',
    )
    expect(hits.map((h) => [h.path, h.rowIndex])).toEqual([['src/GeneratedClient.ts', 1]])
  })

  it('ignores file paths and diff headers', () => {
    const hits = buildDiffSearchHits(
      [{ path: 'src/search.ts' }],
      new Map([
        [
          'src/search.ts',
          'diff --git a/src/search.ts b/src/search.ts\n--- a/src/search.ts\n+++ b/src/search.ts\n@@ -1 +1 @@\n+body',
        ],
      ]),
      'search',
    )
    expect(hits).toEqual([])
  })

  it('records the rendered line text and its ordinal among identical lines', () => {
    const hits = buildDiffSearchHits(
      [{ path: 'a.ts' }],
      new Map([['a.ts', '@@ -1,3 +1,3 @@\n foo()\n-foo()\n+bar()\n foo()']]),
      'foo',
    )
    expect(hits.map((h) => [h.rowIndex, h.text, h.ordinal])).toEqual([
      [1, 'foo()', 0],
      [2, 'foo()', 1],
      [4, 'foo()', 2],
    ])
  })

  it('returns no hits for blank queries', () => {
    expect(buildDiffSearchHits([{ path: 'a' }], new Map([['a', '+a']]), '  ')).toEqual([])
  })
})
