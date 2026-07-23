export type GenerationJobMediaType = 'text' | 'script' | 'image' | 'video'
export type GenerationJobStatusValue =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'timed_out'
  | 'cancel_requested'
  | 'cancelled'

export interface GenerationJobSubmitInput {
  clientRequestId: string
  projectId: string
  canvasId: string
  nodeId: string
  mediaType: GenerationJobMediaType
  modelId: string
  input: Record<string, unknown>
}

export interface GenerationJobSubmitReceipt {
  job_id: string
  project_id: string
  canvas_id: string
  node_id: string
  media_type: GenerationJobMediaType
  status: GenerationJobStatusValue
  model_id: string
  quota_revision?: number | null
  version: number
}

export interface GenerationJobStatus {
  job_id: string
  node_id: string
  media_type: GenerationJobMediaType
  status: GenerationJobStatusValue
  stage: 'queued' | 'provider' | 'persisting' | null
  progress: number | null
  error: string | null
  result_asset_id: string | null
  version: number
  updated_at: string
}

export interface GenerationJobTransport {
  post(path: string, payload: unknown): Promise<{ data: Record<string, unknown> }>
}

export interface GenerationJobReadTransport {
  get(
    path: string,
    config?: { params?: Record<string, unknown> },
  ): Promise<{ data: Record<string, unknown> }>
}

export interface GenerationJobDeltaPage {
  items: GenerationJobStatus[]
  next_cursor: string | null
}

export type GenerationJobResultValue =
  | { media_type: 'text' | 'script'; content: string }
  | { asset_id: string; media_type: 'image' | 'video'; url: string }

export interface GenerationJobResult {
  job_id: string
  node_id: string
  result: GenerationJobResultValue
  version: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string) {
  const allowedKeys = new Set(allowed)
  const unexpected = Object.keys(value).find((key) => !allowedKeys.has(key))
  if (unexpected) throw new TypeError(`${label} has unexpected field: ${unexpected}.`)
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`Generation job receipt ${field} is invalid.`)
  }
  return value
}

const MEDIA_TYPES = new Set<GenerationJobMediaType>(['text', 'script', 'image', 'video'])
const STATUS_VALUES = new Set<GenerationJobStatusValue>([
  'queued',
  'running',
  'succeeded',
  'failed',
  'timed_out',
  'cancel_requested',
  'cancelled',
])
const STATUS_STAGES = new Set(['queued', 'provider', 'persisting'])

export function parseGenerationJobSubmitReceipt(value: unknown): GenerationJobSubmitReceipt {
  if (!isRecord(value)) throw new TypeError('Generation job receipt is invalid.')
  assertExactKeys(value, [
    'job_id', 'project_id', 'canvas_id', 'node_id', 'media_type', 'status',
    'model_id', 'quota_revision', 'version',
  ], 'Generation job receipt')
  const mediaType = requiredString(value.media_type, 'media_type')
  const status = requiredString(value.status, 'status')
  if (!MEDIA_TYPES.has(mediaType as GenerationJobMediaType)) {
    throw new TypeError('Generation job receipt media_type is invalid.')
  }
  if (!STATUS_VALUES.has(status as GenerationJobStatusValue)) {
    throw new TypeError('Generation job receipt status is invalid.')
  }
  if (!Number.isSafeInteger(value.version) || Number(value.version) < 1) {
    throw new TypeError('Generation job receipt version is invalid.')
  }
  if (
    value.quota_revision !== undefined && value.quota_revision !== null &&
    (!Number.isSafeInteger(value.quota_revision) || Number(value.quota_revision) < 0)
  ) throw new TypeError('Generation job receipt quota_revision is invalid.')
  return {
    job_id: requiredString(value.job_id, 'job_id'),
    project_id: requiredString(value.project_id, 'project_id'),
    canvas_id: requiredString(value.canvas_id, 'canvas_id'),
    node_id: requiredString(value.node_id, 'node_id'),
    media_type: mediaType as GenerationJobMediaType,
    status: status as GenerationJobStatusValue,
    model_id: requiredString(value.model_id, 'model_id'),
    ...(value.quota_revision !== undefined ? { quota_revision: value.quota_revision as number | null } : {}),
    version: Number(value.version),
  }
}

export function parseGenerationJobStatus(value: unknown): GenerationJobStatus {
  if (!isRecord(value)) throw new TypeError('Generation job status is invalid.')
  assertExactKeys(value, [
    'job_id', 'node_id', 'media_type', 'status', 'stage', 'progress', 'error',
    'result_asset_id', 'version', 'updated_at',
  ], 'Generation job status')
  const mediaType = requiredString(value.media_type, 'media_type')
  const status = requiredString(value.status, 'status')
  if (!MEDIA_TYPES.has(mediaType as GenerationJobMediaType)) {
    throw new TypeError('Generation job status media_type is invalid.')
  }
  if (!STATUS_VALUES.has(status as GenerationJobStatusValue)) {
    throw new TypeError('Generation job status status is invalid.')
  }
  if (value.stage !== null && (typeof value.stage !== 'string' || !STATUS_STAGES.has(value.stage))) {
    throw new TypeError('Generation job status stage is invalid.')
  }
  if (
    value.progress !== null &&
    (
      typeof value.progress !== 'number' ||
      !Number.isFinite(value.progress) ||
      value.progress < 0 ||
      value.progress > 100
    )
  ) throw new TypeError('Generation job status progress is invalid.')
  if (value.error !== null && typeof value.error !== 'string') {
    throw new TypeError('Generation job status error is invalid.')
  }
  if (value.result_asset_id !== null && (typeof value.result_asset_id !== 'string' || !value.result_asset_id.trim())) {
    throw new TypeError('Generation job status result_asset_id is invalid.')
  }
  if (!Number.isSafeInteger(value.version) || Number(value.version) < 1) {
    throw new TypeError('Generation job status version is invalid.')
  }
  const updatedAt = requiredString(value.updated_at, 'updated_at')
  if (!Number.isFinite(Date.parse(updatedAt))) {
    throw new TypeError('Generation job status updated_at is invalid.')
  }
  return {
    job_id: requiredString(value.job_id, 'job_id'),
    node_id: requiredString(value.node_id, 'node_id'),
    media_type: mediaType as GenerationJobMediaType,
    status: status as GenerationJobStatusValue,
    stage: value.stage as GenerationJobStatus['stage'],
    progress: value.progress as number | null,
    error: value.error as string | null,
    result_asset_id: value.result_asset_id as string | null,
    version: Number(value.version),
    updated_at: updatedAt,
  }
}

export function parseGenerationJobDeltaPage(value: unknown): GenerationJobDeltaPage {
  if (!isRecord(value)) throw new TypeError('Generation job delta page is invalid.')
  assertExactKeys(value, ['items', 'next_cursor'], 'Generation job delta page')
  if (!Array.isArray(value.items) || value.items.length > 100) {
    throw new TypeError('Generation job delta page items are invalid.')
  }
  if (
    value.next_cursor !== null &&
    (typeof value.next_cursor !== 'string' || !value.next_cursor.trim())
  ) throw new TypeError('Generation job delta page next_cursor is invalid.')
  return {
    items: value.items.map(parseGenerationJobStatus),
    next_cursor: value.next_cursor as string | null,
  }
}

export function parseGenerationJobResult(value: unknown): GenerationJobResult {
  if (!isRecord(value)) throw new TypeError('Generation job result is invalid.')
  assertExactKeys(value, ['job_id', 'node_id', 'result', 'version'], 'Generation job result')
  if (!isRecord(value.result)) throw new TypeError('Generation job result payload is invalid.')
  const mediaType = requiredString(value.result.media_type, 'result.media_type')
  let result: GenerationJobResultValue
  if (mediaType === 'text' || mediaType === 'script') {
    assertExactKeys(value.result, ['media_type', 'content'], 'Generation job text result')
    if (typeof value.result.content !== 'string') {
      throw new TypeError('Generation job result content is invalid.')
    }
    result = { media_type: mediaType, content: value.result.content }
  } else if (mediaType === 'image' || mediaType === 'video') {
    assertExactKeys(value.result, ['asset_id', 'media_type', 'url'], 'Generation job media result')
    result = {
      asset_id: requiredString(value.result.asset_id, 'result.asset_id'),
      media_type: mediaType,
      url: requiredString(value.result.url, 'result.url'),
    }
  } else {
    throw new TypeError('Generation job result media_type is invalid.')
  }
  if (!Number.isSafeInteger(value.version) || Number(value.version) < 1) {
    throw new TypeError('Generation job result version is invalid.')
  }
  return {
    job_id: requiredString(value.job_id, 'job_id'),
    node_id: requiredString(value.node_id, 'node_id'),
    result,
    version: Number(value.version),
  }
}

export async function submitGenerationJobRequest(
  input: GenerationJobSubmitInput,
  transport: GenerationJobTransport,
) {
  const projectId = requiredString(input.projectId?.trim(), 'project_id')
  const canvasId = requiredString(input.canvasId?.trim(), 'canvas_id')
  const nodeId = requiredString(input.nodeId?.trim(), 'node_id')
  const modelId = requiredString(input.modelId?.trim(), 'model_id')
  const response = await transport.post('/api/v2/generation-jobs', {
    client_request_id: input.clientRequestId,
    project_id: projectId,
    canvas_id: canvasId,
    node_id: nodeId,
    media_type: input.mediaType,
    provider_id: 'agnes',
    model_id: modelId,
    input: input.input,
  })
  const receipt = parseGenerationJobSubmitReceipt(response.data)
  if (
    receipt.project_id !== projectId ||
    receipt.canvas_id !== canvasId ||
    receipt.node_id !== nodeId ||
    receipt.media_type !== input.mediaType ||
    receipt.model_id !== modelId
  ) throw new Error('Generation job receipt scope mismatch.')
  return receipt
}

export async function fetchGenerationJobDelta(
  input: {
    projectId: string
    canvasId: string
    after?: string | null
    limit?: number
  },
  transport: GenerationJobReadTransport,
) {
  const projectId = requiredString(input.projectId?.trim(), 'project_id')
  const canvasId = requiredString(input.canvasId?.trim(), 'canvas_id')
  const limit = input.limit ?? 25
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new TypeError('Generation job delta limit is invalid.')
  }
  const response = await transport.get(
    `/api/v2/projects/${encodeURIComponent(projectId)}/generation-jobs`,
    {
      params: {
        canvas_id: canvasId,
        ...(input.after ? { after: input.after } : {}),
        limit,
      },
    },
  )
  return parseGenerationJobDeltaPage(response.data)
}

export async function fetchGenerationJobStatus(
  jobId: string,
  transport: GenerationJobReadTransport,
) {
  const response = await transport.get(
    `/api/v2/generation-jobs/${encodeURIComponent(requiredString(jobId?.trim(), 'job_id'))}`,
  )
  return parseGenerationJobStatus(response.data)
}

export async function fetchGenerationJobResult(
  jobId: string,
  transport: GenerationJobReadTransport,
) {
  const response = await transport.get(
    `/api/v2/generation-jobs/${encodeURIComponent(requiredString(jobId?.trim(), 'job_id'))}/result`,
  )
  return parseGenerationJobResult(response.data)
}
