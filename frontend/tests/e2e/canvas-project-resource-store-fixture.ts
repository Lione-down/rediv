import type { AxiosAdapter, AxiosResponse } from 'axios'

export function response(config: Parameters<AxiosAdapter>[0], data: unknown): AxiosResponse {
  return {
    config,
    data,
    headers: {},
    status: 200,
    statusText: 'OK',
  }
}

export function asset(id: string, projectId: string) {
  return {
    id,
    user_id: 'user-resource',
    project_id: projectId,
    origin_canvas_id: 'canvas-origin',
    canvas_node_id: null,
    type: 'image',
    url: `https://media.revid.test/${id}.png`,
    content_text: null,
    source: 'upload',
    source_model: null,
    source_task_id: null,
    status: 'active',
    created_at: '2026-07-14T08:00:00Z',
    updated_at: '2026-07-14T08:00:00Z',
  }
}

export function generationTask(id: string, projectId: string) {
  return {
    id,
    user_id: 'user-resource',
    project_id: projectId,
    origin_canvas_id: 'canvas-origin',
    canvas_node_id: null,
    media_type: 'image',
    provider: 'mock',
    model: 'mock-image-v1',
    provider_request_id: `request-${id}`,
    status: 'succeeded',
    duration_ms: 40,
    result_asset_id: `asset-${id}`,
    error_code: null,
    error_message: null,
    created_at: '2026-07-14T08:00:00Z',
    updated_at: '2026-07-14T08:00:00Z',
  }
}

export function template(id = 'template-one') {
  return {
    id,
    name: 'Storyboard',
    user_id: 'user-resource',
    node_count: 0,
    created_at: '2026-07-14T08:00:00Z',
    node_data: [],
    schema_version: 1,
    graph_data: { schema_version: 1, nodes: [], connections: [] },
  }
}
