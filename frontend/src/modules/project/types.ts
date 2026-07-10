export interface Project {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface ProjectListResponse {
  items: Project[]
  total: number
}

export interface ProjectCreatePayload {
  name: string
}
