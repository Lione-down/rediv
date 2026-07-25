import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveCanvasAuthoringCardPresentation } from '../../src/components/canvas/canvas-authoring-card-presentation'
import { resolveGenerationRuntimePresentations } from '../../src/modules/canvas/generation-runtime-presentation'
import type { ProjectGenerationTask } from '../../src/modules/canvas/project-resource-types'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const NOW = '2026-07-16T08:00:00Z'
const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-077-generation-progress')

function generationNode(): CanvasNode {
  return {
    id: 'generation-cover', type: 'generation', title: '封面生成', x: 0, y: 0,
    width: 340, height: 220,
    contentData: { subtype: 'video', serialization_version: 1 },
  }
}

function generationTask(overrides: Partial<ProjectGenerationTask> = {}): ProjectGenerationTask {
  return {
    id: 'task-progress', user_id: 'user-resource', project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: 'generation-cover', media_type: 'video',
    provider: 'mock', model: 'mock-video-v1', provider_request_id: 'provider-progress',
    request_parameters: null, status: 'running', progress_percent: null, progress_stage: 'provider',
    duration_ms: null, result_asset_id: null, error_code: null, error_message: null,
    created_at: NOW, updated_at: NOW,
    ...overrides,
  }
}

function bindCompactGenerationJob(state: ResourceMockState, task: ProjectGenerationTask) {
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === task.canvas_node_id)!
  source.content = {
    ...(source.content as Record<string, unknown>),
    active_generation_job_id: task.id,
    active_generation_media_type: task.media_type,
  }
  state.generationJobCanvasIds[task.id] = FIRST_CANVAS_ID
  state.generationJobs[task.id] = {
    job_id: task.id,
    node_id: task.canvas_node_id,
    media_type: task.media_type,
    status: task.status,
    stage: task.progress_stage,
    progress: task.progress_percent,
    error: task.error_message,
    result_asset_id: task.result_asset_id,
    version: 1,
    updated_at: task.updated_at,
  }
}

function updateCompactGenerationJob(
  state: ResourceMockState,
  jobId: string,
  update: Record<string, unknown>,
) {
  const current = state.generationJobs[jobId]
  state.generationJobs[jobId] = {
    ...current,
    ...update,
    version: Number(current.version) + 1,
  }
}

async function selectGenerationNode(page: Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()
}

test('shared presentation keeps card geometry fixed and exposes truthful progress values', () => {
  const node = generationNode()
  const indeterminate = resolveGenerationRuntimePresentations(
    [node], [generationTask()], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  ).get(node.id)!
  expect(indeterminate).toMatchObject({ label: '模型生成中', progressPercent: null, progressStage: 'provider' })

  const determinate = resolveGenerationRuntimePresentations(
    [node], [generationTask({ progress_percent: 47 })], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  ).get(node.id)!
  const card = resolveCanvasAuthoringCardPresentation(node, determinate)!
  expect(card.lifecycle).toMatchObject({ label: '模型生成中', progressPercent: 47, isIndeterminate: false })
  expect(card.visualHeight).toBe(160)
  expect(card.slots.status).toEqual({ x: 0, y: 130, width: 340, height: 30 })
  expect(card.slots.progress).toEqual({ x: 0, y: 157, width: 340, height: 3 })

  const persisting = resolveGenerationRuntimePresentations(
    [node], [generationTask({ progress_percent: 83, progress_stage: 'persisting' })],
    new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  ).get(node.id)!
  expect(persisting).toMatchObject({ label: '正在保存结果', progressPercent: 83 })
})

test('Inspector and Graph Access track provider progress then apply one same-card terminal result', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  source.content = { ...(source.content as Record<string, unknown>), subtype: 'video' }
  bindCompactGenerationJob(state, generationTask())
  await openResourceWorkspace(page, state)
  await selectGenerationNode(page)

  const patchBaseline = documentPatches(state).length
  const postBaseline = state.requests.filter((item) => item.method === 'POST' && item.path === '/api/video-generate').length
  const status = page.getByLabel('生成状态')
  const progress = page.getByRole('progressbar', { name: '生成进度' })
  await expect(status).toContainText('模型生成中')
  await expect(progress).not.toHaveAttribute('value')
  await expect(page.getByText('进度由服务返回，当前未提供百分比')).toBeVisible()
  await expect(status.locator('.is-spinning')).toHaveCSS('animation-name', 'none')

  for (const [percent, updatedAt] of [[12, '08:01'], [47, '08:02'], [83, '08:03']] as const) {
    updateCompactGenerationJob(state, 'task-progress', {
      progress: percent,
      updated_at: `2026-07-16T${updatedAt}:00Z`,
    })
    await expect(progress).toHaveAttribute('value', String(percent), { timeout: 6_000 })
    await expect(page.locator('.generation-editor').getByText(`${percent}%`, { exact: true })).toBeVisible()
  }

  updateCompactGenerationJob(state, 'task-progress', {
    stage: 'persisting',
    updated_at: '2026-07-16T08:04:00Z',
  })
  await expect(status).toContainText('正在保存结果', { timeout: 6_000 })

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('button', { name: '选择并定位 封面生成' })).toContainText('正在保存结果 · 83%')
  await page.getByRole('button', { name: '关闭画布内容与快捷键' }).click()

  await progress.scrollIntoViewIfNeeded()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'video-persisting-1440x900.png'), fullPage: true })

  updateCompactGenerationJob(state, 'task-progress', {
    status: 'succeeded',
    progress: 100,
    result_asset_id: 'asset-existing',
    updated_at: '2026-07-16T08:05:00Z',
  })
  state.generationJobResults['task-progress'] = {
    job_id: 'task-progress',
    node_id: 'generation-cover',
    result: {
      asset_id: 'asset-existing',
      media_type: 'video',
      url: 'https://media.revid.test/progress-result.mp4',
    },
    version: Number(state.generationJobs['task-progress'].version),
  }
  await expect.poll(() => state.requests.filter((item) => (
    item.path === '/api/v2/generation-jobs/task-progress/result'
  )).length).toBe(1)
  await expect(status).toContainText('准备就绪', { timeout: 6_000 })
  await expect(progress).toHaveCount(0)
  await expect.poll(() => documentPatches(state).length).toBe(patchBaseline + 1)
  expect(state.requests.filter((item) => item.method === 'POST' && item.path === '/api/video-generate')).toHaveLength(postBaseline)
})

test('image progress stays indeterminate without a provider percentage and timeout preserves the last valid value', async ({ page }) => {
  const state = createResourceMockState()
  bindCompactGenerationJob(state, generationTask({
    id: 'task-image-progress', media_type: 'image', model: 'mock-image-v1',
    progress_percent: null, progress_stage: 'provider',
  }))
  await openResourceWorkspace(page, state)
  await selectGenerationNode(page)

  const patchBaseline = documentPatches(state).length
  const progress = page.getByRole('progressbar', { name: '生成进度' })
  await expect(page.getByLabel('生成状态')).toContainText('模型生成中')
  await expect(progress).not.toHaveAttribute('value')
  await expect(page.getByText('进度由服务返回，当前未提供百分比')).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'image-indeterminate-1440x900.png'), fullPage: true })
  expect(documentPatches(state)).toHaveLength(patchBaseline)

  updateCompactGenerationJob(state, 'task-image-progress', {
    status: 'timed_out',
    progress: 47,
    error: 'Provider timed out after the last measured progress',
    updated_at: '2026-07-16T08:06:00Z',
  })
  await expect(page.getByLabel('生成状态')).toContainText('已超时', { timeout: 6_000 })
  await expect(progress).toHaveAttribute('value', '47')
  expect(documentPatches(state)).toHaveLength(patchBaseline)
})

test('failure keeps the last truthful percentage and never claims completion', async ({ page }) => {
  const state = createResourceMockState()
  const failedTask = generationTask({
    media_type: 'image', status: 'failed', progress_percent: 47, error_code: 'provider_error',
    error_message: 'Provider stopped before completion',
  })
  bindCompactGenerationJob(state, failedTask)
  state.tasks = [failedTask, ...state.tasks]
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectGenerationNode(page)

  await expect(page.getByLabel('生成状态')).toContainText('失败')
  await expect(page.getByRole('progressbar', { name: '生成进度' })).toHaveAttribute('value', '47')
  await expect(page.getByText('47%', { exact: true })).toBeVisible()
  await expect(page.locator('.canvas-card-work-surface').getByRole('alert')).toContainText('Provider stopped before completion')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'failure-preserved-920x900.png'), fullPage: true })
})

test('history loading preserves the attached card as the single failed-job alert authority', async ({ page }) => {
  const state = createResourceMockState()
  const failedTask = generationTask({
    media_type: 'image', status: 'failed', progress_percent: 47, error_code: 'provider_error',
    error_message: 'Provider stopped before completion',
  })
  bindCompactGenerationJob(state, failedTask)
  state.tasks = [failedTask, ...state.tasks]
  await openResourceWorkspace(page, state, { width: 1366, height: 768 })
  await selectGenerationNode(page)
  const cardAlert = page.locator('.canvas-card-work-surface').getByRole('alert')
  await expect(cardAlert).toContainText('Provider stopped before completion')

  await page.getByRole('button', { name: '打开项目资源' }).click()
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await resources.getByRole('tab', { name: '生成记录' }).click()
  await expect(resources.getByText('task-progress', { exact: true })).toBeVisible()
  await resources.getByRole('button', { name: '关闭项目资源' }).click()

  await expect(page.getByRole('alert')).toHaveCount(1)
  await expect(cardAlert).toContainText('Provider stopped before completion')
})
