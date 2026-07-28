import type { CanvasNode } from '../../types/canvas'
import { getGenerationMediaType } from './node-registry'
import type {
  GenerationTask,
  GenerationTaskProgressStage,
} from './project-resource-types'
import type {
  GenerationJobMediaType,
  GenerationJobStatus,
  GenerationJobStatusValue,
} from './generation-job-api'

export type GenerationRuntimePhase = 'submitting' | GenerationJobStatusValue
export type GenerationRuntimeTone = 'progress' | 'success' | 'danger'

export interface LocalGenerationRuntimeRequest {
  id: string
  projectId: string
  canvasId: string
  nodeId: string
  mediaType: 'image' | 'video'
  knownTaskIds: readonly string[]
  startedAt?: number
}

export interface GenerationRuntimePresentation {
  key: string
  nodeId: string
  phase: GenerationRuntimePhase
  label: string
  tone: GenerationRuntimeTone
  source: 'job' | 'local' | 'task'
  taskId: string | null
  task: GenerationTask | null
  isTerminal: boolean
  progressPercent: number | null
  progressStage: GenerationTaskProgressStage | null
  isIndeterminate: boolean
  error: string | null
}

export interface RestoredGenerationJobRuntime {
  jobId: string
  nodeId: string
  mediaType: GenerationJobMediaType
  phase: GenerationJobStatus['status']
  stage: GenerationJobStatus['stage']
  progress: number | null
  resultAssetId: string | null
  error: string | null
  version: number
  updatedAt: string
}

const PERSISTING_PRESENTATION = { label: '正在保存结果', tone: 'progress', isTerminal: false } as const
const RESULT_PROJECTION_PRESENTATION = {
  label: '正在显示结果',
  tone: 'progress',
  isTerminal: false,
} as const

export function normalizeGenerationProgressPercent(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null
}

export function formatGenerationProgressPercent(value: unknown) {
  const normalized = normalizeGenerationProgressPercent(value)
  if (normalized === null) return null
  return `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(normalized)}%`
}

export function formatGenerationFailureMessage(value: unknown) {
  const message = typeof value === 'string' ? value.trim() : ''
  if (
    !message ||
    message.includes('结果未扣费') ||
    message.includes('提交结果暂未确认') ||
    message.includes('正在按当前卡片恢复任务')
  ) return message
  return `${message}。结果未扣费，可在确认服务恢复后手动重试。`
}

export function resolveGenerationTaskProgressSummary(task: GenerationTask) {
  const percent = formatGenerationProgressPercent(task.progress_percent)
  if (task.status === 'succeeded') return percent ? `进度 ${percent}` : null
  if (task.status === 'failed' || task.status === 'timed_out') return percent ? `最后进度 ${percent}` : null
  const stage = task.progress_stage === 'queued'
    ? '排队中'
    : task.progress_stage === 'persisting' ? '正在保存结果' : '模型生成中'
  return `${stage} · ${percent ?? '未提供百分比'}`
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
  cancel_requested: { label: '正在取消', tone: 'progress', isTerminal: false },
  cancelled: { label: '已取消', tone: 'danger', isTerminal: true },
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

export function resolveGenerationTaskRuntimePresentation(task: GenerationTask): GenerationRuntimePresentation {
  const progressStage = task.progress_stage === 'queued' || task.progress_stage === 'provider' || task.progress_stage === 'persisting'
    ? task.progress_stage
    : null
  const progressPercent = normalizeGenerationProgressPercent(task.progress_percent)
  const presentation = task.status === 'running' && progressStage === 'queued'
    ? PHASE_PRESENTATION.queued
    : task.status === 'running' && progressStage === 'persisting'
      ? PERSISTING_PRESENTATION
      : PHASE_PRESENTATION[task.status]
  return {
    key: `task:${task.id}:${task.status}:${progressStage ?? 'legacy'}:${progressPercent ?? 'indeterminate'}:${task.updated_at}`,
    nodeId: task.canvas_node_id!,
    phase: task.status,
    label: presentation.label,
    tone: presentation.tone,
    source: 'task',
    taskId: task.id,
    task,
    isTerminal: presentation.isTerminal,
    progressPercent,
    progressStage,
    isIndeterminate: !presentation.isTerminal && progressPercent === null,
    error: task.error_message,
  }
}

export function resolveLocalGenerationRuntimePresentation(request: LocalGenerationRuntimeRequest): GenerationRuntimePresentation {
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
    progressPercent: null,
    progressStage: null,
    isIndeterminate: true,
    error: null,
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
    if (durableTask) presentations.set(node.id, resolveGenerationTaskRuntimePresentation(durableTask))
    else if (
      localRequest && localRequest.projectId === projectId && localRequest.canvasId === canvasId &&
      localRequest.mediaType === mediaType
    ) {
      presentations.set(node.id, resolveLocalGenerationRuntimePresentation(localRequest))
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

function nodeGenerationJobMediaType(node: CanvasNode): GenerationJobMediaType | null {
  const subtype = node.contentData?.subtype
  const boundMediaType = node.contentData?.active_generation_media_type
  if (boundMediaType === 'text' || boundMediaType === 'script' || boundMediaType === 'image' || boundMediaType === 'video') {
    return boundMediaType
  }
  if (subtype === 'text' || subtype === 'script' || subtype === 'image' || subtype === 'video') {
    return subtype
  }
  if (node.type === 'text') return 'text'
  if (node.type === 'script') return 'script'
  if (node.type === 'image') return 'image'
  if (node.type === 'video') return 'video'
  return getGenerationMediaType(node)
}

export function restoreGenerationJobRuntime(input: {
  projectId: string
  canvasId: string
  nodes: readonly CanvasNode[]
  statuses: readonly GenerationJobStatus[]
}) {
  const restored = new Map<string, RestoredGenerationJobRuntime>()
  if (!input.projectId.trim() || !input.canvasId.trim()) return restored
  const statusesByJobId = new Map(input.statuses.map((status) => [status.job_id, status]))
  for (const node of input.nodes) {
    const activeJobId = node.contentData?.active_generation_job_id
    if (typeof activeJobId !== 'string' || !activeJobId.trim()) continue
    const status = statusesByJobId.get(activeJobId)
    const mediaType = nodeGenerationJobMediaType(node)
    if (!status || status.node_id !== node.id || status.media_type !== mediaType || status.version < 1) continue
    restored.set(node.id, {
      jobId: status.job_id,
      nodeId: status.node_id,
      mediaType: status.media_type,
      phase: status.status,
      stage: status.stage,
      progress: status.progress,
      resultAssetId: status.result_asset_id,
      error: status.error,
      version: status.version,
      updatedAt: status.updated_at,
    })
  }
  return restored
}

export function resolveGenerationJobRuntimePresentations(
  nodes: readonly CanvasNode[],
  statuses: readonly GenerationJobStatus[],
) {
  const presentations = new Map<string, GenerationRuntimePresentation>()
  const restored = restoreGenerationJobRuntime({
    projectId: 'current-project',
    canvasId: 'current-canvas',
    nodes,
    statuses,
  })
  for (const runtime of restored.values()) {
    const presentationKey = [
      'job',
      runtime.jobId,
      runtime.version,
      runtime.phase,
      runtime.stage ?? 'none',
      runtime.progress ?? 'none',
    ].join(':')
    const phasePresentation = runtime.phase === 'succeeded'
      ? RESULT_PROJECTION_PRESENTATION
      : runtime.phase === 'running' && runtime.stage === 'queued'
      ? PHASE_PRESENTATION.queued
      : runtime.phase === 'running' && runtime.stage === 'persisting'
        ? PERSISTING_PRESENTATION
        : PHASE_PRESENTATION[runtime.phase]
    presentations.set(runtime.nodeId, {
      key: presentationKey,
      nodeId: runtime.nodeId,
      phase: runtime.phase,
      label: phasePresentation.label,
      tone: phasePresentation.tone,
      source: 'job',
      taskId: runtime.jobId,
      task: null,
      isTerminal: phasePresentation.isTerminal,
      progressPercent: normalizeGenerationProgressPercent(runtime.progress),
      progressStage: runtime.stage,
      isIndeterminate: !phasePresentation.isTerminal && runtime.progress === null,
      error: runtime.error,
    })
  }
  return presentations
}
