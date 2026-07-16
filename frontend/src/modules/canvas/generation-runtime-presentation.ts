import type { CanvasNode } from '../../types/canvas'
import { getGenerationMediaType } from './node-registry'
import type { GenerationTask, GenerationTaskStatus } from './project-resource-types'

export type GenerationRuntimePhase = 'submitting' | GenerationTaskStatus
export type GenerationRuntimeTone = 'progress' | 'success' | 'danger'

export interface LocalGenerationRuntimeRequest {
  id: string
  projectId: string
  canvasId: string
  nodeId: string
  mediaType: 'image' | 'video'
  knownTaskIds: readonly string[]
}

export interface GenerationRuntimePresentation {
  key: string
  nodeId: string
  phase: GenerationRuntimePhase
  label: string
  tone: GenerationRuntimeTone
  source: 'local' | 'task'
  taskId: string | null
  task: GenerationTask | null
  isTerminal: boolean
}

const PHASE_PRESENTATION: Record<GenerationRuntimePhase, {
  label: string
  tone: GenerationRuntimeTone
  isTerminal: boolean
}> = {
  submitting: { label: '正在提交', tone: 'progress', isTerminal: false },
  queued: { label: '排队中', tone: 'progress', isTerminal: false },
  running: { label: '模型生成中', tone: 'progress', isTerminal: false },
  succeeded: { label: '已完成', tone: 'success', isTerminal: true },
  failed: { label: '失败', tone: 'danger', isTerminal: true },
  timed_out: { label: '已超时', tone: 'danger', isTerminal: true },
}

function taskTime(task: GenerationTask) {
  const timestamp = Date.parse(task.created_at)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function newestTask(tasks: readonly GenerationTask[]) {
  return [...tasks].sort((left, right) => (
    taskTime(right) - taskTime(left) || right.id.localeCompare(left.id)
  ))[0] ?? null
}

function isStrictTask(
  task: GenerationTask,
  node: CanvasNode,
  projectId: string,
  canvasId: string,
) {
  const mediaType = getGenerationMediaType(node)
  return Boolean(mediaType) && task.project_id === projectId && task.origin_canvas_id === canvasId &&
    task.canvas_node_id === node.id && task.media_type === mediaType
}

function taskPresentation(task: GenerationTask): GenerationRuntimePresentation {
  const presentation = PHASE_PRESENTATION[task.status]
  return {
    key: `task:${task.id}:${task.status}:${task.updated_at}`,
    nodeId: task.canvas_node_id!,
    phase: task.status,
    label: presentation.label,
    tone: presentation.tone,
    source: 'task',
    taskId: task.id,
    task,
    isTerminal: presentation.isTerminal,
  }
}

function localPresentation(request: LocalGenerationRuntimeRequest): GenerationRuntimePresentation {
  const presentation = PHASE_PRESENTATION.submitting
  return {
    key: `local:${request.id}`,
    nodeId: request.nodeId,
    phase: 'submitting',
    label: presentation.label,
    tone: presentation.tone,
    source: 'local',
    taskId: null,
    task: null,
    isTerminal: false,
  }
}

export function resolveGenerationRuntimePresentations(
  nodes: readonly CanvasNode[],
  tasks: readonly GenerationTask[],
  localRequests: ReadonlyMap<string, LocalGenerationRuntimeRequest>,
  projectId: string,
  canvasId: string,
) {
  const presentations = new Map<string, GenerationRuntimePresentation>()
  for (const node of nodes) {
    const mediaType = getGenerationMediaType(node)
    if (!mediaType) continue
    const localRequest = localRequests.get(node.id)
    const knownTaskIds = new Set(localRequest?.knownTaskIds ?? [])
    const strictTasks = tasks.filter((task) => (
      isStrictTask(task, node, projectId, canvasId) && (!localRequest || !knownTaskIds.has(task.id))
    ))
    const durableTask = newestTask(strictTasks)
    if (durableTask) presentations.set(node.id, taskPresentation(durableTask))
    else if (
      localRequest && localRequest.projectId === projectId && localRequest.canvasId === canvasId &&
      localRequest.mediaType === mediaType
    ) {
      presentations.set(node.id, localPresentation(localRequest))
    }
  }
  return presentations
}

export function changedGenerationRuntimeNodeIds(
  previous: ReadonlyMap<string, GenerationRuntimePresentation>,
  next: ReadonlyMap<string, GenerationRuntimePresentation>,
) {
  const nodeIds = new Set([...previous.keys(), ...next.keys()])
  return [...nodeIds].filter((nodeId) => previous.get(nodeId)?.key !== next.get(nodeId)?.key).sort()
}
