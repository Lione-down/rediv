export type CanvasStatus = 'active' | 'archived'

export interface CanvasMetadataDto {
  id: string
  project_id: string
  name: string
  sort_order: number
  status: CanvasStatus
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
  graph_revision: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CanvasListResponse {
  items: CanvasMetadataDto[]
  order_revision: number
}

export interface CanvasMutationResponse {
  item: CanvasMetadataDto
  order_revision: number
}

export interface CanvasCreatePayload {
  name: string
  base_order_revision: number
}

export interface CanvasRenamePayload {
  name: string
}

export interface CanvasArchivePayload {
  status: 'archived'
  base_order_revision: number
}

export interface CanvasReorderPayload {
  base_order_revision: number
  ordered_canvas_ids: string[]
}

export interface CanvasDuplicatePayload {
  base_order_revision: number
  name?: string
}

export type CanvasNodeContentDto = Record<string, unknown>

export interface CanvasNodeDto {
  id: string
  project_id: string
  canvas_id: string
  node_type: string
  content: CanvasNodeContentDto
  position_x: number
  position_y: number
  width: number
  height: number
  status: string
  created_at: string
  updated_at: string
}

export interface CanvasNodeListResponse {
  items: CanvasNodeDto[]
  total: number
}

export interface CanvasNodeCreatePayload {
  node_type: string
  content: CanvasNodeContentDto
  position_x: number
  position_y: number
  width: number
  height: number
}

export type CanvasNodeUpdatePayload = Partial<CanvasNodeCreatePayload> & {
  status?: string
}

export interface CanvasConnectionDto {
  id: string
  project_id: string
  canvas_id: string
  source_node_id: string
  source_port: string
  target_node_id: string
  target_port: string
  status: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CanvasConnectionListResponse {
  items: CanvasConnectionDto[]
  total: number
}

export interface CanvasConnectionCreatePayload {
  source_node_id: string
  source_port: string
  target_node_id: string
  target_port: string
  metadata: Record<string, unknown>
}

export interface CanvasDocumentResponse {
  canvas: CanvasMetadataDto
  nodes: CanvasNodeDto[]
  connections: CanvasConnectionDto[]
  revision: number
}

export interface CanvasViewportPayload {
  x: number
  y: number
  zoom: number
}
