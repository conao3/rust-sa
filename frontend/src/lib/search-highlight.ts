export function findMatchOffsets(text: string, needle: string): number[] {
  const n = needle.toLowerCase()
  if (!n) return []
  const hay = text.toLowerCase()
  const out: number[] = []
  let from = 0
  for (;;) {
    const i = hay.indexOf(n, from)
    if (i < 0) return out
    out.push(i)
    from = i + n.length
  }
}

export interface LocatedOffset {
  index: number
  offset: number
}

export function locateOffset(
  lengths: readonly number[],
  offset: number,
  inclusive = false,
): LocatedOffset | null {
  let acc = 0
  for (let index = 0; index < lengths.length; index += 1) {
    const len = lengths[index] ?? 0
    const end = acc + len
    if (inclusive ? offset <= end : offset < end) return { index, offset: offset - acc }
    acc = end
  }
  return null
}

export function collectMatchRanges(container: Element, needle: string): Range[] {
  const doc = container.ownerDocument
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (let cur = walker.nextNode(); cur; cur = walker.nextNode()) {
    const t = cur as Text
    if (t.data.length > 0) nodes.push(t)
  }
  if (nodes.length === 0) return []
  const offsets = findMatchOffsets(nodes.map((n) => n.data).join(''), needle)
  if (offsets.length === 0) return []
  const lengths = nodes.map((n) => n.data.length)
  const ranges: Range[] = []
  for (const start of offsets) {
    const s = locateOffset(lengths, start)
    const e = locateOffset(lengths, start + needle.length, true)
    if (!s || !e) continue
    const range = doc.createRange()
    range.setStart(nodes[s.index]!, s.offset)
    range.setEnd(nodes[e.index]!, e.offset)
    ranges.push(range)
  }
  return ranges
}

const HIGHLIGHT_ALL = 'sa-search-hit'
const HIGHLIGHT_ACTIVE = 'sa-search-hit-active'

export const SEARCH_HIGHLIGHT_CSS = `::highlight(${HIGHLIGHT_ALL}){background-color:var(--hit);}
::highlight(${HIGHLIGHT_ACTIVE}){background-color:var(--hit-active);color:var(--bg);}`

interface HighlightRegistry {
  all: Highlight
  active: Highlight
}

let registry: HighlightRegistry | null | undefined
const owned = new Map<string, { all: Range[]; active: Range[] }>()

function getRegistry(): HighlightRegistry | null {
  if (registry !== undefined) return registry
  if (typeof CSS === 'undefined' || !('highlights' in CSS) || typeof Highlight === 'undefined') {
    registry = null
    return null
  }
  registry = { all: new Highlight(), active: new Highlight() }
  registry.active.priority = 1
  CSS.highlights.set(HIGHLIGHT_ALL, registry.all)
  CSS.highlights.set(HIGHLIGHT_ACTIVE, registry.active)
  return registry
}

export function setSearchHighlights(owner: string, all: Range[], active: Range[]) {
  const reg = getRegistry()
  if (!reg) return
  clearSearchHighlights(owner)
  for (const r of all) reg.all.add(r)
  for (const r of active) reg.active.add(r)
  owned.set(owner, { all, active })
}

export function clearSearchHighlights(owner: string) {
  const reg = getRegistry()
  const prev = owned.get(owner)
  if (!reg || !prev) return
  for (const r of prev.all) reg.all.delete(r)
  for (const r of prev.active) reg.active.delete(r)
  owned.delete(owner)
}
