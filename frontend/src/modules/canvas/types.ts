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
  z_index: number
  parent_node_id: string | null
  is_locked: boolean
  is_collapsed: boolean
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
  z_index?: number
  parent_node_id?: string | null
  is_locked?: boolean
  is_collapsed?: boolean
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

export interface CanvasDocumentNodeUpsert {
  id: string
  node_type: string
  content: CanvasNodeContentDto
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  parent_node_id: string | null
  is_locked: boolean
  is_collapsed: boolean
}

export interface CanvasDocumentConnectionUpsert {
  id: string
  source_node_id: string
  source_port: string
  target_node_id: string
  target_port: string
  metadata: Record<string, unknown>
}

export interface CanvasRecoveryDocument {
  node_upserts: CanvasDocumentNodeUpsert[]
  connection_upserts: CanvasDocumentConnectionUpsert[]
}

export interface CanvasDocumentPatchPayload {
  base_revision: number
  client_mutation_id: string
  node_upserts: CanvasDocumentNodeUpsert[]
  node_deletes: string[]
  connection_upserts: CanvasDocumentConnectionUpsert[]
  connection_deletes: string[]
}

export interface CanvasDocumentPatchResponse {
  revision: number
  node_upserts: CanvasNodeDto[]
  node_deletes: string[]
  connection_upserts: CanvasConnectionDto[]
  connection_deletes: string[]
  server_timestamp: string
  save_state: 'saved'
}

export type CanvasGraphSaveState = 'saving' | 'saved' | 'error' | 'conflict'

export interface CanvasRevisionSummary {
  revision: number
  base_revision: number
  is_checkpoint: boolean
  restored_from_revision: number | null
  created_at: string
}

export interface CanvasRevisionListResponse {
  items: CanvasRevisionSummary[]
  current_revision: number
}

export interface CanvasRevisionRestoreResponse {
  revision: number
  restored_from_revision: number
  server_timestamp: string
}

export interface CanvasViewportPayload {
  x: number
  y: number
  zoom: number
}
