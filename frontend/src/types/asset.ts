export interface Asset {
  id?: string
  user_id?: string
  project_id?: string | null
  canvas_node_id?: string | null
  type: 'prompt' | 'image' | 'video'
  url: string | null
  content_text: string | null
  source?: 'upload' | 'generation'
  source_model?: string | null
  source_task_id?: string | null
  status?: 'active' | 'hidden' | 'deleted'
  created_at?: string
  updated_at?: string
}
