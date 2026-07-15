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

function visualHeight(node: Record<string, unknown>) {
  const content = node.content as Record<string, unknown>
  const ratio = Number(content.aspect_ratio)
  return Number.isFinite(ratio) && ratio > 0 ? Number(node.width) / ratio : Number(node.height)
}

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()
  await expect(page.locator('.generation-editor')).toBeVisible()
}

test('foreground results form a visible variant column without changing zoom or selection', async ({ page }) => {
  const state = createResourceMockState()
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  generation.position_x = 840
  generation.position_y = 180
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  await expect.poll(() => viewportPatches(state).length).toBeGreaterThan(0)
  await page.locator('.view-controls > button').first().click()
  await expect(page.locator('.resource-panel-shell')).toBeVisible()
  await page.waitForTimeout(250)

  const initialViewport = latestViewport(state)
  const editor = page.locator('.generation-editor')
  await editor.locator('.generate-button').click()
  await expect.poll(() => generatedResults(state).length).toBe(1)
  await expect(editor).toBeVisible()
  await expect.poll(() => latestViewport(state).x).not.toBe(initialViewport.x)
  expect(latestViewport(state).zoom).toBe(initialViewport.zoom)

  const first = generatedResults(state)[0]
  const firstViewport = latestViewport(state)
  const firstLeft = Number(first.position_x) * firstViewport.zoom + firstViewport.x
  const firstRight = firstLeft + Number(first.width) * firstViewport.zoom
  expect(firstLeft).toBeGreaterThanOrEqual(40)
  expect(firstRight).toBeLessThanOrEqual(672)

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
  const secondViewport = latestViewport(state)
  const secondTop = Number(secondPersisted.position_y) * secondViewport.zoom + secondViewport.y
  const secondBottom = secondTop + visualHeight(secondPersisted) * secondViewport.zoom
  expect(secondTop).toBeGreaterThanOrEqual(120)
  expect(secondBottom).toBeLessThanOrEqual(780)
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
  await page.locator('.generation-editor .generate-button').click()
  await expect.poll(() => generatedResults(state).length).toBe(1)
  await page.waitForTimeout(350)
  const result = generatedResults(state)[0]
  const viewport = latestViewport(state)
  const left = Number(result.position_x) * viewport.zoom + viewport.x
  const right = left + Number(result.width) * viewport.zoom
  expect(left).toBeGreaterThanOrEqual(40)
  expect(right).toBeLessThanOrEqual(520)
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
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}$`))
  releaseGeneration()
  await expect.poll(() => state.tasks.some((item) => item.id === 'task-success')).toBe(true)

  await page.getByRole('button', { name: '分镜', exact: true }).click()
  await page.getByRole('option', { name: /画布 1/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${FIRST_CANVAS_ID}$`))
  await expect.poll(() => generatedResults(state).length).toBe(1)
  await page.waitForTimeout(350)
  expect(latestViewport(state)).toEqual(before)
  await expect(page.locator('.generation-editor')).toHaveCount(0)
})
