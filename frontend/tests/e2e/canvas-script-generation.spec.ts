import { expect, test } from '@playwright/test'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createScriptAuthoringResultCommand,
  parseScriptAuthoringCapabilities,
  resolveScriptAuthoringEligibility,
} from '../../src/modules/canvas/script-authoring'
import { requestCanvasGeneration } from '../../src/modules/canvas/generation-service'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

function scriptNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'script-source', type: 'script', title: '创意 Brief', x: 100, y: 120, width: 320, height: 200,
    content: '', contentData: { subtype: 'script', serialization_version: 1, text: '' },
    ...overrides,
  }
}

test('script authoring capability is backend-owned and model-visible', () => {
  expect(parseScriptAuthoringCapabilities({
    contract_version: 1,
    available: true,
    model: 'agnes-2.0-flash',
    model_label: 'Agnes 2.0 Flash',
    intents: ['script_draft', 'script_refine'],
    locales: ['zh-CN', 'en-US'],
    default_locale: 'zh-CN',
    brief_max_length: 4000,
    source_max_length: 12000,
    output_max_length: 12000,
    creates_media: false,
    runs_cinematic_decomposition: false,
  })).toEqual(expect.objectContaining({
    model: 'agnes-2.0-flash', modelLabel: 'Agnes 2.0 Flash',
    intents: ['script_draft', 'script_refine'],
  }))
})

test('draft accepts a blank canonical script while refine requires current content', () => {
  const blank = scriptNode()
  const current = scriptNode({ content: '第一场：雨夜。', contentData: { subtype: 'script', serialization_version: 1, text: '第一场：雨夜。' } })
  const context = { canvasReady: true, isReadOnly: false, isReviewOnly: false, selectedNodes: [blank] }

  expect(resolveScriptAuthoringEligibility({ ...context, intent: 'script_draft' })).toEqual({ eligible: true, source: blank })
  expect(resolveScriptAuthoringEligibility({ ...context, intent: 'script_refine' })).toEqual(expect.objectContaining({ eligible: false }))
  expect(resolveScriptAuthoringEligibility({ ...context, intent: 'script_refine', selectedNodes: [current] })).toEqual({ eligible: true, source: current })

  for (const selectedNodes of [[{ ...blank, isLocked: true }], [blank, current]]) {
    expect(resolveScriptAuthoringEligibility({ ...context, intent: 'script_draft', selectedNodes })).toEqual(expect.objectContaining({ eligible: false }))
  }
  expect(resolveScriptAuthoringEligibility({ ...context, intent: 'script_draft', isReviewOnly: true })).toEqual(expect.objectContaining({ eligible: false }))
})

test('draft and refine both replace the selected script through one stale-safe update command', () => {
  const source = scriptNode()
  const lineage = {
    contract_version: 1 as const,
    intent: 'script_draft' as const,
    locale: 'zh-CN' as const,
    source_node_id: source.id,
    source_task_id: 'task-script-1',
    source_model: 'agnes-2.0-flash',
    canvas_revision: 7,
  }
  const drafted = createScriptAuthoringResultCommand({
    source, sourceTextAtRequest: '', generatedText: '第一场：雨夜车站。', lineage,
  })
  const replaced = createScriptAuthoringResultCommand({
    source: scriptNode({ content: '旧稿', contentData: { subtype: 'script', serialization_version: 1, text: '旧稿' } }),
    sourceTextAtRequest: '旧稿', generatedText: '优化稿', lineage: { ...lineage, intent: 'script_refine' },
  })

  expect(drafted).toEqual(expect.objectContaining({
    type: 'apply-script-authoring-result', nodeId: source.id, expectedContent: '', content: '第一场：雨夜车站。',
  }))
  expect(replaced).toEqual(expect.objectContaining({
    type: 'apply-script-authoring-result', nodeId: source.id, expectedContent: '旧稿', content: '优化稿',
  }))
  expect(createScriptAuthoringResultCommand({
    source: { ...source, content: 'changed' }, sourceTextAtRequest: '', generatedText: 'late', lineage,
  })).toBeNull()
})

test('script authoring request sends structured intent and validates task lineage', async () => {
  const calls: Array<{ path: string; payload: unknown; timeout?: number }> = []
  const task = {
    id: 'task-script-1', user_id: 'user-a', project_id: 'project-a', origin_canvas_id: 'canvas-a',
    canvas_node_id: 'script-source', media_type: 'text', provider: 'agnes', model: 'agnes-2.0-flash',
    provider_request_id: 'request-a', client_request_id: '00000000-0000-4000-8000-000000000001',
    request_fingerprint: 'a'.repeat(64), status: 'succeeded', duration_ms: 50,
    result_asset_id: 'asset-script-1', error_code: null, error_message: null,
    request_parameters: { script_authoring: {
      contract_version: 1, intent: 'script_draft', locale: 'zh-CN', source_node_id: 'script-source', canvas_revision: 7,
    } },
    created_at: '2026-07-18T10:00:00Z', updated_at: '2026-07-18T10:00:00Z',
  }
  const transport = {
    async post(path: string, payload: unknown, config?: { timeout?: number }) {
      calls.push({ path, payload, timeout: config?.timeout })
      return { data: {
        content: '第一场：雨夜。',
        asset: {
          id: 'asset-script-1', user_id: 'user-a', project_id: 'project-a', origin_canvas_id: 'canvas-a',
          canvas_node_id: 'script-source', type: 'prompt', url: null, content_text: '第一场：雨夜。',
          source: 'generation', source_model: 'agnes-2.0-flash', source_task_id: 'task-script-1', status: 'active',
          created_at: '2026-07-18T10:00:00Z', updated_at: '2026-07-18T10:00:00Z',
        },
        generation_task: task,
        quotas: { text: 4, image: 5, video: 5 }, quota_revision: 8,
        script_authoring: {
          contract_version: 1, intent: 'script_draft', locale: 'zh-CN', source_node_id: 'script-source',
          source_task_id: 'task-script-1', source_model: 'agnes-2.0-flash', canvas_revision: 7,
        },
      } }
    },
  }
  const quotaStore = {
    token: 'session-a', quotas: { text: 5, image: 5, video: 5 }, quotaRevision: 7,
    applyQuotaSnapshot(quotas: { text: number; image: number; video: number }, revision: number) {
      this.quotas = quotas; this.quotaRevision = revision; return true
    },
  }

  const response = await requestCanvasGeneration({
    mediaType: 'text', clientRequestId: '00000000-0000-4000-8000-000000000001',
    projectId: 'project-a', originCanvasId: 'canvas-a', canvasNodeId: 'script-source',
    scriptAuthoring: { intent: 'script_draft', locale: 'zh-CN', canvasRevision: 7, brief: '雨夜摄影师' },
  }, quotaStore, transport)

  expect(response.content).toBe('第一场：雨夜。')
  expect(calls).toEqual([{
    path: '/api/text-generate', timeout: 0,
    payload: {
      client_request_id: '00000000-0000-4000-8000-000000000001', project_id: 'project-a',
      origin_canvas_id: 'canvas-a', canvas_node_id: 'script-source', intent: 'script_draft',
      locale: 'zh-CN', canvas_revision: 7, brief: '雨夜摄影师',
    },
  }])
  expect(quotaStore.quotas.text).toBe(4)
})

test('Canvas script authoring directly replaces the selected card, stays reversible, and creates no version UI', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('combobox', { name: '搜索专业操作' }).fill('agnes 创意')
  await palette.getByRole('option', { name: /Agnes：从创意生成脚本/ }).click()

  const authoring = page.getByRole('region', { name: 'AI 脚本写作' })
  await expect(authoring).toContainText('Agnes 2.0 Flash')
  await expect(authoring.getByRole('button', { name: '从创意生成脚本' })).toHaveAttribute('aria-pressed', 'true')
  await authoring.getByRole('textbox', { name: '创意 Brief' }).fill('雨夜车站，一名摄影师寻找失踪的胶卷。')
  await authoring.getByRole('button', { name: '生成新脚本' }).click()

  await expect.poll(() => state.requests.filter((item) => item.path === '/api/text-generate').length).toBe(1)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const draftRequest = state.requests.find((item) => item.path === '/api/text-generate')!.body!
  expect(draftRequest).toMatchObject({
    intent: 'script_draft', brief: '雨夜车站，一名摄影师寻找失踪的胶卷。',
    canvas_node_id: 'script-source', origin_canvas_id: FIRST_CANVAS_ID,
  })
  expect(draftRequest).not.toHaveProperty('cinematic_handoff')
  const sourceAfterDraft = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!
  expect((sourceAfterDraft.content as Record<string, unknown>).text).toBe('雨夜车站。摄影师穿过人群，寻找装着失踪胶卷的银色手提箱。')
  const generatedDraft = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    item.id !== 'script-source' && item.node_type === 'script' &&
    (item.content as Record<string, unknown>).source_task_id === 'task-authoring-1'
  ))
  expect(generatedDraft).toBeUndefined()
  await expect(authoring.getByRole('checkbox')).toHaveCount(0)
  expect(state.requests.filter((item) => ['/api/image-generate', '/api/video-generate'].includes(item.path))).toHaveLength(0)

  await stage.focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => documentPatches(state).length).toBe(2)
  expect((state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!.content as Record<string, unknown>).text)
    .toBe('黄昏海岸，人物入画。')
  await stage.focus()
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => documentPatches(state).length).toBe(3)
  expect((state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!.content as Record<string, unknown>).text)
    .toBe('雨夜车站。摄影师穿过人群，寻找装着失踪胶卷的银色手提箱。')
  await page.reload()
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
  expect((state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!.content as Record<string, unknown>).text)
    .toBe('雨夜车站。摄影师穿过人群，寻找装着失踪胶卷的银色手提箱。')

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()
  const replaceAuthoring = page.getByRole('region', { name: 'AI 脚本写作' })
  await replaceAuthoring.getByRole('textbox', { name: '脚本优化要求' }).fill('提升节奏，保留人物和黄昏海岸。')
  await replaceAuthoring.getByRole('button', { name: '生成优化版本' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/text-generate').length).toBe(2)
  await expect.poll(() => (state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!.content as Record<string, unknown>).text)
    .toBe('黄昏海岸。主角在潮声中走入画面，停下并望向远处灯塔。')
  expect(state.requests.filter((item) => item.path.endsWith('/cinematic-preflight'))).toHaveLength(0)
})

test('script context replaces internal capability jargon with recoverable model state', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilitiesOutcome = 'failure'
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()

  const authoring = page.getByRole('region', { name: 'AI 脚本写作' })
  await expect(authoring).toContainText('模型未就绪')
  await expect(authoring).not.toContainText('capability 未加载')
  await expect(authoring).toContainText('模型服务暂不可用')

  state.capabilitiesOutcome = 'success'
  await authoring.getByRole('button', { name: '重试加载模型' }).click()
  await expect(authoring).toContainText('Agnes 2.0 Flash')
  await authoring.getByRole('textbox', { name: '脚本优化要求' }).fill('提升节奏。')
  await expect(authoring.getByRole('button', { name: '生成优化版本' })).toBeEnabled()
})
