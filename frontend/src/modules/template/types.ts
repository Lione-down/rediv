export type TemplateNodeSnapshot = Record<string, unknown>

export interface Template {
  id: string
  name: string
  user_id: string
  node_count: number
  created_at: string
  node_data: TemplateNodeSnapshot[] | null
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
