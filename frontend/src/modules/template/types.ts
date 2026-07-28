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

export type WorkflowTemplateVariableType =
  | 'text'
  | 'multiline'
  | 'integer'
  | 'boolean'
  | 'enum'
  | 'bounded_list'

export interface WorkflowTemplateVariable {
  key: string
  type: WorkflowTemplateVariableType
  required: boolean
  label: string
  default?: string | number | boolean | string[]
  max_length?: number
  minimum?: number
  maximum?: number
  options?: string[]
}

export interface WorkflowTemplateAssetSlot {
  slot_id: string
  media_type: 'image' | 'video' | 'audio'
  role: 'identity' | 'style' | 'subject' | 'first_frame' | 'last_frame' | 'reference'
  required: boolean
  minimum_items: number
  maximum_items: number
  revision_policy: 'exact' | 'latest_compatible'
}

export interface WorkflowTemplateGraphNode {
  local_id: string
  node_type: 'text' | 'script' | 'generation' | 'group' | 'asset'
  subtype?: 'image' | 'video'
}

export interface WorkflowTemplateGraphConnection {
  local_id: string
  source_node_local_id: string
  source_port: string
  target_node_local_id: string
  target_port: string
}

export interface WorkflowTemplateStep {
  step_id: string
  node_local_id: string
  intent: 'story-production' | 'shot-image' | 'image-precomposition' | 'shot-video'
  model_policy:
    | 'agnes-text-default'
    | 'agnes-image-quality-default'
    | 'agnes-image-precomposition'
    | 'agnes-video-default'
  input_bindings: string[]
  depends_on: string[]
  capability_requirements: string[]
}

export interface WorkflowTemplateManifest {
  schema_id: 'revid.workflow-template'
  schema_version: 1
  template_id: string
  template_version: number
  lifecycle: 'draft' | 'published' | 'retired'
  scope: 'built_in' | 'private'
  metadata: {
    name: string
    category: string
    tags: string[]
    description: string
  }
  variables: WorkflowTemplateVariable[]
  asset_slots: WorkflowTemplateAssetSlot[]
  graph: {
    nodes: WorkflowTemplateGraphNode[]
    connections: WorkflowTemplateGraphConnection[]
  }
  steps: WorkflowTemplateStep[]
  override_policy: {
    allowed_fields: string[]
    locked_fields: string[]
  }
  result_policy: {
    same_card: true
    image_batch_siblings: true
    ingest_provider_media: true
  }
  security: {
    arbitrary_code: false
    auto_execute: false
    cross_project_lookup: false
  }
}

export interface WorkflowTemplateProviderProjection {
  name: string
  projection_version: 1
  provider: 'agnes'
  contract_id:
    | 'agnes.text.chat-completions.v1'
    | 'agnes.image-2.0.generations.v1'
    | 'agnes.image-2.1.generations.v1'
    | 'agnes.video-v2.0.v1'
  intent: 'story-production' | 'image-precomposition' | 'shot-image' | 'shot-video'
  request: Record<string, unknown>
}

export interface WorkflowTemplateBinding {
  slot_id: string
  binding_type: 'asset' | 'value'
  value?: string | number | boolean | string[]
  asset_id?: string
  source_revision?: number
  project_id: string
  owner_id: string
}

export interface WorkflowTemplateInstance {
  instance_id: string
  template_id: string
  template_version: number
  project_id: string
  canvas_id: string
  state: 'preflighted' | 'instantiated' | 'detached'
  preflight_fingerprint: string
  node_id_map: Record<string, string>
}

export interface WorkflowTemplateLifecycleItem {
  template_id: string
  scope: WorkflowTemplateManifest['scope']
  version: number
  lifecycle: WorkflowTemplateManifest['lifecycle']
  fingerprint: string
  manifest: WorkflowTemplateManifest
  published_at: string
}

export interface WorkflowTemplateLifecycleListResponse {
  items: WorkflowTemplateLifecycleItem[]
  total: number
}

export interface WorkflowTemplateAssetBindingInput {
  asset_id: string
  source_revision: string
}

export interface WorkflowTemplatePreflightRequest {
  project_id: string
  canvas_id: string
  variable_bindings: Record<string, string | number | boolean | string[]>
  asset_bindings: Record<string, WorkflowTemplateAssetBindingInput[]>
  cost_confirmed: boolean
}

export interface WorkflowTemplatePreflightIssue {
  code: string
  message: string
  field?: string
}

export interface WorkflowTemplatePreflightResponse {
  contract_version: number
  template: {
    id: string
    version: number
    fingerprint: string
  }
  executable: boolean
  errors: WorkflowTemplatePreflightIssue[]
  warnings: WorkflowTemplatePreflightIssue[]
  resolved_slots: Array<Record<string, unknown>>
  graph_summary: {
    nodes: number
    connections: number
  }
  capability_snapshot: Record<string, unknown>
  quota_estimate: {
    text: number
    image: number
    video: number
  }
  cost_class: string
  fingerprint: string
}

export interface WorkflowTemplateInstantiateRequest {
  template_id: string
  template_version: number
  variable_bindings: Record<string, string | number | boolean | string[]>
  asset_bindings: Record<string, WorkflowTemplateAssetBindingInput[]>
  preflight_fingerprint: string
  cost_confirmed: boolean
  base_revision: number
  client_mutation_id: string
}

export interface WorkflowTemplateInstantiateResponse extends WorkflowTemplateInstance {
  project_id: string
  canvas_id: string
  connection_id_map: Record<string, string>
  binding_id_map: Record<string, string>
  step_id_map: Record<string, string>
  mutation: CanvasDocumentPatchResponse
}

export interface WorkflowRun {
  run_id: string
  instance_id: string
  state: 'ready' | 'running' | 'succeeded' | 'failed' | 'blocked'
  preflight_fingerprint: string
  steps: Array<{
    step_id: string
    state: 'pending' | 'ready' | 'running' | 'succeeded' | 'failed' | 'blocked'
  }>
}
