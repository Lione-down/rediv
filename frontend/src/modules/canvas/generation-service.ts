import type { Asset } from '../../types/asset'
import type { QuotaBalance } from '../../types/auth'
import type { GenerationTask } from './project-resource-types'
import type { VisualAssetRecipeId } from './visual-asset-recipes'

export type GenerationMediaType = keyof QuotaBalance

export interface CanvasGenerationContext {
  mediaType: GenerationMediaType
  projectId: string
  originCanvasId: string
  canvasNodeId?: string | null
  prompt?: string
  imageIds?: string[]
  recipeId?: VisualAssetRecipeId
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
}

export async function requestCanvasGeneration(
  context: CanvasGenerationContext,
  quotaStore: GenerationQuotaStore,
  transport: GenerationTransport,
) {
  if (context.recipeId && (
    context.mediaType !== 'image' || context.prompt !== undefined || context.imageIds?.length !== 1
  )) throw new Error('Invalid visual asset recipe request')
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
      ...(context.recipeId ? { generation_recipe_id: context.recipeId } : {}),
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
