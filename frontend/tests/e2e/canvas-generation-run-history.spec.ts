import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveGenerationRunHistory } from '../../src/modules/canvas/generation-run-history'
import type { ProjectGenerationTask } from '../../src/modules/canvas/project-resource-types'
import { createResourceMockState, documentPatches, FIRST_CANVAS_ID, openResourceWorkspace, PROJECT_ID } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-027-run-history')

function task(id: string, createdAt: string, overrides: Partial<ProjectGenerationTask> = {}): ProjectGenerationTask {
  return {
    id, user_id: 'user', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: 'generation-cover',
    media_type: 'image', provider: 'mock', model: 'mock-image-v1', provider_request_id: null,
    status: 'succeeded', duration_ms: 1200, result_asset_id: null, error_code: null, error_message: null,
    created_at: createdAt, updated_at: createdAt, ...overrides,
  }
}

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开项目资源' }).click()
  const taskHistoryResponse = page.waitForResponse((response) => (
    response.request().method() === 'GET' && response.url().includes('/api/generation-tasks?')
  ))
  await page.getByRole('tab', { name: '生成记录' }).click()
  await taskHistoryResponse
  await page.getByRole('button', { name: '关闭项目资源' }).click()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()
}

test('pure run history is node-scoped, newest-first, stable, capped, and reports total', () => {
  const tasks = [
    task('old', '2026-07-14T08:00:00Z'),
    task('same-a', '2026-07-14T09:00:00Z'),
    task('foreign', '2026-07-14T11:00:00Z', { canvas_node_id: 'other-node' }),
    task('same-b', '2026-07-14T09:00:00Z'),
    task('new', '2026-07-14T10:00:00Z'),
  ]
  const history = resolveGenerationRunHistory('generation-cover', tasks, 3)
  expect(history.total).toBe(4)
  expect(history.runs.map((run) => [run.task.id, run.sequence])).toEqual([
    ['new', 4], ['same-b', 3], ['same-a', 2],
  ])
  expect(resolveGenerationRunHistory('generation-cover', tasks, 0)).toEqual({ runs: [], total: 0 })
})

test('generation inspector shows five mixed-status runs without mutation', async ({ page }) => {
  const state = createResourceMockState()
  state.tasks = [
    task('run-1', '2026-07-14T01:00:00Z'),
    task('run-2', '2026-07-14T02:00:00Z', { status: 'failed', duration_ms: 830, error_message: 'Provider rejected an intentionally long cinematic request because the upstream reference became unavailable after validation.' }),
    task('run-3', '2026-07-14T03:00:00Z', { status: 'timed_out', duration_ms: 30000 }),
    task('run-4', '2026-07-14T04:00:00Z', { status: 'queued', duration_ms: null }),
    task('run-5', '2026-07-14T05:00:00Z', { status: 'running', duration_ms: null, media_type: 'video', model: 'mock-video-v2' }),
    task('run-6', '2026-07-14T06:00:00Z', { status: 'succeeded', duration_ms: 2450 }),
    task('foreign', '2026-07-14T07:00:00Z', { canvas_node_id: 'other-generation' }),
  ]
  await openResourceWorkspace(page, state)
  await selectGeneration(page)

  await page.getByText('运行记录').click()
  const history = page.getByRole('list', { name: '生成运行记录' })
  await expect(history.locator('li')).toHaveCount(5)
  await expect(history.locator('li').first()).toContainText('Run 6 · 已完成')
  await expect(history).toContainText('Run 5 · 生成中')
  await expect(history).toContainText('Run 4 · 排队中')
  await expect(history).toContainText('Run 3 · 已超时')
  await expect(history).toContainText('Run 2 · 失败')
  await expect(history).not.toContainText('foreign')
  await expect(page.getByText('仅显示最近 5 次')).toBeVisible()
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.requests.filter((request) => request.path.includes('generate'))).toHaveLength(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'mixed-run-history-1440x900.png'), fullPage: true })
})

test('readonly mobile history is bounded and empty history stays absent', async ({ page }) => {
  const state = createResourceMockState()
  state.tasks = [task('run-readonly', '2026-07-14T06:00:00Z', { status: 'failed', error_message: 'A'.repeat(500) })]
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectGeneration(page)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const patchBaseline = documentPatches(state).length
  await page.getByText('运行记录').click()
  const history = page.getByRole('list', { name: '生成运行记录' })
  await expect(history).toBeVisible()
  const box = await history.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(375)
  expect(documentPatches(state)).toHaveLength(patchBaseline)

  state.tasks = state.tasks.map((item) => ({ ...item, canvas_node_id: 'other-generation' }))
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectGeneration(page)
  await expect(page.getByText('运行记录')).toHaveCount(0)
})
