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
  expect(card.visualHeight).toBe(128)
  expect(card.slots.status).toEqual({ x: 0, y: 98, width: 340, height: 30 })
  expect(card.slots.progress).toEqual({ x: 0, y: 125, width: 340, height: 3 })

  const persisting = resolveGenerationRuntimePresentations(
    [node], [generationTask({ progress_percent: 83, progress_stage: 'persisting' })],
    new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  ).get(node.id)!
  expect(persisting).toMatchObject({ label: '正在保存结果', progressPercent: 83 })
})

test('Inspector and Graph Access track indeterminate, monotonic provider progress, persistence, and success without graph writes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  source.content = { ...(source.content as Record<string, unknown>), subtype: 'video' }
  state.tasks = [generationTask(), ...state.tasks]
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
    state.tasks = state.tasks.map((item) => item.id === 'task-progress'
      ? { ...item, progress_percent: percent, updated_at: `2026-07-16T${updatedAt}:00Z` }
      : item)
    await expect(progress).toHaveAttribute('value', String(percent), { timeout: 6_000 })
    await expect(page.locator('.generation-editor').getByText(`${percent}%`, { exact: true })).toBeVisible()
  }

  state.tasks = state.tasks.map((item) => item.id === 'task-progress'
    ? { ...item, progress_stage: 'persisting', updated_at: '2026-07-16T08:04:00Z' }
    : item)
  await expect(status).toContainText('正在保存结果', { timeout: 6_000 })

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('button', { name: '选择并定位 封面生成' })).toContainText('正在保存结果 · 83%')
  await page.getByRole('button', { name: '关闭画布内容与快捷键' }).click()

  await progress.scrollIntoViewIfNeeded()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'video-persisting-1440x900.png'), fullPage: true })

  state.tasks = state.tasks.map((item) => item.id === 'task-progress'
    ? { ...item, status: 'succeeded', progress_percent: 100, result_asset_id: 'asset-existing', updated_at: '2026-07-16T08:05:00Z' }
    : item)
  await expect(status).toContainText('已完成', { timeout: 6_000 })
  await expect(progress).toHaveAttribute('value', '100')
  expect(documentPatches(state)).toHaveLength(patchBaseline)
  expect(state.requests.filter((item) => item.method === 'POST' && item.path === '/api/video-generate')).toHaveLength(postBaseline)
})

test('image progress stays indeterminate without a provider percentage and timeout preserves the last valid value', async ({ page }) => {
  const state = createResourceMockState()
  state.tasks = [generationTask({
    id: 'task-image-progress', media_type: 'image', model: 'mock-image-v1',
    progress_percent: null, progress_stage: 'provider',
  }), ...state.tasks]
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

  state.tasks = state.tasks.map((item) => item.id === 'task-image-progress'
    ? {
        ...item,
        status: 'timed_out',
        progress_percent: 47,
        error_code: 'timeout',
        error_message: 'Provider timed out after the last measured progress',
        updated_at: '2026-07-16T08:06:00Z',
      }
    : item)
  await expect(page.getByLabel('生成状态')).toContainText('已超时', { timeout: 6_000 })
  await expect(progress).toHaveAttribute('value', '47')
  expect(documentPatches(state)).toHaveLength(patchBaseline + 1)
  expect(documentPatches(state).at(-1)?.body?.node_upserts).toEqual([
    expect.objectContaining({
      id: 'generation-cover',
      content: expect.objectContaining({ generation_status: 'timed_out', generation_task_id: 'task-image-progress' }),
    }),
  ])
})

test('failure keeps the last truthful percentage and never claims completion', async ({ page }) => {
  const state = createResourceMockState()
  state.tasks = [generationTask({
    media_type: 'image', status: 'failed', progress_percent: 47, error_code: 'provider_error',
    error_message: 'Provider stopped before completion',
  }), ...state.tasks]
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectGenerationNode(page)

  await expect(page.getByLabel('生成状态')).toContainText('失败')
  await expect(page.getByRole('progressbar', { name: '生成进度' })).toHaveAttribute('value', '47')
  await expect(page.getByText('47%', { exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Provider stopped before completion')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'failure-preserved-920x900.png'), fullPage: true })
})
