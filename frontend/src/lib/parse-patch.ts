export function splitPatchByFile(patch: string): string[] {
  const lines = patch.split('\n')
  const files: string[] = []
  let current: string[] = []
  for (const line of lines) {
    if (line.startsWith('diff --git ') && current.length > 0) {
      files.push(current.join('\n'))
      current = []
    }
    current.push(line)
  }
  if (current.length > 0) files.push(current.join('\n'))
  return files.filter((p) => p.includes('diff --git '))
}

export function pathFromPatch(filePatch: string): string {
  const match = filePatch.match(/^diff --git a\/(\S+) b\/(\S+)/m)
  return match ? match[2] : 'unknown'
}
