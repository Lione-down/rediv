import type {
  CanvasDocumentConnectionUpsert,
  CanvasDocumentNodeUpsert,
  CanvasDocumentPatchResponse,
} from '../canvas/types'

export type TemplateNodeSnapshot = CanvasDocumentNodeUpsert

export interface TemplateGraphData {
  schema_version: number
  nodes: CanvasDocumentNodeUpsert[]
  connections: CanvasDocumentConnectionUpsert[]
}

export interface Template {
  id: string
  name: string
  user_id: string
  node_count: number
  created_at: string
  node_data: TemplateNodeSnapshot[] | null
  schema_version: number
  graph_data: TemplateGraphData
}

export interface TemplateListResponse {
  items: Template[]
  total: number
}

export interface TemplateUseResponse {
  template: Template
  project_id: string
  project_name: string
  nodes_created: number
}

export interface CanvasTemplateCapturePayload {
  name: string
}

export interface TemplateInstantiatePayload {
  base_revision: number
  client_mutation_id: string
  anchor_x?: number
  anchor_y?: number
}

export interface TemplateInstantiateResponse {
  template_id: string
  project_id: string
  canvas_id: string
  nodes_created: number
  connections_created: number
  node_id_map: Record<string, string>
  connection_id_map: Record<string, string>
  mutation: CanvasDocumentPatchResponse
}
