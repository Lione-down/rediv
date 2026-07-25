import type { CanvasNode } from '../../types/canvas'
import { findFirstUnoccupiedPosition } from './graph-placement'
import {
  resolveGenerationJobRuntimePresentations,
  resolveGenerationTaskRuntimePresentation,
  resolveLocalGenerationRuntimePresentation,
  type GenerationRuntimePresentation,
  type LocalGenerationRuntimeRequest,
} from './generation-runtime-presentation'
import type { GenerationJobStatus } from './generation-job-api'
import { getGenerationMediaType, createRegistryNodeDraft } from './node-registry'
import type { GenerationTask } from './project-resource-types'

export type GenerationResultMediaType = 'image' | 'video'

export interface GenerationResultPlacement {
  x: number
  y: number
  width: number
  height: number
}

export interface GenerationResultProjection extends GenerationResultPlacement {
  key: string
  sourceNodeId: string
  taskId: string | null
  mediaType: GenerationResultMediaType
  presentation: GenerationRuntimePresentation
}

interface ProjectionCandidate {
  key: string
  sourceNode: CanvasNode
  taskId: string | null
  mediaType: GenerationResultMediaType
  presentation: GenerationRuntimePresentation
  orderTime: number
}

function taskTime(task: GenerationTask) {
  const timestamp = Date.parse(task.created_at)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function isProjectionMediaType(value: GenerationTask['media_type']): value is GenerationResultMediaType {
  return value === 'image' || value === 'video'
}

function isStrictTask(
  task: GenerationTask,
  sourceNode: CanvasNode,
  projectId: string,
  canvasId: string,
) {
  return isProjectionMediaType(task.media_type) && task.project_id === projectId &&
    task.origin_canvas_id === canvasId && task.canvas_node_id === sourceNode.id &&
    getGenerationMediaType(sourceNode) === task.media_type
}

function hasMaterializedResult(nodes: readonly CanvasNode[], taskId: string) {
  return nodes.some((node) => node.type === 'result' && node.contentData?.source_task_id === taskId)
}

function virtualProjectionNode(projection: GenerationResultProjection): CanvasNode {
  return {
    id: `pending:${projection.key}`,
    type: 'result',
    title: projection.mediaType === 'video' ? '视频生成中' : '图片生成中',
    x: projection.x,
    y: projection.y,
    width: projection.width,
    height: projection.height,
    contentData: { subtype: projection.mediaType, serialization_version: 1 },
  }
}

export function resolveGenerationResultPlacement(
  sourceNode: CanvasNode,
  mediaType: GenerationResultMediaType,
  occupiedNodes: readonly CanvasNode[],
): GenerationResultPlacement {
  const draft = createRegistryNodeDraft('result', mediaType, {
    x: sourceNode.x + sourceNode.width + 96,
    y: sourceNode.y,
  })
  const position = findFirstUnoccupiedPosition(draft, draft, occupiedNodes, [sourceNode.id])
  return { ...position, width: draft.width, height: draft.height }
}

function projectionCandidates(
  nodes: readonly CanvasNode[],
  tasks: readonly GenerationTask[],
  localRequests: ReadonlyMap<string, LocalGenerationRuntimeRequest>,
  projectId: string,
  canvasId: string,
  includeTerminalTaskIds: ReadonlySet<string>,
) {
  const nodeOrder = new Map(nodes.map((node, index) => [node.id, index]))
  const candidates: ProjectionCandidate[] = []
  for (const sourceNode of nodes) {
    const mediaType = getGenerationMediaType(sourceNode)
    if (!mediaType) continue
    const strictTasks = tasks.filter((task) => isStrictTask(task, sourceNode, projectId, canvasId))
    const localRequest = localRequests.get(sourceNode.id)
    if (
      localRequest && localRequest.projectId === projectId && localRequest.canvasId === canvasId &&
      localRequest.mediaType === mediaType &&
      !strictTasks.some((task) => !localRequest.knownTaskIds.includes(task.id))
    ) {
      candidates.push({
        key: `local:${localRequest.id}`,
        sourceNode,
        taskId: null,
        mediaType,
        presentation: resolveLocalGenerationRuntimePresentation(localRequest),
        orderTime: localRequest.startedAt ?? Number.MAX_SAFE_INTEGER,
      })
    }
    for (const task of strictTasks) {
      if (
        hasMaterializedResult(nodes, task.id) ||
        (!includeTerminalTaskIds.has(task.id) && task.status !== 'queued' && task.status !== 'running')
      ) continue
      candidates.push({
        key: `task:${task.id}`,
        sourceNode,
        taskId: task.id,
        mediaType,
        presentation: resolveGenerationTaskRuntimePresentation(task),
        orderTime: taskTime(task),
      })
    }
  }
  return candidates.sort((left, right) => (
    left.orderTime - right.orderTime ||
    (nodeOrder.get(left.sourceNode.id) ?? 0) - (nodeOrder.get(right.sourceNode.id) ?? 0) ||
    left.key.localeCompare(right.key)
  ))
}

export function resolveGenerationResultProjections(
  nodes: readonly CanvasNode[],
  tasks: readonly GenerationTask[],
  localRequests: ReadonlyMap<string, LocalGenerationRuntimeRequest>,
  projectId: string,
  canvasId: string,
  includeTerminalTaskIds: ReadonlySet<string> = new Set(),
) {
  const occupiedNodes = [...nodes]
  const projections: GenerationResultProjection[] = []
  for (const candidate of projectionCandidates(
    nodes, tasks, localRequests, projectId, canvasId, includeTerminalTaskIds,
  )) {
    const placement = resolveGenerationResultPlacement(candidate.sourceNode, candidate.mediaType, occupiedNodes)
    const projection: GenerationResultProjection = {
      key: candidate.key,
      sourceNodeId: candidate.sourceNode.id,
      taskId: candidate.taskId,
      mediaType: candidate.mediaType,
      presentation: candidate.presentation,
      ...placement,
    }
    projections.push(projection)
    occupiedNodes.push(virtualProjectionNode(projection))
  }
  return projections
}

export function resolveGenerationJobResultProjections(
  nodes: readonly CanvasNode[],
  statuses: readonly GenerationJobStatus[],
) {
  const statusesByJobId = new Map(statuses.map((status) => [status.job_id, status]))
  const presentations = resolveGenerationJobRuntimePresentations(nodes, statuses)
  const occupiedNodes = [...nodes]
  const projections: GenerationResultProjection[] = []
  for (const sourceNode of nodes) {
    const jobId = sourceNode.contentData?.active_generation_job_id
    const mediaType = getGenerationMediaType(sourceNode)
    const boundMediaType = sourceNode.contentData?.active_generation_media_type
    if (
      typeof jobId !== 'string' || !jobId.trim() ||
      (mediaType !== 'image' && mediaType !== 'video') ||
      boundMediaType !== mediaType
    ) continue
    const status = statusesByJobId.get(jobId)
    const presentation = presentations.get(sourceNode.id)
    if (
      !status || !presentation || presentation.isTerminal ||
      status.node_id !== sourceNode.id || status.media_type !== mediaType ||
      hasMaterializedResult(nodes, jobId)
    ) continue
    const placement = resolveGenerationResultPlacement(sourceNode, mediaType, occupiedNodes)
    const projection: GenerationResultProjection = {
      key: `job:${jobId}`,
      sourceNodeId: sourceNode.id,
      taskId: jobId,
      mediaType,
      presentation,
      ...placement,
    }
    projections.push(projection)
    occupiedNodes.push(virtualProjectionNode(projection))
  }
  return projections
}

export function resolveTerminalGenerationResultPlacement(
  task: GenerationTask,
  nodes: readonly CanvasNode[],
  tasks: readonly GenerationTask[],
  localRequests: ReadonlyMap<string, LocalGenerationRuntimeRequest>,
  projectId: string,
  canvasId: string,
) {
  return resolveGenerationResultProjections(
    nodes, tasks, localRequests, projectId, canvasId, new Set([task.id]),
  ).find((projection) => projection.taskId === task.id) ?? null
}
