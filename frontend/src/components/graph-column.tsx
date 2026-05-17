import type { GraphNode } from '#/lib/git-graph'
import { laneColor } from '#/lib/git-graph'

interface GraphColumnProps {
  node: GraphNode
  nextNode?: GraphNode
  rowHeight: number
  laneWidth?: number
  totalLanes: number
}

const LANE_W_DEFAULT = 14
const DOT_R = 4

export function GraphColumn({
  node,
  nextNode,
  rowHeight,
  laneWidth = LANE_W_DEFAULT,
  totalLanes,
}: GraphColumnProps) {
  const width = Math.max(1, totalLanes) * laneWidth
  const cx = (lane: number) => lane * laneWidth + laneWidth / 2
  const top = 0
  const mid = rowHeight / 2
  const bot = rowHeight

  return (
    <svg
      width={width}
      height={rowHeight}
      viewBox={`0 0 ${width} ${rowHeight}`}
      aria-hidden="true"
      className="block flex-shrink-0"
    >
      {node.passing.map((lane) => (
        <line
          key={`pass-${lane}`}
          x1={cx(lane)}
          y1={top}
          x2={cx(lane)}
          y2={bot}
          stroke={laneColor(lane)}
          strokeWidth={1.5}
        />
      ))}

      <line
        x1={cx(node.lane)}
        y1={top}
        x2={cx(node.lane)}
        y2={mid}
        stroke={node.color}
        strokeWidth={1.5}
      />

      {nextNode != null &&
        node.parentLanes.map((pLane) => (
          <path
            key={`p-${pLane}`}
            d={
              pLane === node.lane
                ? `M ${cx(node.lane)} ${mid} L ${cx(pLane)} ${bot}`
                : `M ${cx(node.lane)} ${mid} C ${cx(node.lane)} ${mid + rowHeight / 3}, ${cx(pLane)} ${mid + rowHeight / 6}, ${cx(pLane)} ${bot}`
            }
            stroke={laneColor(pLane)}
            strokeWidth={1.5}
            fill="none"
          />
        ))}

      <circle cx={cx(node.lane)} cy={mid} r={DOT_R} fill={node.color} />
    </svg>
  )
}
