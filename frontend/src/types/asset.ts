export type AssetType = 'prompt' | 'image' | 'video' | 'audio'
export type ProjectAssetUploadType = Exclude<AssetType, 'prompt'>

export interface Asset {
  id: string
  user_id: string
  project_id: string | null
  origin_canvas_id: string | null
  canvas_node_id: string | null
  type: AssetType
  url: string | null
  content_text: string | null
  source: string
  source_model: string | null
  source_task_id: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface AssetListParams {
  asset_type?: string
  project_id?: string
  origin_canvas_id?: string
  page?: number
  page_size?: number
}

export interface AssetListQuery extends AssetListParams {
  page: number
  page_size: number
}

export interface AssetListResponse {
  items: Asset[]
  total: number
  page: number
  page_size: number
}

export type AssetCreatePayload = Pick<Asset, 'url' | 'content_text'> & {
  type: AssetType
  project_id?: string | null
  origin_canvas_id?: string | null
}
