import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveCanvasAuthoringCardPresentation } from '../../src/components/canvas/canvas-authoring-card-presentation'
import {
  changedGenerationRuntimeNodeIds,
  resolveGenerationRuntimePresentations,
  type LocalGenerationRuntimeRequest,
} from '../../src/modules/canvas/generation-runtime-presentation'
import type { ProjectGenerationTask } from '../../src/modules/canvas/project-resource-types'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
} from './canvas-resource-generation-fixture'

const NOW = '2026-07-14T08:00:00Z'
const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-076-runtime-generation')

function generationNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'generation-cover', type: 'generation', title: '封面生成', x: 0, y: 0,
    width: 340, height: 220,
    contentData: { subtype: 'image', serialization_version: 1 },
    ...overrides,
  }
}

function generationTask(
  id: string,
  status: ProjectGenerationTask['status'],
  overrides: Partial<ProjectGenerationTask> = {},
): ProjectGenerationTask {
  return {
    id, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: 'generation-cover', media_type: 'image', provider: 'mock', model: 'mock-image-v1',
    provider_request_id: null, status, duration_ms: null, result_asset_id: null,
    error_code: null, error_message: null, created_at: NOW, updated_at: NOW,
    ...overrides,
  }
}

function localRequest(knownTaskIds: string[] = []): LocalGenerationRuntimeRequest {
  return {
    id: 'local-request', projectId: PROJECT_ID, canvasId: FIRST_CANVAS_ID,
    nodeId: 'generation-cover', mediaType: 'image', knownTaskIds,
  }
}

test('runtime presentation bridges local submission and then yields to the newest strict durable task', () => {
  const node = generationNode()
  const oldTask = generationTask('task-old', 'succeeded')
  const localRequests = new Map([[node.id, localRequest([oldTask.id])]])

  const submitting = resolveGenerationRuntimePresentations(
    [node], [oldTask], localRequests, PROJECT_ID, FIRST_CANVAS_ID,
  )
  expect(submitting.get(node.id)).toMatchObject({ phase: 'submitting', label: '正在提交', source: 'local' })

  const queuedTask = generationTask('task-new', 'queued')
  const queued = resolveGenerationRuntimePresentations(
    [node], [oldTask, queuedTask], localRequests, PROJECT_ID, FIRST_CANVAS_ID,
  )
  expect(queued.get(node.id)).toMatchObject({ phase: 'queued', label: '排队中', source: 'task', taskId: queuedTask.id })

  const runningTask = { ...queuedTask, status: 'running' as const, updated_at: '2026-07-14T08:01:00Z' }
  const running = resolveGenerationRuntimePresentations(
    [node], [oldTask, runningTask], localRequests, PROJECT_ID, FIRST_CANVAS_ID,
  )
  expect(running.get(node.id)).toMatchObject({ phase: 'running', label: '模型生成中' })
  const card = resolveCanvasAuthoringCardPresentation(node, running.get(node.id))!
  expect(card.lifecycle).toMatchObject({ tone: 'progress', label: '模型生成中' })
  expect(card.visualHeight).toBe(160)
  expect(card.slots.status).toEqual({ x: 0, y: 130, width: 340, height: 30 })
  expect(changedGenerationRuntimeNodeIds(queued, running)).toEqual(['generation-cover'])
  expect(changedGenerationRuntimeNodeIds(running, new Map(running))).toEqual([])
})

test('runtime presentation is strict by project, Canvas, node, and media and exposes every terminal label', () => {
  const node = generationNode()
  const wrongCanvas = generationTask('task-wrong-canvas', 'running', { origin_canvas_id: 'other-canvas' })
  expect(resolveGenerationRuntimePresentations(
    [node], [wrongCanvas], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  )).toEqual(new Map())

  for (const [status, label] of [
    ['succeeded', '已完成'], ['failed', '失败'], ['timed_out', '已超时'],
  ] as const) {
    const presentations = resolveGenerationRuntimePresentations(
      [node], [generationTask(`task-${status}`, status)], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
    )
    expect(presentations.get(node.id)).toMatchObject({ phase: status, label, source: 'task' })
  }
})

async function selectNode(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

for (const mediaType of ['image', 'video'] as const) {
  test(`legacy compatibility: held ${mediaType} request stays visible through project-wide polling without mutations`, async ({ page }) => {
    const state = createResourceMockState()
    const source = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
    const sourceContent = source.content as Record<string, unknown>
    source.content = { ...sourceContent, subtype: mediaType }
    let releaseGeneration!: () => void
    state.generationGate = new Promise<void>((resolve) => { releaseGeneration = resolve })
    await openResourceWorkspace(page, state)
    await selectNode(page, '封面生成')

    const assetReads = state.requests.filter((item) => item.method === 'GET' && item.path === '/assets').length
    const templateReads = state.requests.filter((item) => item.method === 'GET' && item.path === '/templates').length
    const generationRequest = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith(`/api/${mediaType}-generate`))
    await page.getByRole('button', { name: `开始${mediaType === 'video' ? '视频' : '图片'}生成` }).click()
    await generationRequest
    await expect(page.getByLabel('生成状态')).toContainText('正在提交')

    const patchBaseline = documentPatches(state).length
    const previousTask = state.tasks[0]
    const runtimeTask = {
      ...previousTask,
      id: 'task-runtime', media_type: mediaType, model: `mock-${mediaType}-v1`,
      status: 'queued', result_asset_id: null, provider_request_id: 'request-runtime',
      created_at: NOW, updated_at: NOW,
    }
    state.tasks = [runtimeTask, ...state.tasks]
    await expect(page.getByLabel('生成状态')).toContainText('排队中', { timeout: 6_000 })
    expect(documentPatches(state)).toHaveLength(patchBaseline)

    await selectNode(page, '镜头脚本')
    state.tasks = state.tasks.map((item) => item.id === runtimeTask.id
      ? { ...item, status: 'running', updated_at: '2026-07-14T08:01:00Z' }
      : item)
    await expect.poll(() => state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length).toBeGreaterThan(2)
    const viewportBeforeReselect = state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith('/viewport')).length
    await selectNode(page, '封面生成')
    await expect(page.getByLabel('生成状态')).toContainText('模型生成中')
    await expect.poll(() => state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith('/viewport')).length).toBeGreaterThan(viewportBeforeReselect)
    const viewportBaseline = state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith('/viewport')).length
    const taskReadBaseline = state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length
    await expect.poll(() => state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length).toBeGreaterThan(taskReadBaseline)

    expect(state.requests.filter((item) => item.method === 'GET' && item.path === '/assets')).toHaveLength(assetReads)
    expect(state.requests.filter((item) => item.method === 'GET' && item.path === '/templates')).toHaveLength(templateReads)
    expect(documentPatches(state)).toHaveLength(patchBaseline)
    expect(state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith('/viewport'))).toHaveLength(viewportBaseline)
    if (mediaType === 'image') {
      await mkdir(evidenceDirectory, { recursive: true })
      await page.screenshot({ path: resolve(evidenceDirectory, 'running-background-1440x900.png'), fullPage: true })
    }

    releaseGeneration()
    await expect(page.getByLabel('生成状态')).toContainText('已完成', { timeout: 6_000 })
  })
}

test('legacy compatibility: readonly compact reload recovers through project-wide task polling', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  source.content = {
    ...(source.content as Record<string, unknown>),
    title: '跨设备恢复的超长本地化生成任务标题用于验证紧凑抽屉不会横向溢出并保持状态可读性',
  }
  state.tasks = [generationTask('task-recovered', 'running'), ...state.tasks]
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, String((source.content as Record<string, unknown>).title))

  const status = page.getByLabel('生成状态')
  await expect(status).toContainText('模型生成中')
  await expect(status.locator('.is-spinning')).toHaveCSS('animation-name', 'none')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toHaveCount(0)
  const panel = page.getByRole('complementary', { name: /节点详情/ })
  await expect.poll(async () => {
    const box = await panel.boundingBox()
    return box ? Math.ceil(box.x + box.width) : Number.POSITIVE_INFINITY
  }).toBeLessThanOrEqual(375)
  const panelBox = await panel.boundingBox()
  expect(panelBox).not.toBeNull()
  expect(panelBox!.x).toBeGreaterThanOrEqual(0)
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(375)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'recovered-readonly-375x812.png'), fullPage: true })

  const taskReadBaseline = state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length
  state.tasks = state.tasks.map((item) => item.id === 'task-recovered'
    ? { ...item, status: 'timed_out', updated_at: '2026-07-14T08:02:00Z' }
    : item)
  await expect.poll(() => state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length).toBeGreaterThan(taskReadBaseline)
  await expect(status).toContainText('已超时', { timeout: 6_000 })
})

test('legacy compatibility: project-wide polling failure keeps the request-bound POST indeterminate', async ({ page }) => {
  const state = createResourceMockState()
  let releaseGeneration!: () => void
  state.generationGate = new Promise<void>((resolve) => { releaseGeneration = resolve })
  await openResourceWorkspace(page, state)
  await selectNode(page, '封面生成')

  const generationRequest = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/api/image-generate'))
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await generationRequest
  await expect(page.getByLabel('生成状态')).toContainText('正在提交')
  state.taskListOutcome = 'failure'
  const taskReadBaseline = state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length
  await expect.poll(() => state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length).toBeGreaterThan(taskReadBaseline)
  await expect(page.getByLabel('生成状态')).toContainText('正在提交')
  await expect(page.getByText('项目资源加载失败，请重试。')).toHaveCount(0)
  expect(state.requests.filter((item) => item.method === 'POST' && item.path === '/api/image-generate')).toHaveLength(1)

  state.taskListOutcome = 'success'
  releaseGeneration()
  await expect(page.getByLabel('生成状态')).toContainText('已完成', { timeout: 6_000 })
  expect(state.requests.filter((item) => item.method === 'POST' && item.path === '/api/image-generate')).toHaveLength(1)
})
