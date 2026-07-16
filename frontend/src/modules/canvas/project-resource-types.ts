import type { Asset } from '../../types/asset'
import type { Template } from '../template/types'

export type ProjectAsset = Asset
export type ProjectTemplate = Template
export type ProjectResourceTab = 'assets' | 'templates' | 'tasks'

export type GenerationTaskStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'timed_out'

export type GenerationTaskMediaType = 'text' | 'image' | 'video'
export type GenerationTaskProgressStage = 'queued' | 'provider' | 'persisting'

export interface GenerationTask {
  id: string
  user_id: string
  project_id: string | null
  origin_canvas_id: string | null
  canvas_node_id: string | null
  media_type: GenerationTaskMediaType
  provider: string
  model: string | null
  provider_request_id: string | null
  progress_percent?: number | null
  progress_stage?: GenerationTaskProgressStage | null
  status: GenerationTaskStatus
  duration_ms: number | null
  result_asset_id: string | null
  error_code: string | null
  error_message: string | null
  request_parameters?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type ProjectGenerationTask = GenerationTask

export interface GenerationTaskListResponse {
  items: GenerationTask[]
  total: number
  page: number
  page_size: number
}

export interface TemplateInstantiationOptions {
  baseRevision: number
  anchorX?: number
  anchorY?: number
  retryKey?: string
}
