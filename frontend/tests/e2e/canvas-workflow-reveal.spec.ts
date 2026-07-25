import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  canvasNodeWorldRect,
  revealWorldRectViewport,
  type ViewportInsets,
} from '../../src/components/canvas/canvas-geometry'
import type { CanvasNode, CanvasViewport } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-034-workflow-reveal')
const now = '2026-07-15T10:00:00Z'

function node(
  id: string,
  type: string,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
  content: Record<string, unknown>,
) {
  return {
    id, project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID, node_type: type,
    content: { title, ...content }, position_x: x, position_y: y, width, height,
    z_index: 0, parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
    created_at: now, updated_at: now,
  }
}

function addResultAssets(state: ResourceMockState) {
  const generated = state.assets.find((asset) => asset.id === 'asset-generated')!
  state.assets.push(
    { ...generated, id: 'asset-reveal-a', canvas_node_id: 'result-reveal-a', source_task_id: 'task-reveal-a' },
    { ...generated, id: 'asset-reveal-b', canvas_node_id: 'result-reveal-b', source_task_id: 'task-reveal-b' },
  )
}

function configureComposition(state: ResourceMockState, tallBlocker = true) {
  state.documents[FIRST_CANVAS_ID] = {
    nodes: [
      node('script-reveal', 'script', '镜头约束', 80, 160, 320, 200, {
        subtype: 'script', serialization_version: 1, text: '保持景别，缓慢推进。',
      }),
      node('result-reveal-a', 'result', '海岸结果 A', 460, 160, 320, 180, {
        subtype: 'image', serialization_version: 1, asset_id: 'asset-reveal-a', width: 320, height: 180,
      }),
      node('result-reveal-b', 'result', '海岸结果 B', 80, 430, 320, 180, {
        subtype: 'image', serialization_version: 1, asset_id: 'asset-reveal-b', width: 320, height: 180,
      }),
      ...(tallBlocker ? [node('tall-blocker', 'note', '纵向分镜区', 876, 285, 340, 1200, {
        subtype: 'annotation', serialization_version: 1, text: '保留纵向分镜。',
      })] : []),
    ],
    connections: [],
  }
  addResultAssets(state)
}

function configureBranch(state: ResourceMockState) {
  state.documents[FIRST_CANVAS_ID] = {
    nodes: [
      node('result-branch-reveal', 'result', '待续写结果', 460, 160, 320, 180, {
        subtype: 'image', serialization_version: 1, asset_id: 'asset-reveal-a', width: 320, height: 180,
      }),
      node('branch-blocker', 'note', '纵向镜头区', 876, 160, 340, 1200, {
        subtype: 'annotation', serialization_version: 1, text: '保留已有镜头。',
      }),
    ],
    connections: [],
  }
  addResultAssets(state)
}

function viewportPatches(state: ResourceMockState) {
  return state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith(`/canvases/${FIRST_CANVAS_ID}/viewport`)
  ))
}

function currentViewport(state: ResourceMockState): CanvasViewport {
  const latest = viewportPatches(state).at(-1)?.body
  if (latest) return { x: Number(latest.x), y: Number(latest.y), zoom: Number(latest.zoom) }
  const canvas = state.canvases.find((item) => item.id === FIRST_CANVAS_ID)!
  return { x: Number(canvas.viewport_x), y: Number(canvas.viewport_y), zoom: Number(canvas.viewport_zoom) }
}

function canvasNode(record: Record<string, unknown>): CanvasNode {
  return {
    id: String(record.id), type: String(record.node_type),
    title: String((record.content as Record<string, unknown>).title),
    x: Number(record.position_x), y: Number(record.position_y),
    width: Number(record.width), height: Number(record.height),
    contentData: record.content as Record<string, unknown>,
  }
}

async function surfaceSize(page: Page) {
  return page.locator('.canvas-surface').evaluate((element) => ({
    width: (element as HTMLElement).clientWidth,
    height: (element as HTMLElement).clientHeight,
  }))
}

async function selectCompositionSources(page: Page, state: ResourceMockState) {
  void state
  const select = (name: string, ctrlKey = false) => page.getByRole('button', { name, exact: true })
    .dispatchEvent('pointerdown', { button: 0, ctrlKey, pointerId: 1 })
  await select('镜头约束')
  await select('海岸结果 A', true)
  await select('海岸结果 B', true)
  const toolbar = page.getByRole('toolbar', { name: '3 个已选节点的操作' })
  await toolbar.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  return page.getByRole('menu', { name: '选择生成任务类型' })
}

async function expectExactReveal(
  page: Page,
  state: ResourceMockState,
  before: CanvasViewport,
  nodeRecord: Record<string, unknown>,
  insets: ViewportInsets,
) {
  const expected = revealWorldRectViewport(
    canvasNodeWorldRect(canvasNode(nodeRecord), 'content'), before, await surfaceSize(page), insets,
  )
  await expect.poll(() => viewportPatches(state).length).toBeGreaterThan(0)
  expect(currentViewport(state)).toEqual(expected)
  expect(currentViewport(state).zoom).toBe(before.zoom)
}

test('offscreen multi-result composition minimally reveals once and history stays camera-neutral', async ({ page }) => {
  const state = createResourceMockState()
  configureComposition(state)
  await openResourceWorkspace(page, state)
  const menu = await selectCompositionSources(page, state)
  const before = currentViewport(state)
  const viewportCount = viewportPatches(state).length
  await menu.getByRole('menuitem', { name: '视频生成' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.node_type === 'generation')!
  await expectExactReveal(page, state, before, generation, { top: 96, right: 16, bottom: 96, left: 16 })
  expect(viewportPatches(state)).toHaveLength(viewportCount + 1)
  await expect(page.locator('.generation-editor')).toBeVisible()
  await expect(page.getByRole('toolbar', { name: '1 个已选节点的操作' })).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'composed-workflow-revealed-1440x900.png'), fullPage: true })

  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generation.id)).toBe(false)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generation.id)).toBe(true)
  await page.reload()
  await page.waitForTimeout(350)
  expect(viewportPatches(state)).toHaveLength(viewportCount + 1)
})

test('920px result branch reveal respects the overlay drawer inset', async ({ page }) => {
  const state = createResourceMockState()
  configureBranch(state)
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await page.locator('.canvas-surface').click({ position: { x: 560, y: 250 } })
  const before = currentViewport(state)
  const branch = page.locator('.result-branch')
  await branch.locator('summary').click()
  await branch.getByRole('button', { name: /视频生成/ }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.node_type === 'generation')!
  await expectExactReveal(page, state, before, generation, { top: 96, right: 376, bottom: 96, left: 16 })
  const editor = page.locator('.generation-editor')
  await expect(editor).toBeVisible()
  const rect = await page.locator(`.canvas-node-surface[data-node-id="${generation.id}"]`).boundingBox()
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(544)
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-branch-revealed-920x900.png'), fullPage: true })
})

test('already-visible composition stays still while autosave failure keeps the local workflow revealed', async ({ page }) => {
  const visibleState = createResourceMockState()
  visibleState.canvases[0].viewport_zoom = 0.25
  visibleState.canvases[0].viewport_x = 200
  visibleState.canvases[0].viewport_y = 150
  configureComposition(visibleState, false)
  await openResourceWorkspace(page, visibleState)
  const visibleMenu = await selectCompositionSources(page, visibleState)
  const visibleCount = viewportPatches(visibleState).length
  await visibleMenu.getByRole('menuitem', { name: '图片生成' }).click()
  await expect.poll(() => documentPatches(visibleState).length).toBe(1)
  await page.waitForTimeout(350)
  expect(viewportPatches(visibleState)).toHaveLength(visibleCount)

  const failedState = createResourceMockState()
  configureComposition(failedState)
  await openResourceWorkspace(page, failedState)
  const failedMenu = await selectCompositionSources(page, failedState)
  const failedCount = viewportPatches(failedState).length
  await page.route(`**/api/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}/document`, async (route) => {
    if (route.request().method() === 'PATCH') return route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"mock document failure"}' })
    return route.fallback()
  })
  await failedMenu.getByRole('menuitem', { name: '视频生成' }).click()
  await page.waitForTimeout(500)
  expect(failedState.documents[FIRST_CANVAS_ID].nodes.some((item) => item.node_type === 'generation')).toBe(false)
  expect(viewportPatches(failedState)).toHaveLength(failedCount + 1)
  await expect(page.locator('.generation-editor')).toBeVisible()
  await expect(page.getByRole('button', { name: /画布未保存/ })).toBeEnabled()
})

test('readonly mobile creation remains unavailable and camera-neutral', async ({ page }) => {
  const state = createResourceMockState()
  configureComposition(state)
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await page.waitForTimeout(1_000)
  const viewportCount = viewportPatches(state).length
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  await expect(page.locator('.result-branch')).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  await page.waitForTimeout(350)
  expect(viewportPatches(state)).toHaveLength(viewportCount)
})
