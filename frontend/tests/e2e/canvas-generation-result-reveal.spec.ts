import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  SECOND_CANVAS_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-031-result-reveal')

function generationPosts(state: ResourceMockState) {
  return state.requests.filter((item) => item.method === 'POST' && item.path === '/api/image-generate')
}

function viewportPatches(state: ResourceMockState, canvasId = FIRST_CANVAS_ID) {
  return state.requests.filter((item) => item.method === 'PATCH' && item.path.endsWith(`/canvases/${canvasId}/viewport`))
}

function latestViewport(state: ResourceMockState) {
  const body = viewportPatches(state).at(-1)?.body ?? {}
  return { x: Number(body.x), y: Number(body.y), zoom: Number(body.zoom) }
}

function generatedResults(state: ResourceMockState) {
  return state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    item.node_type === 'result' && String((item.content as Record<string, unknown>).source_task_id).startsWith('task-success')
  ))
}

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()
  await expect(page.locator('.generation-editor')).toBeVisible()
}

test('foreground results return to the originating card without changing zoom or selection', async ({ page }) => {
  const state = createResourceMockState()
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  generation.position_x = 840
  generation.position_y = 180
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  await expect.poll(() => viewportPatches(state).length).toBeGreaterThan(0)
  await page.locator('.view-controls > button').first().click()
  await expect(page.locator('.resource-panel-shell')).toBeVisible()
  const taskHistoryResponse = page.waitForResponse((response) => (
    response.request().method() === 'GET' && response.url().includes('/api/generation-tasks?')
  ))
  await page.getByRole('tab', { name: '生成记录' }).click()
  await taskHistoryResponse
  await page.getByRole('tab', { name: '项目资产' }).click()
  await page.waitForTimeout(250)

  const initialViewport = latestViewport(state)
  const editor = page.locator('.generation-editor')
  const sourceSurface = page.locator('.canvas-node-surface[data-node-id="generation-cover"]')
  await editor.locator('.generate-button').click()
  await expect.poll(() => generatedResults(state).length).toBe(1)
  await expect(editor).toBeVisible()
  await page.waitForTimeout(350)
  expect(latestViewport(state).zoom).toBe(initialViewport.zoom)
  await expect(sourceSurface.getByRole('img')).toBeVisible()

  const first = generatedResults(state)[0]
  await expect(page.locator(`.canvas-node-surface[data-node-id="${first.id}"]`)).toHaveCount(0)
  await editor.locator('.generate-button').click()
  await expect.poll(() => generationPosts(state).length).toBe(2)
  await expect.poll(() => generatedResults(state).length).toBe(2)
  await expect(editor).toBeVisible()
  const [firstPersisted, secondPersisted] = generatedResults(state)
  expect(secondPersisted.position_x).toBe(firstPersisted.position_x)
  expect(Number(secondPersisted.position_y)).toBeGreaterThan(
    Number(firstPersisted.position_y) + Number(firstPersisted.height),
  )
  await page.waitForTimeout(350)
  expect(latestViewport(state).zoom).toBe(initialViewport.zoom)
  await expect(sourceSurface.getByRole('img')).toBeVisible()
  await expect(page.locator(`.canvas-node-surface[data-node-id="${secondPersisted.id}"]`)).toHaveCount(0)
  await editor.locator('.run-history summary').click()
  await expect(editor.locator('.run-history')).toContainText('4 次')

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'two-visible-result-variants-1440x900.png'), fullPage: true })
  const positionsBeforeReload = generatedResults(state).map((item) => [item.id, item.position_x, item.position_y])
  await page.reload()
  await expect.poll(() => generatedResults(state).length).toBe(2)
  expect(generatedResults(state).map((item) => [item.id, item.position_x, item.position_y])).toEqual(positionsBeforeReload)
})

test('already-visible foreground result does not write an unnecessary viewport change', async ({ page }) => {
  const state = createResourceMockState()
  state.canvases[0].viewport_zoom = 0.25
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  await expect.poll(() => viewportPatches(state).length).toBeGreaterThan(0)
  await page.waitForTimeout(350)
  const before = latestViewport(state)
  await page.locator('.generation-editor .generate-button').click()
  await expect.poll(() => generatedResults(state).length).toBe(1)
  await page.waitForTimeout(350)
  expect(latestViewport(state)).toEqual(before)
})

test('920px drawer reveal keeps the foreground result in the unobscured Canvas area', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectGeneration(page)
  await expect(page.locator('.n-drawer:visible')).toBeVisible()
  await expect.poll(() => viewportPatches(state).length).toBeGreaterThan(0)
  const before = latestViewport(state)
  await page.locator('.generation-editor .generate-button').click()
  await expect.poll(() => generatedResults(state).length).toBe(1)
  await page.waitForTimeout(350)
  const viewport = latestViewport(state)
  const [sourceBox, drawerBox] = await Promise.all([
    page.locator('.canvas-node-surface[data-node-id="generation-cover"]').boundingBox(),
    page.locator('.n-drawer:visible').boundingBox(),
  ])
  if (!sourceBox || !drawerBox) throw new Error('Compact source-card reveal geometry is unavailable')
  expect(sourceBox.x).toBeGreaterThanOrEqual(24)
  expect(sourceBox.x + sourceBox.width).toBeLessThanOrEqual(drawerBox.x - 16)
  expect(viewport.zoom).toBe(before.zoom)
  await expect(page.locator('.canvas-node-surface[data-node-id="generation-cover"]').getByRole('img')).toBeVisible()
  await expect(page.locator('.generation-editor')).toBeVisible()
})

test('background reconciliation after a Canvas switch neither pans nor selects the result', async ({ page }) => {
  const state = createResourceMockState()
  let releaseGeneration!: () => void
  state.generationGate = new Promise<void>((resolvePromise) => {
    releaseGeneration = resolvePromise
  })
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  await expect.poll(() => viewportPatches(state).length).toBeGreaterThan(0)
  const before = latestViewport(state)
  await page.locator('.generation-editor .generate-button').click()
  await expect.poll(() => generationPosts(state).length).toBe(1)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}\\?canvas_runtime=legacy$`))
  releaseGeneration()
  await expect.poll(() => state.tasks.some((item) => item.id === 'task-success')).toBe(true)

  await page.getByRole('button', { name: '分镜', exact: true }).click()
  await page.getByRole('option', { name: /画布 1/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${FIRST_CANVAS_ID}\\?canvas_runtime=legacy$`))
  await expect.poll(() => generatedResults(state).length).toBe(1)
  await page.waitForTimeout(350)
  expect(latestViewport(state)).toEqual(before)
  await expect(page.locator('.generation-editor')).toHaveCount(0)
})
