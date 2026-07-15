import type { ProjectGenerationTask } from './project-resource-types'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { resolveResultLineage } from './generation-lineage'

export type GenerationRunResultState = 'available' | 'missing' | 'ambiguous'

export interface ResolvedGenerationRun {
  sequence: number
  task: ProjectGenerationTask
  resultNodeId: string | null
  resultState: GenerationRunResultState
}

export interface ResolvedGenerationRunHistory {
  runs: ResolvedGenerationRun[]
  total: number
}

export interface GenerationRunGraph {
  connections: readonly CanvasConnection[]
  nodes: readonly CanvasNode[]
}

function timestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function resolveGenerationRunHistory(
  nodeId: string,
  tasks: readonly ProjectGenerationTask[],
  limit = 5,
  graph?: GenerationRunGraph,
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
  const runs = matching.map(({ task }, index) => {
    const resultNodeIds = task.status === 'succeeded' && graph
      ? graph.nodes.flatMap((resultNode) => {
        const lineage = resolveResultLineage(resultNode, graph.nodes, graph.connections)
        return lineage?.generationNodeId === normalizedNodeId && lineage.taskId === task.id ? [resultNode.id] : []
      })
      : []
    return {
      task,
      sequence: index + 1,
      resultNodeId: resultNodeIds.length === 1 ? resultNodeIds[0] : null,
      resultState: resultNodeIds.length === 1 ? 'available' as const : resultNodeIds.length > 1 ? 'ambiguous' as const : 'missing' as const,
    }
  }).reverse().slice(0, boundedLimit)
  return { runs, total }
}
