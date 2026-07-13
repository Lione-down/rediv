import type { Asset } from '../../types/asset'
import type { QuotaBalance } from '../../types/auth'

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
  generation_task?: Record<string, unknown>
  quotas: QuotaBalance
  quota_revision: number
}

interface GenerationQuotaStore {
  quotas: QuotaBalance
  quotaRevision: number
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

export async function requestCanvasGeneration(
  context: CanvasGenerationContext,
  quotaStore: GenerationQuotaStore,
  transport: GenerationTransport,
) {
  const response = await transport.post<CanvasGenerationResponse>(
    GENERATION_ROUTES[context.mediaType],
    {
      project_id: context.projectId,
      origin_canvas_id: context.originCanvasId,
      canvas_node_id: context.canvasNodeId ?? null,
      prompt: context.prompt,
    },
  )
  quotaStore.applyQuotaSnapshot(response.data.quotas, response.data.quota_revision)
  return response.data
}
