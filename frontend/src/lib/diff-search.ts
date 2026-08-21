export interface DiffSearchFile {
  path: string
}

export interface DiffSearchHit {
  id: string
  path: string
  rowIndex: number
  preview: string
  text: string
  ordinal: number
}

export function buildDiffSearchHits(
  files: readonly DiffSearchFile[],
  patches: ReadonlyMap<string, string>,
  query: string,
): DiffSearchHit[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  const hits: DiffSearchHit[] = []
  for (const file of files) {
    const patch = patches.get(file.path)
    if (!patch) continue
    const lines = patch.split('\n')
    const seen = new Map<string, number>()
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? ''
      const isContent = /^[ +-]/.test(line) && !line.startsWith('+++') && !line.startsWith('---')
      if (!isContent) continue
      const text = line.slice(1).trimEnd()
      const ordinal = seen.get(text) ?? 0
      seen.set(text, ordinal + 1)
      if (text.toLowerCase().includes(needle)) {
        hits.push({
          id: `${file.path}:line:${i}`,
          path: file.path,
          rowIndex: i,
          preview: line.trim() || line,
          text,
          ordinal,
        })
      }
    }
  }
  return hits
}
