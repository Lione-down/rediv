import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  resolveGenerationJobResultProjections,
  resolveGenerationResultPlacement,
  resolveGenerationResultProjections,
  resolveTerminalGenerationResultPlacement,
} from '../../src/modules/canvas/generation-result-projection'
import type { GenerationJobStatus } from '../../src/modules/canvas/generation-job-api'
import type { LocalGenerationRuntimeRequest } from '../../src/modules/canvas/generation-runtime-presentation'
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

const NOW = '2026-07-16T10:00:00Z'
const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-078-pending-result')

function source(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'generation-cover', type: 'generation', title: '封面生成', x: 100, y: 120,
    width: 340, height: 220,
    contentData: { subtype: 'image', serialization_version: 1 },
    ...overrides,
  }
}

function task(id: string, overrides: Partial<ProjectGenerationTask> = {}): ProjectGenerationTask {
  return {
    id, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: 'generation-cover', media_type: 'image', provider: 'mock', model: 'mock-image-v1',
    provider_request_id: `provider-${id}`, status: 'running', progress_percent: null,
    progress_stage: 'provider', duration_ms: null, result_asset_id: null,
    error_code: null, error_message: null, request_parameters: null,
    created_at: NOW, updated_at: NOW,
    ...overrides,
  }
}

function localRequest(knownTaskIds: string[] = []): LocalGenerationRuntimeRequest {
  return {
    id: 'local-request', projectId: PROJECT_ID, canvasId: FIRST_CANVAS_ID,
    nodeId: 'generation-cover', mediaType: 'image', knownTaskIds,
  }
}

function compactJob(
  jobId: string,
  overrides: Partial<GenerationJobStatus> = {},
): GenerationJobStatus {
  return {
    job_id: jobId,
    node_id: 'generation-cover',
    media_type: 'image',
    status: 'running',
    stage: 'provider',
    progress: 47,
    error: null,
    result_asset_id: null,
    version: 2,
    updated_at: NOW,
    ...overrides,
  }
}

function bindCompactJob(
  state: ResourceMockState,
  jobId: string,
  overrides: Partial<GenerationJobStatus> = {},
) {
  const status = compactJob(jobId, overrides)
  const sourceNode = state.documents[FIRST_CANVAS_ID].nodes.find(
    (node) => node.id === status.node_id,
  )!
  sourceNode.content = {
    ...(sourceNode.content as Record<string, unknown>),
    subtype: status.media_type,
    active_generation_job_id: jobId,
    active_generation_media_type: status.media_type,
  }
  state.generationJobCanvasIds[jobId] = FIRST_CANVAS_ID
  state.generationJobs[jobId] = status
}

async function selectGeneration(page: Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()
}

test('shared placement handles canonical geometry, tall blockers, stable virtual slots, and terminal handoff', () => {
  const generation = source()
  expect(resolveGenerationResultPlacement(generation, 'image', [generation])).toMatchObject({
    x: 536, y: 120, width: 360, height: 280,
  })

  const tallBlocker: CanvasNode = {
    id: 'tall', type: 'note', title: 'Tall', x: 520, y: 100, width: 390, height: 900,
    contentData: { subtype: 'annotation', serialization_version: 1 },
  }
  expect(resolveGenerationResultPlacement(generation, 'video', [generation, tallBlocker])).toMatchObject({
    x: 536, y: 1032, width: 360, height: 280,
  })

  const older = task('task-a', { created_at: '2026-07-16T10:00:00Z' })
  const newer = task('task-b', { created_at: '2026-07-16T10:01:00Z', progress_percent: 47 })
  const projections = resolveGenerationResultProjections(
    [generation], [newer, older], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  )
  expect(projections.map((item) => ({ taskId: item.taskId, x: item.x, y: item.y }))).toEqual([
    { taskId: 'task-a', x: 536, y: 120 },
    { taskId: 'task-b', x: 536, y: 424 },
  ])
  expect(projections[1].presentation).toMatchObject({ label: '模型生成中', progressPercent: 47 })

  const terminal = { ...newer, status: 'succeeded' as const, progress_percent: 100, result_asset_id: 'asset-b' }
  expect(resolveGenerationResultProjections(
    [generation], [older, terminal], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  ).map((item) => item.taskId)).toEqual(['task-a'])
  expect(resolveTerminalGenerationResultPlacement(
    terminal, [generation], [older, terminal], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  )).toMatchObject({ x: 536, y: 424 })
})

test('local projection yields to a newly discovered strict task and ignores missing or foreign sources', () => {
  const generation = source()
  const prior = task('task-prior', { status: 'succeeded', result_asset_id: 'asset-prior' })
  const local = new Map([[generation.id, localRequest([prior.id])]])
  expect(resolveGenerationResultProjections(
    [generation], [prior], local, PROJECT_ID, FIRST_CANVAS_ID,
  )).toEqual([expect.objectContaining({ key: 'local:local-request', taskId: null, mediaType: 'image' })])

  const discovered = task('task-new', { status: 'queued', progress_stage: 'queued' })
  expect(resolveGenerationResultProjections(
    [generation], [prior, discovered], local, PROJECT_ID, FIRST_CANVAS_ID,
  )).toEqual([expect.objectContaining({ key: 'task:task-new', taskId: 'task-new' })])
  expect(resolveGenerationResultProjections(
    [], [discovered], local, PROJECT_ID, FIRST_CANVAS_ID,
  )).toEqual([])
  expect(resolveGenerationResultProjections(
    [generation], [{ ...discovered, origin_canvas_id: 'foreign-canvas' }], new Map(), PROJECT_ID, FIRST_CANVAS_ID,
  )).toEqual([])
})

test('compact pending projection requires the exact persisted card binding and ignores terminal or mismatched jobs', () => {
  const generation = source({
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      active_generation_job_id: 'job-current',
      active_generation_media_type: 'image',
    },
  })
  expect(resolveGenerationJobResultProjections(
    [generation],
    [
      compactJob('job-current'),
      compactJob('job-unbound'),
      compactJob('job-terminal', { status: 'succeeded', progress: 100 }),
      compactJob('job-wrong-node', { node_id: 'foreign-node' }),
    ],
  )).toEqual([
    expect.objectContaining({
      key: 'job:job-current',
      sourceNodeId: generation.id,
      taskId: 'job-current',
      mediaType: 'image',
      presentation: expect.objectContaining({
        source: 'job',
        phase: 'running',
        progressPercent: 47,
      }),
    }),
  ])
})

test('recovered compact job keeps its virtual slot stable across status versions', async ({ page }) => {
  const state = createResourceMockState()
  bindCompactJob(state, 'job-active')
  await openResourceWorkspace(page, state, { width: 1440, height: 1300 })

  const pending = page.locator('[data-pending-generation]')
  await expect(pending).toHaveCount(1)
  const before = await pending.evaluateAll((elements) => elements.map((element) => ({
    x: Number((element as HTMLElement).dataset.worldX),
    y: Number((element as HTMLElement).dataset.worldY),
  })))

  state.generationJobs['job-active'] = {
    ...state.generationJobs['job-active'],
    progress: 73,
    version: 3,
    updated_at: '2026-07-16T10:03:00Z',
  }
  await expect(pending.getByText('73%', { exact: true })).toBeVisible({ timeout: 6_000 })
  const after = await pending.evaluateAll((elements) => elements.map((element) => ({
    x: Number((element as HTMLElement).dataset.worldX),
    y: Number((element as HTMLElement).dataset.worldY),
  })))
  expect(after).toEqual(before)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'dense-active-slots-1440x1300.png'), fullPage: true })
})

test('pending reservation follows the saved world transform at 10, 100, and 800 percent zoom', async ({ page }) => {
  const state = createResourceMockState()
  bindCompactJob(state, 'job-zoom')

  for (const zoom of [0.1, 1, 8]) {
    state.canvases[0].viewport_zoom = zoom
    if (page.url() === 'about:blank') {
      await openResourceWorkspace(page, state, { width: 1440, height: 900 })
    } else {
      await page.reload()
    }
    const pending = page.locator('[data-pending-generation]')
    await expect(pending).toHaveCount(1)
    await expect.poll(() => pending.evaluate((element) => getComputedStyle(element).transform)).toBe(
      `matrix(${zoom}, 0, 0, ${zoom}, 0, 0)`,
    )
  }
})

test('pending image appears immediately and hands off at the exact canonical position', async ({ page }) => {
  const state = createResourceMockState()
  const sourceNode = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'generation-cover')!
  sourceNode.position_x = -200
  sourceNode.position_y = 260
  let releaseGeneration!: () => void
  state.generationGate = new Promise<void>((resolvePromise) => { releaseGeneration = resolvePromise })
  await openResourceWorkspace(page, state, { width: 2048, height: 1080 })
  await selectGeneration(page)

  const post = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/api/image-generate'))
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await post
  const pending = page.locator('[data-pending-generation]')
  await expect(pending).toHaveCount(1)
  await expect(pending).toContainText('图片生成中')
  await expect(pending).toContainText('正在提交')
  await expect(pending).toHaveCSS('pointer-events', 'none')
  const predicted = await pending.evaluate((element) => ({
    x: Number((element as HTMLElement).dataset.worldX),
    y: Number((element as HTMLElement).dataset.worldY),
  }))
  const patchBaseline = documentPatches(state).length
  const minimapBaseline = await page.locator('.minimap-node').count()

  expect(documentPatches(state)).toHaveLength(patchBaseline)
  expect(await page.locator('.minimap-node').count()).toBe(minimapBaseline)
  expect(await pending.getByRole('button').count()).toBe(0)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  const graphAccess = page.getByRole('dialog', { name: '画布内容与快捷键' })
  await expect(graphAccess.getByRole('button', { name: /^选择并定位 / })).toHaveCount(3)
  await expect(graphAccess.getByText('图片生成中', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '关闭画布内容与快捷键' }).click()

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'image-pending-2048x1080.png'), fullPage: true })
  releaseGeneration()
  await expect(pending).toHaveCount(0, { timeout: 6_000 })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((node) => node.node_type === 'result').length).toBe(2)
  const result = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    node.node_type === 'result' && String((node.content as Record<string, unknown>).source_task_id).startsWith('task-success')
  ))!
  expect({ x: result.position_x, y: result.position_y }).toEqual(predicted)
  await page.screenshot({ path: resolve(evidenceDirectory, 'image-result-handoff-2048x1080.png'), fullPage: true })
})

test('failure and readonly reload remove or reconstruct only the passive projection', async ({ page }) => {
  const state = createResourceMockState()
  bindCompactJob(state, 'job-recovered', {
    media_type: 'video',
    progress: 83,
    stage: 'persisting',
  })
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  const pending = page.locator('[data-pending-generation]')
  await expect(pending).toHaveCount(1)
  await expect(pending).toContainText('视频生成中')
  await expect(pending).toContainText('正在保存结果')
  await expect(pending).toContainText('83%')
  await expect(pending).toHaveAttribute('aria-hidden', 'true')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'video-recovered-375x812.png'), fullPage: true })

  const patchBaseline = documentPatches(state).length
  state.generationJobs['job-recovered'] = {
    ...state.generationJobs['job-recovered'],
    status: 'failed',
    stage: null,
    progress: null,
    error: 'mock failure',
    version: 3,
    updated_at: '2026-07-16T10:03:00Z',
  }
  await expect(pending).toHaveCount(0, { timeout: 6_000 })
  expect(documentPatches(state)).toHaveLength(patchBaseline)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    node.node_type === 'result' && (node.content as Record<string, unknown>).source_task_id === 'job-recovered'
  ))).toHaveLength(0)
})
