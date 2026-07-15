import type { ProjectGenerationTask } from './project-resource-types'

export interface ResolvedGenerationRun {
  sequence: number
  task: ProjectGenerationTask
}

export interface ResolvedGenerationRunHistory {
  runs: ResolvedGenerationRun[]
  total: number
}

function timestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function resolveGenerationRunHistory(
  nodeId: string,
  tasks: readonly ProjectGenerationTask[],
  limit = 5,
): ResolvedGenerationRunHistory {
  const normalizedNodeId = nodeId.trim()
  const boundedLimit = Math.max(0, Math.floor(Number.isFinite(limit) ? limit : 5))
  if (!normalizedNodeId || boundedLimit === 0) return { runs: [], total: 0 }
  const matching = tasks
    .map((task, sourceIndex) => ({ task, sourceIndex }))
    .filter(({ task }) => task.canvas_node_id === normalizedNodeId)
    .sort((left, right) => (
      timestamp(left.task.created_at) - timestamp(right.task.created_at) ||
      left.sourceIndex - right.sourceIndex
    ))
  const total = matching.length
  const runs = matching.map(({ task }, index) => ({ task, sequence: index + 1 })).reverse().slice(0, boundedLimit)
  return { runs, total }
}
