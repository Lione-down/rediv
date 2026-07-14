import type { CanvasNode } from '../../types/canvas'
import {
  generationStatusToNodeStatus,
  getGenerationMediaType,
  type PersistedGenerationStatus,
} from './node-registry'

export function applyGenerationNodeState(
  node: CanvasNode,
  status: PersistedGenerationStatus,
  taskId = '',
  isResultMaterialized = false,
): CanvasNode {
  if (!getGenerationMediaType(node)) return node
  const contentData: Record<string, unknown> = { ...node.contentData, generation_status: status }
  if (taskId) contentData.generation_task_id = taskId
  else Reflect.deleteProperty(contentData, 'generation_task_id')
  if (isResultMaterialized && taskId) contentData.result_materialized_task_id = taskId
  return {
    ...node,
    status: generationStatusToNodeStatus(status),
    contentData,
  }
}
