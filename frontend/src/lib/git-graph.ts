export interface GraphCommit {
  sha: string
  parents: string[]
}

export interface GraphNode {
  sha: string
  lane: number
  parentLanes: number[]
  /** Lanes occupied by lines passing through this row (lane → child sha that drew the line). */
  passing: number[]
  color: string
}

const PALETTE = ['var(--rust)', 'var(--moss)', 'var(--amber)', 'var(--crimson)', 'var(--ink-2)']

export function laneColor(lane: number): string {
  return PALETTE[lane % PALETTE.length]
}

/**
 * Assigns each commit a lane and computes edges. Commits should be in
 * topological order (newest first), as returned by git log.
 */
export function layoutGraph(commits: GraphCommit[]): GraphNode[] {
  const nodes: GraphNode[] = []
  /** lanes[i] = sha of the commit whose row will eventually own lane i, or null when free */
  const lanes: (string | null)[] = []

  const findFreeLane = (): number => {
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] == null) return i
    }
    lanes.push(null)
    return lanes.length - 1
  }

  for (const commit of commits) {
    let myLane = lanes.indexOf(commit.sha)
    if (myLane === -1) {
      myLane = findFreeLane()
    }
    lanes[myLane] = null

    const passing = lanes.map((s, i) => (s != null && i !== myLane ? i : -1)).filter((i) => i >= 0)

    const parentLanes: number[] = []
    for (let pi = 0; pi < commit.parents.length; pi++) {
      const parent = commit.parents[pi]
      let existing = lanes.indexOf(parent)
      if (existing !== -1) {
        parentLanes.push(existing)
        continue
      }
      let targetLane: number
      if (pi === 0 && lanes[myLane] == null) {
        targetLane = myLane
      } else {
        targetLane = findFreeLane()
      }
      lanes[targetLane] = parent
      parentLanes.push(targetLane)
    }

    nodes.push({
      sha: commit.sha,
      lane: myLane,
      parentLanes,
      passing,
      color: laneColor(myLane),
    })
  }

  return nodes
}
