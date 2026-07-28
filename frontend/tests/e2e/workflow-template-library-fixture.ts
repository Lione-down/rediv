import { createHash } from 'node:crypto'
import type { Page, Route } from '@playwright/test'
import {
  createVisualState,
  installMockApi,
  type MockState,
} from './authenticated-workflow-fixture'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-28T08:00:00Z'
export const WORKFLOW_TEMPLATE_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'

export interface WorkflowTemplateRequest {
  method: string
  path: string
  body?: Record<string, unknown>
}

export interface WorkflowTemplateFixture {
  state: MockState
  requests: WorkflowTemplateRequest[]
  expectedAssetRevision: string
}

function manifest(
  templateId: string,
  name: string,
  scope: 'built_in' | 'private',
  lifecycle: 'published' | 'retired',
) {
  const primaryKey = templateId === 'revid.product-ad'
    ? 'product_name'
    : templateId.includes('knowledge')
      ? 'topic'
      : 'story_brief'
  const primaryLabel = templateId === 'revid.product-ad'
    ? '商品名称'
    : templateId.includes('knowledge')
      ? '知识主题'
      : '剧情 Brief'
  const assetSlotId = templateId === 'revid.product-ad'
    ? 'product_reference'
    : templateId.includes('knowledge')
      ? 'speaker_reference'
      : 'visual_reference'
  return {
    schema_id: 'revid.workflow-template',
    schema_version: 1,
    template_id: templateId,
    template_version: 1,
    lifecycle,
    scope,
    metadata: {
      name,
      category: templateId.includes('product')
        ? 'commercial'
        : templateId.includes('knowledge')
          ? 'knowledge'
          : 'narrative',
      tags: ['cinematic', 'v1'],
      description: `${name}的 provider-free 可配置工作流`,
    },
    variables: [
      {
        key: primaryKey,
        type: 'text',
        required: true,
        label: primaryLabel,
        max_length: 120,
      },
      {
        key: 'shot_count',
        type: 'integer',
        required: true,
        label: '镜头数量',
        default: 6,
        minimum: 1,
        maximum: 25,
      },
      {
        key: 'aspect_ratio',
        type: 'enum',
        required: true,
        label: '画幅',
        default: '9:16',
        options: ['16:9', '9:16', '1:1'],
      },
    ],
    asset_slots: [
      {
        slot_id: assetSlotId,
        media_type: 'image',
        role: 'identity',
        required: true,
        minimum_items: 1,
        maximum_items: 3,
        revision_policy: 'exact',
      },
    ],
    graph: {
      nodes: [
        { local_id: 'brief', node_type: 'text' },
        { local_id: 'script', node_type: 'script' },
        { local_id: 'images', node_type: 'generation', subtype: 'image' },
        { local_id: 'videos', node_type: 'generation', subtype: 'video' },
      ],
      connections: [
        {
          local_id: 'brief-script',
          source_node_local_id: 'brief',
          source_port: 'out',
          target_node_local_id: 'script',
          target_port: 'prompt',
        },
        {
          local_id: 'script-images',
          source_node_local_id: 'script',
          source_port: 'out',
          target_node_local_id: 'images',
          target_port: 'prompt',
        },
        {
          local_id: 'images-videos',
          source_node_local_id: 'images',
          source_port: 'out',
          target_node_local_id: 'videos',
          target_port: 'media',
        },
      ],
    },
    steps: [
      {
        step_id: 'compile-story',
        node_local_id: 'script',
        intent: 'story-production',
        model_policy: 'agnes-text-default',
        input_bindings: [primaryKey, 'shot_count', assetSlotId],
        depends_on: [],
        capability_requirements: ['text.tool_calling'],
      },
      {
        step_id: 'create-shot-images',
        node_local_id: 'images',
        intent: 'shot-image',
        model_policy: 'agnes-image-quality-default',
        input_bindings: ['aspect_ratio', assetSlotId],
        depends_on: ['compile-story'],
        capability_requirements: ['image.text_or_single_image'],
      },
      {
        step_id: 'create-shot-videos',
        node_local_id: 'videos',
        intent: 'shot-video',
        model_policy: 'agnes-video-default',
        input_bindings: ['aspect_ratio'],
        depends_on: ['create-shot-images'],
        capability_requirements: ['video.text_or_single_image_or_keyframes'],
      },
    ],
    override_policy: {
      allowed_fields: [
        `variables.${primaryKey}`,
        'variables.shot_count',
        'variables.aspect_ratio',
      ],
      locked_fields: ['schema_id', 'schema_version', 'graph.connections', 'security'],
    },
    result_policy: {
      same_card: true,
      image_batch_siblings: true,
      ingest_provider_media: true,
    },
    security: {
      arbitrary_code: false,
      auto_execute: false,
      cross_project_lookup: false,
    },
  }
}

function lifecycle(
  templateId: string,
  name: string,
  scope: 'built_in' | 'private',
  lifecycleState: 'published' | 'retired',
  publishedAt: string,
) {
  return {
    template_id: templateId,
    scope,
    version: 1,
    lifecycle: lifecycleState,
    fingerprint: createHash('sha256').update(templateId).digest('hex'),
    manifest: manifest(templateId, name, scope, lifecycleState),
    published_at: publishedAt,
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map(
    (key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`,
  ).join(',')}}`
}

function sourceRevision(asset: Record<string, unknown>) {
  const updatedAt = String(asset.updated_at).endsWith('Z')
    ? `${String(asset.updated_at).slice(0, -1)}+00:00`
    : String(asset.updated_at)
  return createHash('sha256').update(canonicalJson({
    id: asset.id,
    media_type: asset.type,
    owner_id: asset.user_id,
    project_id: asset.project_id,
    source: asset.source,
    status: asset.status,
    updated_at: updatedAt,
  })).digest('hex')
}

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  })
}

function instantiatedNode(
  id: string,
  nodeType: string,
  subtype: string | undefined,
  x: number,
  zIndex: number,
) {
  return {
    id,
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: nodeType,
    content: {
      serialization_version: 1,
      template_placeholder: true,
      ...(subtype ? { subtype } : {}),
      ...(id === 'instance-node-script'
        ? {
            workflow_template_lineage: {
              contract_version: 1,
              template_id: 'revid.product-ad',
              template_version: 1,
              instance_id: 'workflow-template-instance-e2e',
              instance_step_id: 'instance-step-script-e2e',
              step_id: 'compile-story',
              script_node_id: 'instance-node-script',
            },
          }
        : {}),
    },
    position_x: x,
    position_y: 120,
    width: nodeType === 'text' ? 240 : nodeType === 'script' ? 320 : 340,
    height: nodeType === 'text' ? 140 : nodeType === 'script' ? 200 : 220,
    z_index: zIndex,
    parent_node_id: null,
    is_locked: false,
    is_collapsed: false,
    status: 'active',
    created_at: NOW,
    updated_at: NOW,
  }
}

export async function installWorkflowTemplateFixture(page: Page): Promise<WorkflowTemplateFixture> {
  const state = createVisualState()
  let workflowRun: Record<string, unknown> | null = null
  const asset = {
    id: 'asset-template-reference',
    user_id: 'user-e2e',
    project_id: 'project-e2e',
    origin_canvas_id: 'canvas-first',
    canvas_node_id: null,
    type: 'image',
    url: 'https://media.revid.test/product-reference.png',
    content_text: '参考商品图',
    source: 'upload',
    source_model: null,
    source_task_id: null,
    status: 'active',
    created_at: '2026-07-12T07:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  }
  state.assets.push(asset)
  const expectedAssetRevision = sourceRevision(asset)
  const requests: WorkflowTemplateRequest[] = []
  const items = [
    lifecycle('revid.product-ad', '商品广告短片', 'built_in', 'published', '2026-07-28T08:00:00Z'),
    lifecycle('revid.knowledge-talking-head', '知识口播短片', 'built_in', 'published', '2026-07-28T07:00:00Z'),
    lifecycle('revid.multi-shot-narrative', '多镜头剧情短片', 'built_in', 'published', '2026-07-28T06:00:00Z'),
    lifecycle('private.brand-film', '品牌主张短片', 'private', 'published', '2026-07-27T08:00:00Z'),
    lifecycle('private.retired-film', '已停用旧短片', 'private', 'retired', '2026-07-20T08:00:00Z'),
  ]

  await installMockApi(page, state)
  await page.route(`${API_ORIGIN}/api/workflow-templates**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : undefined
    requests.push({ method: request.method(), path, body })
    if (request.method() === 'GET' && path === '/api/workflow-templates') {
      return fulfillJson(route, { items, total: items.length })
    }
    const preflight = path.match(/^\/api\/workflow-templates\/([^/]+)\/versions\/1\/preflight$/)
    if (request.method() === 'POST' && preflight && body) {
      const assetBindings = body.asset_bindings as Record<string, Array<Record<string, unknown>>>
      const slot = Object.values(assetBindings)[0]?.[0]
      if (
        slot?.asset_id !== asset.id
        || slot?.source_revision !== expectedAssetRevision
      ) {
        return fulfillJson(route, {
          detail: {
            code: 'workflow_template_asset_revision_stale',
            message: 'Asset source revision is stale',
          },
        }, 422)
      }
      const confirmed = body.cost_confirmed === true
      return fulfillJson(route, {
        contract_version: 1,
        template: {
          id: decodeURIComponent(preflight[1]),
          version: 1,
          fingerprint: 'a'.repeat(64),
        },
        executable: confirmed,
        errors: confirmed ? [] : [{
          code: 'workflow_template_cost_confirmation_required',
          message: 'Cost confirmation is required',
        }],
        warnings: [],
        resolved_slots: confirmed ? [
          { slot_id: 'product_name', kind: 'variable', value: '澄海手冲壶' },
          {
            slot_id: 'product_reference',
            kind: 'asset',
            items: [{ asset_id: asset.id, source_revision: expectedAssetRevision }],
          },
        ] : [],
        graph_summary: { nodes: 4, connections: 3 },
        capability_snapshot: { version: 7 },
        quota_estimate: { text: 1, image: 6, video: 6 },
        cost_class: 'requires_confirmation',
        fingerprint: confirmed ? 'f'.repeat(64) : '',
      })
    }
    return fulfillJson(route, { detail: `Unhandled workflow-template route: ${request.method()} ${path}` }, 501)
  })

  await page.route(
    `${API_ORIGIN}/api/projects/project-e2e/canvases/canvas-first/workflow-template-instances`,
    async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      const body = request.postDataJSON() as Record<string, unknown>
      requests.push({ method: request.method(), path, body })
      const nodes = [
        instantiatedNode('instance-node-brief', 'text', 'text', 80, 0),
        instantiatedNode('instance-node-script', 'script', 'script', 500, 1),
        instantiatedNode('instance-node-images', 'generation', 'image', 920, 2),
        instantiatedNode('instance-node-videos', 'generation', 'video', 1340, 3),
      ]
      const connections = [
        ['instance-edge-brief-script', 'instance-node-brief', 'instance-node-script', 'prompt'],
        ['instance-edge-script-images', 'instance-node-script', 'instance-node-images', 'prompt'],
        ['instance-edge-images-videos', 'instance-node-images', 'instance-node-videos', 'media'],
      ].map(([id, source, target, targetPort]) => ({
        id,
        project_id: 'project-e2e',
        canvas_id: 'canvas-first',
        source_node_id: source,
        source_port: 'out',
        target_node_id: target,
        target_port: targetPort,
        status: 'active',
        metadata: {},
        created_at: NOW,
        updated_at: NOW,
      }))
      state.canvasNodes.push(...nodes)
      state.canvasConnections.push(...connections)
      return fulfillJson(route, {
        instance_id: 'workflow-template-instance-e2e',
        template_id: body.template_id,
        template_version: body.template_version,
        project_id: 'project-e2e',
        canvas_id: 'canvas-first',
        state: 'instantiated',
        preflight_fingerprint: body.preflight_fingerprint,
        node_id_map: {
          brief: 'instance-node-brief',
          script: 'instance-node-script',
          images: 'instance-node-images',
          videos: 'instance-node-videos',
        },
        connection_id_map: {
          'brief-script': 'instance-edge-brief-script',
          'script-images': 'instance-edge-script-images',
          'images-videos': 'instance-edge-images-videos',
        },
        binding_id_map: {},
        step_id_map: {},
        mutation: {
          revision: 1,
          node_upserts: nodes,
          node_deletes: [],
          connection_upserts: connections,
          connection_deletes: [],
          server_timestamp: NOW,
          save_state: 'saved',
        },
      }, 201)
    },
  )

  await page.route(
    `${API_ORIGIN}/api/projects/project-e2e/canvases/canvas-first/workflow-template-instances/**`,
    async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      const body = request.postData()
        ? request.postDataJSON() as Record<string, unknown>
        : undefined
      requests.push({ method: request.method(), path, body })
      if (path.endsWith('/runs/preflight') && request.method() === 'POST') {
        const confirmed = body?.cost_confirmed === true
        return fulfillJson(route, {
          contract_version: 1,
          template: {
            id: 'revid.product-ad',
            version: 1,
            fingerprint: 'a'.repeat(64),
          },
          executable: confirmed,
          errors: confirmed ? [] : [{
            code: 'workflow_template_cost_confirmation_required',
            message: 'Cost confirmation is required',
          }],
          warnings: [],
          resolved_slots: [],
          graph_summary: { nodes: 4, connections: 3 },
          capability_snapshot: { version: 7 },
          quota_estimate: { text: 1, image: 6, video: 6 },
          cost_class: 'requires_confirmation',
          fingerprint: confirmed ? 'r'.repeat(64) : '',
        })
      }
      if (path.endsWith('/runs/latest') && request.method() === 'GET') {
        return workflowRun
          ? fulfillJson(route, workflowRun)
          : fulfillJson(route, {
              detail: {
                code: 'workflow_run_not_found',
                message: 'Workflow run not found',
              },
            }, 404)
      }
      if (path.endsWith('/runs') && request.method() === 'POST') {
        workflowRun = {
          run_id: 'workflow-run-e2e',
          instance_id: 'workflow-template-instance-e2e',
          status: 'queued',
          preflight_fingerprint: body?.preflight_fingerprint,
          quota_estimate: { text: 1, image: 6, video: 6 },
          cost_class: 'requires_confirmation',
          created_at: NOW,
          updated_at: NOW,
          completed_at: null,
          steps: [
            {
              run_step_id: 'workflow-run-step-script-e2e',
              instance_step_id: 'instance-step-script-e2e',
              step_id: 'compile-story',
              node_id: 'instance-node-script',
              status: 'succeeded',
              generation_job_id: null,
              result_asset_id: null,
              error_code: null,
            },
            {
              run_step_id: 'workflow-run-step-image-e2e',
              instance_step_id: 'instance-step-image-e2e',
              step_id: 'create-images',
              node_id: 'instance-node-images',
              status: 'queued',
              generation_job_id: 'workflow-job-image-e2e',
              result_asset_id: null,
              error_code: null,
            },
          ],
        }
        return fulfillJson(route, workflowRun, 202)
      }
      if (
        path.endsWith('/runs/workflow-run-e2e') &&
        request.method() === 'GET' &&
        workflowRun
      ) return fulfillJson(route, workflowRun)
      if (
        path.endsWith('/runs/workflow-run-e2e/cancel') &&
        request.method() === 'POST' &&
        workflowRun
      ) {
        workflowRun = { ...workflowRun, status: 'cancelled', completed_at: NOW }
        return fulfillJson(route, workflowRun)
      }
      return fulfillJson(route, { detail: `Unhandled workflow run route: ${request.method()} ${path}` }, 501)
    },
  )

  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  return { state, requests, expectedAssetRevision }
}

export async function openWorkflowTemplateLibrary(
  page: Page,
  viewport = { width: 1440, height: 900 },
) {
  await page.setViewportSize(viewport)
  await installWorkflowTemplateFixture(page)
  await page.goto(WORKFLOW_TEMPLATE_URL)
  const opener = page.getByRole('button', { name: '打开模板库' })
  await opener.click()
  return {
    opener,
    dialog: page.getByRole('dialog', { name: '工作流模板库' }),
  }
}

export async function configureProductAd(page: Page) {
  const dialog = page.getByRole('dialog', { name: '工作流模板库' })
  await dialog.getByRole('button', { name: /配置模板 商品广告短片/ }).click()
  await dialog.getByRole('textbox', { name: '商品名称' }).fill('澄海手冲壶')
  await dialog.getByRole('checkbox', { name: /参考商品图/ }).check()
  await dialog.getByRole('button', { name: '运行预检' }).click()
  await dialog.getByRole('checkbox', { name: '确认此费用级别' }).check()
  await dialog.getByRole('button', { name: '重新预检' }).click()
  return dialog
}
