import type { CanvasNode } from '../../types/canvas'
import {
  generationStatusToNodeStatus,
  getGenerationMediaType,
  type PersistedGenerationStatus,
} from './node-registry'

export interface ActiveGenerationBinding {
  clientRequestId: string
  jobId?: string
  mediaType: 'text' | 'script' | 'image' | 'video'
}

export function applyGenerationNodeState(
  node: CanvasNode,
  status: PersistedGenerationStatus,
  taskId = '',
  isResultMaterialized = false,
  activeBinding?: ActiveGenerationBinding,
): CanvasNode {
  if (!getGenerationMediaType(node)) return node
  const contentData: Record<string, unknown> = { ...node.contentData, generation_status: status }
  if (taskId) contentData.generation_task_id = taskId
  else Reflect.deleteProperty(contentData, 'generation_task_id')
  if (isResultMaterialized && taskId) contentData.result_materialized_task_id = taskId
  if (activeBinding) {
    contentData.active_generation_client_request_id = activeBinding.clientRequestId
    contentData.active_generation_media_type = activeBinding.mediaType
    if (activeBinding.jobId) contentData.active_generation_job_id = activeBinding.jobId
    else Reflect.deleteProperty(contentData, 'active_generation_job_id')
  } else if (status === 'succeeded' || status === 'failed' || status === 'timed_out') {
    Reflect.deleteProperty(contentData, 'active_generation_client_request_id')
    Reflect.deleteProperty(contentData, 'active_generation_job_id')
    Reflect.deleteProperty(contentData, 'active_generation_media_type')
  }
  return {
    ...node,
    status: generationStatusToNodeStatus(status),
    contentData,
  }
}
