import type { Asset } from '../../types/asset'
import type { QuotaBalance } from '../../types/auth'
import type { GenerationTask } from './project-resource-types'

export type GenerationMediaType = keyof QuotaBalance

export interface CanvasGenerationContext {
  mediaType: GenerationMediaType
  projectId: string
  originCanvasId: string
  canvasNodeId?: string | null
  prompt: string
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
  post<T>(path: string, payload: unknown): Promise<{ data: T }>
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
  const authSessionToken = quotaStore.token
  const response = await transport.post<CanvasGenerationResponse>(
    GENERATION_ROUTES[context.mediaType],
    {
      project_id: context.projectId,
      origin_canvas_id: context.originCanvasId,
      canvas_node_id: context.canvasNodeId ?? null,
      prompt: context.prompt,
    },
  )
  if (quotaStore.token !== authSessionToken) {
    throw new Error('Generation auth session changed')
  }
  assertGenerationResponseScope(context, response.data)
  quotaStore.applyQuotaSnapshot(response.data.quotas, response.data.quota_revision)
  return response.data
}
