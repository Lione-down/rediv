import type { Asset } from '../../types/asset'
import type { QuotaBalance } from '../../types/auth'
import { IMAGE_OPERATIONS, type ImageOperationContract } from './image-operations'
import type { GenerationTask } from './project-resource-types'
import { parseGenerationCapabilities, type GenerationCapabilities, type VideoReferenceMode } from './generation-parameters'
import type { ShotControls } from './shot-controls'
import type { VisualAssetRecipeId, VisualAssetRecipeVersion } from './visual-asset-recipes'
import type { CinematicGenerationHandoff } from './cinematic-skills'
import type { ScriptAuthoringIntent, ScriptAuthoringLineage, ScriptAuthoringLocale } from './script-authoring'

export type GenerationMediaType = keyof QuotaBalance

export type CanvasGenerationErrorCode =
  | 'invalid_request'
  | 'unsupported_parameter'
  | 'provider_rejected'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'timeout'

const GENERATION_ERROR_CODES = new Set<CanvasGenerationErrorCode>([
  'invalid_request', 'unsupported_parameter', 'provider_rejected',
  'rate_limited', 'provider_unavailable', 'timeout',
])

const RETRYABLE_GENERATION_ERRORS = new Set<CanvasGenerationErrorCode>([
  'rate_limited', 'provider_unavailable', 'timeout',
])

export class CanvasGenerationError extends Error {
  readonly code: CanvasGenerationErrorCode
  readonly providerRequestId: string | null
  readonly retryable: boolean

  constructor(
    code: CanvasGenerationErrorCode,
    message: string,
    providerRequestId: string | null,
    retryable: boolean,
  ) {
    super(message)
    this.name = 'CanvasGenerationError'
    this.code = code
    this.providerRequestId = providerRequestId
    this.retryable = retryable
  }
}

export interface CanvasGenerationContext {
  mediaType: GenerationMediaType
  clientRequestId?: string
  projectId: string
  originCanvasId: string
  canvasNodeId?: string | null
  prompt?: string
  imageIds?: string[]
  aspectRatio?: string
  referenceMode?: VideoReferenceMode
  durationSeconds?: number
  recipeId?: VisualAssetRecipeId
  recipeVersion?: VisualAssetRecipeVersion
  imageOperation?: ImageOperationContract
  shotControls?: ShotControls
  cinematicHandoff?: CinematicGenerationHandoff
  scriptAuthoring?: {
    intent: ScriptAuthoringIntent
    locale: ScriptAuthoringLocale
    canvasRevision: number
    brief?: string
    sourceText?: string
    instruction?: string
    referenceAssetIds?: string[]
  }
}

export interface CanvasGenerationResponse {
  asset?: Asset
  content?: string
  url?: string
  generation_task: GenerationTask
  quotas: QuotaBalance
  quota_revision: number
  script_authoring?: ScriptAuthoringLineage | null
}

interface GenerationQuotaStore {
  quotas: QuotaBalance
  quotaRevision: number
  token?: string
  applyQuotaSnapshot(quotas: QuotaBalance, revision: number): boolean
}

interface GenerationTransport {
  post<T>(path: string, payload: unknown, config?: { timeout?: number; signal?: AbortSignal }): Promise<{ data: T }>
}

interface GenerationCapabilityTransport {
  get<T>(path: string): Promise<{ data: T }>
}

const GENERATION_ROUTES: Record<GenerationMediaType, string> = {
  text: '/api/text-generate',
  image: '/api/image-generate',
  video: '/api/video-generate',
}

export function createGenerationClientRequestId() {
  const id = globalThis.crypto?.randomUUID?.()
  if (!id) throw new Error('Current browser cannot create a secure generation request ID')
  return id
}

function assertGenerationResponseScope(
  context: CanvasGenerationContext,
  response: CanvasGenerationResponse,
) {
  const task = response.generation_task
  const expectedNodeId = context.canvasNodeId ?? null
  if (
    !task ||
    task.status !== 'succeeded' ||
    task.project_id !== context.projectId ||
    task.origin_canvas_id !== context.originCanvasId ||
    task.canvas_node_id !== expectedNodeId ||
    task.media_type !== context.mediaType ||
    (context.clientRequestId !== undefined && task.client_request_id !== context.clientRequestId)
  ) throw new Error('Generation response scope mismatch')
  const asset = response.asset
  if (!asset) throw new Error('Generation response scope mismatch')
  const expectedAssetType = context.mediaType === 'text' ? 'prompt' : context.mediaType
  if (
    asset.user_id !== task.user_id ||
    asset.project_id !== context.projectId ||
    asset.origin_canvas_id !== context.originCanvasId ||
    asset.canvas_node_id !== expectedNodeId ||
    asset.type !== expectedAssetType ||
    asset.source !== 'generation' ||
    asset.source_model !== task.model ||
    asset.source_task_id !== task.id ||
    task.result_asset_id !== asset.id ||
    asset.status !== 'active'
  ) throw new Error('Generation response scope mismatch')
  assertGenerationRequestParameters(context, task)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeGenerationFailure(error: unknown) {
  if (!isRecord(error)) return error
  const response = isRecord(error.response) ? error.response : null
  const data = response && isRecord(response.data) ? response.data : null
  const detail = data && isRecord(data.detail) ? data.detail : null
  const code = detail?.code
  if (typeof code !== 'string' || !GENERATION_ERROR_CODES.has(code as CanvasGenerationErrorCode)) return error
  const typedCode = code as CanvasGenerationErrorCode
  const providerMessage = typeof detail?.message === 'string' && detail.message.trim()
    ? detail.message.trim()
    : 'provider 未返回可用说明'
  const providerRequestId = typeof detail?.provider_request_id === 'string' && detail.provider_request_id.trim()
    ? detail.provider_request_id.trim()
    : null
  const retryable = RETRYABLE_GENERATION_ERRORS.has(typedCode) && detail?.retryable === true
  const prefix: Record<CanvasGenerationErrorCode, string> = {
    invalid_request: '生成请求无效',
    unsupported_parameter: '当前生成参数不受 Agnes 支持',
    provider_rejected: 'Agnes 拒绝了当前请求',
    rate_limited: 'Agnes 请求过于频繁',
    provider_unavailable: 'Agnes 当前不可用',
    timeout: 'Agnes 响应超时',
  }
  const nextAction = retryable
    ? '请稍后手动重试。'
    : typedCode === 'unsupported_parameter'
      ? '请修改参数后重试。'
      : '请修改输入后重试。'
  return new CanvasGenerationError(
    typedCode,
    `${prefix[typedCode]}：${providerMessage}。${nextAction}`,
    providerRequestId,
    retryable,
  )
}

function hasSameIds(value: unknown, expected: readonly string[]) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((item, index) => item === expected[index])
}

function assertGenerationRequestParameters(context: CanvasGenerationContext, task: GenerationTask) {
  const parameters = task.request_parameters
  if (context.mediaType === 'text') {
    if (context.scriptAuthoring) {
      const snapshot = isRecord(parameters) ? parameters.script_authoring : null
      if (!isRecord(snapshot) || snapshot.intent !== context.scriptAuthoring.intent ||
        snapshot.source_node_id !== context.canvasNodeId ||
        snapshot.canvas_revision !== context.scriptAuthoring.canvasRevision ||
        snapshot.locale !== context.scriptAuthoring.locale ||
        !hasSameIds(
          Array.isArray(snapshot.reference_asset_ids) ? snapshot.reference_asset_ids : [],
          context.scriptAuthoring.referenceAssetIds ?? [],
        )
      ) throw new Error('Generation response script authoring snapshot mismatch')
    } else if (context.cinematicHandoff) {
      const snapshot = isRecord(parameters) ? parameters.cinematic_skill : null
      if (!isRecord(snapshot) ||
        snapshot.request_digest !== context.cinematicHandoff.submitted_preflight.request_digest ||
        snapshot.skill_id !== context.cinematicHandoff.skill_id ||
        snapshot.canvas_revision !== context.cinematicHandoff.canvas_revision
      ) throw new Error('Generation response cinematic Skill snapshot mismatch')
    }
    return
  }
  const imageIds = context.imageIds ?? []
  if (
    !isRecord(parameters) || parameters.contract_version !== 1 ||
    parameters.media_type !== context.mediaType || !hasSameIds(parameters.image_ids, imageIds)
  ) throw new Error('Generation response parameter snapshot mismatch')
  if (context.cinematicHandoff) {
    const snapshot = parameters.cinematic_skill
    if (!isRecord(snapshot) ||
      snapshot.request_digest !== context.cinematicHandoff.submitted_preflight.request_digest ||
      snapshot.skill_id !== context.cinematicHandoff.skill_id ||
      snapshot.canvas_revision !== context.cinematicHandoff.canvas_revision
    ) throw new Error('Generation response cinematic Skill snapshot mismatch')
  } else if (parameters.cinematic_skill !== undefined) {
    throw new Error('Generation response cinematic Skill snapshot mismatch')
  }
  if (context.recipeId) {
    if (
      parameters.generation_recipe_id !== context.recipeId ||
      parameters.generation_recipe_version !== context.recipeVersion ||
      parameters.aspect_ratio !== '4:3'
    ) throw new Error('Generation response parameter snapshot mismatch')
    return
  }
  if (context.mediaType === 'image') {
    if (!context.aspectRatio || parameters.aspect_ratio !== context.aspectRatio) {
      throw new Error('Generation response parameter snapshot mismatch')
    }
    if (context.imageOperation) {
      if (JSON.stringify(parameters.image_operation) !== JSON.stringify(context.imageOperation)) {
        throw new Error('Generation response parameter snapshot mismatch')
      }
    } else if (parameters.image_operation !== undefined) {
      throw new Error('Generation response parameter snapshot mismatch')
    }
    if (context.shotControls) {
      if (JSON.stringify(parameters.shot_controls) !== JSON.stringify(context.shotControls)) {
        throw new Error('Generation response parameter snapshot mismatch')
      }
    } else if (parameters.shot_controls !== undefined) {
      throw new Error('Generation response parameter snapshot mismatch')
    }
    return
  }
  if (
    !context.referenceMode || !context.durationSeconds ||
    parameters.reference_mode !== context.referenceMode ||
    parameters.duration_seconds !== context.durationSeconds
  ) throw new Error('Generation response parameter snapshot mismatch')
  if (context.shotControls) {
    if (JSON.stringify(parameters.shot_controls) !== JSON.stringify(context.shotControls)) {
      throw new Error('Generation response parameter snapshot mismatch')
    }
  } else if (parameters.shot_controls !== undefined) {
    throw new Error('Generation response parameter snapshot mismatch')
  }
}

export async function loadGenerationCapabilities(transport: GenerationCapabilityTransport) {
  const response = await transport.get<GenerationCapabilities>('/api/generation-capabilities')
  return parseGenerationCapabilities(response.data)
}

export async function requestCanvasGeneration(
  context: CanvasGenerationContext,
  quotaStore: GenerationQuotaStore,
  transport: GenerationTransport,
  signal?: AbortSignal,
) {
  const prompt = context.prompt?.trim()
  const scriptAuthoring = context.scriptAuthoring
  const operationDefinition = context.imageOperation
    ? IMAGE_OPERATIONS[context.imageOperation.id]
    : null
  if (context.imageOperation && (
    context.mediaType !== 'image' || !operationDefinition || operationDefinition.execution !== 'provider'
  )) throw new Error('Invalid image operation request')
  if (context.shotControls && (
    (context.mediaType === 'image' && (context.recipeId || context.imageOperation)) ||
    context.mediaType === 'text'
  )) throw new Error('Invalid shot control request')
  if (context.recipeId && (
    context.mediaType !== 'image' || context.prompt !== undefined || context.imageIds?.length !== 1 ||
    context.aspectRatio !== undefined || context.imageOperation !== undefined
  )) throw new Error('Invalid visual asset recipe request')
  if (Boolean(context.recipeId) !== Boolean(context.recipeVersion)) throw new Error('Invalid visual asset recipe request')
  if (!context.recipeId && !prompt && !scriptAuthoring && (!operationDefinition || operationDefinition.requiresPrompt)) {
    throw new Error('Generation prompt is required')
  }
  if (operationDefinition?.requiresPrompt !== undefined && operationDefinition.requiresPrompt !== Boolean(prompt)) {
    throw new Error('Invalid image operation prompt')
  }
  const authSessionToken = quotaStore.token
  let response: { data: CanvasGenerationResponse }
  try {
    response = await transport.post<CanvasGenerationResponse>(
      GENERATION_ROUTES[context.mediaType],
      {
        ...(context.clientRequestId ? { client_request_id: context.clientRequestId } : {}),
        project_id: context.projectId,
        origin_canvas_id: context.originCanvasId,
        canvas_node_id: context.canvasNodeId ?? null,
        ...(prompt ? { prompt } : {}),
        ...(context.imageIds?.length ? { image_ids: context.imageIds } : {}),
        ...(context.aspectRatio ? { aspect_ratio: context.aspectRatio } : {}),
        ...(context.referenceMode ? { reference_mode: context.referenceMode } : {}),
        ...(context.durationSeconds ? { duration_seconds: context.durationSeconds } : {}),
        ...(context.recipeId ? { generation_recipe_id: context.recipeId } : {}),
        ...(context.recipeVersion ? { generation_recipe_version: context.recipeVersion } : {}),
        ...(context.imageOperation ? { image_operation: context.imageOperation } : {}),
        ...(context.shotControls ? { shot_controls: context.shotControls } : {}),
        ...(context.cinematicHandoff ? { cinematic_handoff: context.cinematicHandoff } : {}),
        ...(scriptAuthoring ? {
          intent: scriptAuthoring.intent,
          locale: scriptAuthoring.locale,
          canvas_revision: scriptAuthoring.canvasRevision,
          ...(scriptAuthoring.brief ? { brief: scriptAuthoring.brief } : {}),
          ...(scriptAuthoring.sourceText ? { source_text: scriptAuthoring.sourceText } : {}),
          ...(scriptAuthoring.instruction ? { instruction: scriptAuthoring.instruction } : {}),
          ...(scriptAuthoring.referenceAssetIds?.length ? { reference_asset_ids: scriptAuthoring.referenceAssetIds } : {}),
        } : {}),
      },
      { timeout: 0, ...(signal ? { signal } : {}) },
    )
  } catch (error) {
    throw normalizeGenerationFailure(error)
  }
  if (quotaStore.token !== authSessionToken) {
    throw new Error('Generation auth session changed')
  }
  assertGenerationResponseScope(context, response.data)
  if (scriptAuthoring) {
    const lineage = response.data.script_authoring
    if (!lineage || lineage.contract_version !== 1 || lineage.intent !== scriptAuthoring.intent ||
      lineage.locale !== scriptAuthoring.locale || lineage.source_node_id !== context.canvasNodeId ||
      lineage.source_task_id !== response.data.generation_task.id ||
      lineage.source_model !== response.data.generation_task.model ||
      lineage.canvas_revision !== scriptAuthoring.canvasRevision
    ) throw new Error('Generation response script authoring lineage mismatch')
  }
  quotaStore.applyQuotaSnapshot(response.data.quotas, response.data.quota_revision)
  return response.data
}
