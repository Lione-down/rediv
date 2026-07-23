import type { CanvasNode } from '../../types/canvas'
import {
  fetchGenerationJobDelta,
  fetchGenerationJobResult,
  fetchGenerationJobStatus,
  type GenerationJobMediaType,
  type GenerationJobReadTransport,
  type GenerationJobStatus,
} from './generation-job-api'
import {
  type GenerationJobScope,
  type createGenerationJobStore,
} from './generation-job-store'

type GenerationJobStore = ReturnType<typeof createGenerationJobStore>

interface PersistedJobBinding {
  jobId: string
  mediaType: GenerationJobMediaType
  nodeId: string
}

function persistedJobBindings(nodes: readonly CanvasNode[]) {
  const bindings: PersistedJobBinding[] = []
  for (const node of nodes) {
    const jobId = node.contentData?.active_generation_job_id
    const subtype = node.contentData?.subtype
    const boundMediaType = node.contentData?.active_generation_media_type
    let mediaType: GenerationJobMediaType | null = null
    if (boundMediaType === 'text' || boundMediaType === 'script' || boundMediaType === 'image' || boundMediaType === 'video') {
      mediaType = boundMediaType
    } else if (subtype === 'text' || subtype === 'script' || subtype === 'image' || subtype === 'video') {
      mediaType = subtype
    } else if (node.type === 'text') mediaType = 'text'
    else if (node.type === 'script') mediaType = 'script'
    else if (node.type === 'image') mediaType = 'image'
    else if (node.type === 'video') mediaType = 'video'
    if (typeof jobId === 'string' && jobId.trim() && mediaType) {
      bindings.push({ jobId: jobId.trim(), mediaType, nodeId: node.id })
    }
  }
  return bindings
}

function matchesBinding(
  binding: PersistedJobBinding,
  status: { job_id: string; media_type: GenerationJobMediaType; node_id: string },
) {
  return status.job_id === binding.jobId &&
    status.node_id === binding.nodeId &&
    status.media_type === binding.mediaType
}

const TERMINAL_JOB_STATUSES = new Set(['succeeded', 'failed', 'timed_out', 'cancelled'])

export function hasGenerationJobPollingWork(
  nodes: readonly CanvasNode[],
  statuses: ReadonlyMap<string, GenerationJobStatus>,
) {
  return persistedJobBindings(nodes).some((binding) => {
    const status = statuses.get(binding.jobId)
    return !status || (
      matchesBinding(binding, status) &&
      !TERMINAL_JOB_STATUSES.has(status.status)
    )
  })
}

export async function syncGenerationJobs(input: {
  projectId: string
  canvasId: string
  nodes: readonly CanvasNode[]
  store: GenerationJobStore
  transport: GenerationJobReadTransport
}) {
  const scope: GenerationJobScope = {
    projectId: input.projectId,
    canvasId: input.canvasId,
  }
  const bindings = persistedJobBindings(input.nodes)
  let current = input.store.snapshot(scope)
  for (const binding of bindings) {
    if (current.statuses.has(binding.jobId)) continue
    const status = await fetchGenerationJobStatus(binding.jobId, input.transport)
    if (matchesBinding(binding, status)) input.store.applyStatuses(scope, [status])
  }

  current = input.store.snapshot(scope)
  const page = await fetchGenerationJobDelta({
    projectId: scope.projectId,
    canvasId: scope.canvasId,
    after: current.cursor,
    limit: 25,
  }, input.transport)
  input.store.applyDelta(scope, page)

  current = input.store.snapshot(scope)
  for (const binding of bindings) {
    const status = current.statuses.get(binding.jobId)
    const existingResult = current.results.get(binding.jobId)
    if (
      !status || status.status !== 'succeeded' || !matchesBinding(binding, status) ||
      (existingResult && existingResult.version >= status.version)
    ) continue
    const result = await fetchGenerationJobResult(binding.jobId, input.transport)
    if (result.job_id === binding.jobId && result.node_id === binding.nodeId) {
      input.store.applyResult(scope, result)
    }
  }
  return input.store.snapshot(scope)
}
