import type { Asset } from '../../types/asset'
import type { QuotaBalance } from '../../types/auth'
import type { GenerationTask } from './project-resource-types'
import { parseGenerationCapabilities, type GenerationCapabilities, type VideoReferenceMode } from './generation-parameters'
import type { VisualAssetRecipeId, VisualAssetRecipeVersion } from './visual-asset-recipes'

export type GenerationMediaType = keyof QuotaBalance

export interface CanvasGenerationContext {
  mediaType: GenerationMediaType
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
}

export interface CanvasGenerationResponse {
  asset?: Asset
  content?: string
  url?: string
  generation_task: GenerationTask
  quotas: QuotaBalance
  quota_revision: number
}

interface GenerationQuotaStore {
  quotas: QuotaBalance
  quotaRevision: number
  token?: string
  applyQuotaSnapshot(quotas: QuotaBalance, revision: number): boolean
}

interface GenerationTransport {
  post<T>(path: string, payload: unknown, config?: { timeout?: number }): Promise<{ data: T }>
}

interface GenerationCapabilityTransport {
  get<T>(path: string): Promise<{ data: T }>
}

const GENERATION_ROUTES: Record<GenerationMediaType, string> = {
  text: '/api/text-generate',
  image: '/api/image-generate',
  video: '/api/video-generate',
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
    task.media_type !== context.mediaType
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

function hasSameIds(value: unknown, expected: readonly string[]) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((item, index) => item === expected[index])
}

function assertGenerationRequestParameters(context: CanvasGenerationContext, task: GenerationTask) {
  if (context.mediaType === 'text') return
  const parameters = task.request_parameters
  const imageIds = context.imageIds ?? []
  if (
    !isRecord(parameters) || parameters.contract_version !== 1 ||
    parameters.media_type !== context.mediaType || !hasSameIds(parameters.image_ids, imageIds)
  ) throw new Error('Generation response parameter snapshot mismatch')
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
    return
  }
  if (
    !context.referenceMode || !context.durationSeconds ||
    parameters.reference_mode !== context.referenceMode ||
    parameters.duration_seconds !== context.durationSeconds
  ) throw new Error('Generation response parameter snapshot mismatch')
}

export async function loadGenerationCapabilities(transport: GenerationCapabilityTransport) {
  const response = await transport.get<GenerationCapabilities>('/api/generation-capabilities')
  return parseGenerationCapabilities(response.data)
}

export async function requestCanvasGeneration(
  context: CanvasGenerationContext,
  quotaStore: GenerationQuotaStore,
  transport: GenerationTransport,
) {
  if (context.recipeId && (
    context.mediaType !== 'image' || context.prompt !== undefined || context.imageIds?.length !== 1 ||
    context.aspectRatio !== undefined
  )) throw new Error('Invalid visual asset recipe request')
  if (Boolean(context.recipeId) !== Boolean(context.recipeVersion)) throw new Error('Invalid visual asset recipe request')
  if (!context.recipeId && !context.prompt) throw new Error('Generation prompt is required')
  const authSessionToken = quotaStore.token
  const response = await transport.post<CanvasGenerationResponse>(
    GENERATION_ROUTES[context.mediaType],
    {
      project_id: context.projectId,
      origin_canvas_id: context.originCanvasId,
      canvas_node_id: context.canvasNodeId ?? null,
      ...(context.prompt ? { prompt: context.prompt } : {}),
      ...(context.imageIds?.length ? { image_ids: context.imageIds } : {}),
      ...(context.aspectRatio ? { aspect_ratio: context.aspectRatio } : {}),
      ...(context.referenceMode ? { reference_mode: context.referenceMode } : {}),
      ...(context.durationSeconds ? { duration_seconds: context.durationSeconds } : {}),
      ...(context.recipeId ? { generation_recipe_id: context.recipeId } : {}),
      ...(context.recipeVersion ? { generation_recipe_version: context.recipeVersion } : {}),
    },
    { timeout: 0 },
  )
  if (quotaStore.token !== authSessionToken) {
    throw new Error('Generation auth session changed')
  }
  assertGenerationResponseScope(context, response.data)
  quotaStore.applyQuotaSnapshot(response.data.quotas, response.data.quota_revision)
  return response.data
}
