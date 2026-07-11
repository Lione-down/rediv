export type CanvasNodeContentDto = Record<string, unknown>

export interface CanvasNodeDto {
  id: string
  project_id: string
  node_type: string
  content: CanvasNodeContentDto
  position_x: number
  position_y: number
  width: number
  height: number
  status: string
  created_at: string
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
