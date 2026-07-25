import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { createVisualState, installMockApi } from './authenticated-workflow-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'
const MEDIA_URL = 'http://127.0.0.1:9099/fixtures/t6-011-playable.mp4'
const COMPLETE_IMAGE_URL = 'https://media.revid.test/complete-frame.svg'

async function openReplacement(page: Page, state: ReturnType<typeof createVisualState>) {
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)
  return page.locator('[data-canvas-runtime="replacement"]')
}

async function center(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Element has no browser geometry')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function pathEndpoint(path: Locator, endpoint: 'start' | 'end') {
  return path.evaluate((element, target) => {
    const svgPath = element as SVGPathElement
    const point = svgPath.getPointAtLength(
      target === 'start' ? 0 : svgPath.getTotalLength(),
    )
    const matrix = svgPath.getScreenCTM()
    if (!matrix) throw new Error('SVG path has no screen transform')
    const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix)
    return { x: screen.x, y: screen.y }
  }, endpoint)
}

test('succeeded compact video result replaces the original card placeholder', async ({ page }) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  source.status = 'running'
  source.content = {
    ...source.content,
    title: 'Video Generation',
    subtype: 'video',
    content_revision: 0,
    active_generation_client_request_id: 'client-video-live',
    active_generation_job_id: 'job-video-live',
    active_generation_media_type: 'video',
  }
  const generationRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.includes('generation-job') || url.pathname.includes('generation-task')) {
      generationRequests.push(`${request.method()} ${url.pathname}${url.search}`)
    }
  })

  const fixturePath = fileURLToPath(new URL('../fixtures/t6-011-playable.mp4', import.meta.url))
  const media = await readFile(fixturePath)
  await page.route(MEDIA_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'video/mp4',
    body: media,
  }))
  await installMockApi(page, state)
  await page.route(
    'http://localhost:8000/api/v2/generation-jobs/job-video-live',
    (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-video-live',
        node_id: 'node-image',
        media_type: 'video',
        status: 'succeeded',
        stage: null,
        progress: 100,
        error: null,
        result_asset_id: 'asset-video-live',
        version: 2,
        updated_at: '2026-07-25T13:00:00Z',
      }),
    }),
  )
  await page.route(
    'http://localhost:8000/api/v2/generation-jobs/job-video-live/result',
    (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-video-live',
        node_id: 'node-image',
        result: {
          asset_id: 'asset-video-live',
          media_type: 'video',
          url: MEDIA_URL,
        },
        version: 2,
      }),
    }),
  )
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const sourceCard = runtime.locator('[data-runtime-node="node-image"]')
  await expect(sourceCard.locator('video')).toHaveAttribute('src', MEDIA_URL, { timeout: 8_000 })
  await expect(sourceCard.locator('[data-node-body]')).toHaveAttribute('data-media-state', 'video')
  await expect(runtime.locator('[data-runtime-node][data-node-kind="result"]')).toHaveCount(0)
  expect(generationRequests.some((request) => request.includes('/api/generation-tasks'))).toBe(false)
})

test('running bound job polls exact compact status without repeating Canvas discovery', async ({ page }) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  source.status = 'running'
  source.content = {
    ...source.content,
    title: 'Video Generation',
    subtype: 'video',
    active_generation_job_id: 'job-video-running',
    active_generation_media_type: 'video',
  }
  let exactStatusCalls = 0
  let canvasDeltaCalls = 0
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/api/v2/generation-jobs/job-video-running') exactStatusCalls += 1
    if (url.pathname === '/api/v2/projects/project-e2e/generation-jobs') canvasDeltaCalls += 1
  })

  await installMockApi(page, state)
  await page.route(
    'http://localhost:8000/api/v2/generation-jobs/job-video-running',
    (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-video-running',
        node_id: 'node-image',
        media_type: 'video',
        status: 'running',
        stage: 'provider',
        progress: exactStatusCalls >= 2 ? 48 : 17,
        error: null,
        result_asset_id: null,
        version: exactStatusCalls >= 2 ? 2 : 1,
        updated_at: '2026-07-25T13:00:00Z',
      }),
    }),
  )
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  await expect.poll(() => exactStatusCalls, { timeout: 8_000 }).toBeGreaterThanOrEqual(2)
  expect(canvasDeltaCalls).toBe(0)
  await expect(
    page.locator('[data-runtime-node="node-image"] [data-runtime-lifecycle] progress'),
  ).toHaveAttribute('value', '48')
})

test('image shows its complete frame and playable video controls stay unobstructed', async ({ page }) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  source.content = {
    ...source.content,
    asset_id: 'asset-complete-image',
    result_asset_id: 'asset-complete-image',
    asset_url: COMPLETE_IMAGE_URL,
    url: COMPLETE_IMAGE_URL,
  }
  state.canvasNodes.push({
    ...source,
    id: 'node-playable-video',
    status: 'running',
    position_x: 720,
    content: {
      ...source.content,
      title: 'Playable Video',
      subtype: 'video',
      asset_id: 'asset-playable-video',
      result_asset_id: 'asset-playable-video',
      asset_url: MEDIA_URL,
      url: MEDIA_URL,
      last_generation_job_id: 'job-playable-video',
    },
  })

  await page.route(COMPLETE_IMAGE_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160"><rect width="640" height="160" fill="#fff"/></svg>',
  }))
  const fixturePath = fileURLToPath(new URL('../fixtures/t6-011-playable.mp4', import.meta.url))
  const media = await readFile(fixturePath)
  await page.route(MEDIA_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'video/mp4',
    body: media,
  }))

  const runtime = await openReplacement(page, state)
  const image = runtime.locator('[data-runtime-node="node-image"] img')
  await expect(image).toBeVisible()
  expect(await image.evaluate((element) => getComputedStyle(element).objectFit)).toBe('contain')

  const videoCard = runtime.locator('[data-runtime-node="node-playable-video"]')
  await expect(videoCard.locator('video')).toHaveAttribute('controls', '')
  await expect(videoCard.locator('[data-runtime-lifecycle]')).toHaveCount(0)
  await page.screenshot({
    path: '../output/playwright/t6-011-r8m-complete-image-and-video-controls.png',
    fullPage: true,
  })
})

test('whole-card grab drag moves card-boundary SVG endpoints before pointer-up', async ({ page }) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  state.canvasNodes.push({
    ...source,
    id: 'node-target',
    content: {
      title: 'Video Generation',
      subtype: 'video',
      serialization_version: 1,
      text: 'Target',
    },
    position_x: 720,
  })
  state.canvasConnections = [{
    ...state.canvasConnections[0],
    id: 'connection-source-target',
    source_node_id: source.id,
    source_port: 'out',
    target_node_id: 'node-target',
    target_port: 'prompt',
  }]
  const runtime = await openReplacement(page, state)
  const sourceCard = runtime.locator('[data-runtime-node="node-image"]')
  const targetCard = runtime.locator('[data-runtime-node="node-target"]')
  const body = sourceCard.locator('[data-node-body]')
  const output = sourceCard.locator('[data-visible-port="output"]')
  const acquisition = sourceCard.locator('[data-port-acquisition="output"]')
  const edge = runtime.locator('[data-runtime-edge="connection-source-target"]')

  await expect(body).toHaveCSS('cursor', 'grab')
  const sourceBox = await sourceCard.boundingBox()
  const targetBox = await targetCard.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Cards have no browser geometry')
  const start = await pathEndpoint(edge, 'start')
  const end = await pathEndpoint(edge, 'end')
  expect(start.x).toBeCloseTo(sourceBox.x + sourceBox.width, 0)
  expect(start.y).toBeCloseTo(sourceBox.y + sourceBox.height / 2, 0)
  expect(end.x).toBeCloseTo(targetBox.x, 0)
  expect(end.y).toBeCloseTo(targetBox.y + targetBox.height / 2, 0)

  const acquisitionBox = await acquisition.boundingBox()
  if (!acquisitionBox) throw new Error('Output acquisition has no browser geometry')
  await page.mouse.move(acquisitionBox.x + 66, acquisitionBox.y + 56, { steps: 4 })
  const movedPlus = await center(output)
  const stableStart = await pathEndpoint(edge, 'start')
  expect(Math.hypot(stableStart.x - movedPlus.x, stableStart.y - movedPlus.y))
    .toBeGreaterThan(8)
  expect(stableStart.x).toBeCloseTo(sourceBox.x + sourceBox.width, 0)

  const bodyCenter = await center(body)
  await page.mouse.move(bodyCenter.x, bodyCenter.y)
  await page.mouse.down()
  await expect(body).toHaveCSS('cursor', 'grabbing')
  await page.mouse.move(bodyCenter.x + 90, bodyCenter.y + 55, { steps: 5 })
  const draggedBox = await sourceCard.boundingBox()
  if (!draggedBox) throw new Error('Dragged card has no browser geometry')
  expect(draggedBox.x - sourceBox.x).toBeCloseTo(90, 0)
  expect(draggedBox.y - sourceBox.y).toBeCloseTo(55, 0)
  const draggedStart = await pathEndpoint(edge, 'start')
  expect(draggedStart.x - stableStart.x).toBeCloseTo(90, 0)
  expect(draggedStart.y - stableStart.y).toBeCloseTo(55, 0)
  await page.mouse.up()
})

test('persisted and draft SVG edges stay below an intersecting card', async ({ page }) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  Object.assign(source, { position_x: 80, position_y: 280 })
  const occluder = {
    ...structuredClone(source),
    id: 'node-occluder',
    position_x: 500,
    content: {
      ...source.content,
      title: 'Occluding card',
      text: 'The graph line must remain behind this card.',
    },
  }
  const target = {
    ...structuredClone(source),
    id: 'node-target',
    position_x: 920,
    content: {
      ...source.content,
      title: 'Target card',
      subtype: 'video',
    },
  }
  state.canvasNodes = [source, occluder, target]
  state.canvasConnections = [{
    ...state.canvasConnections[0],
    id: 'connection-under-card',
    source_node_id: source.id,
    source_port: 'out',
    target_node_id: target.id,
    target_port: 'prompt',
  }]

  const runtime = await openReplacement(page, state)
  const edge = runtime.locator('[data-runtime-edge="connection-under-card"]')
  const edgeLayer = runtime.locator('.runtime-edge-layer')
  const nodeWorld = runtime.locator('.runtime-node-world')
  const occludingCard = runtime.locator('[data-runtime-node="node-occluder"]')
  await expect(edge).toHaveCount(1)
  await expect(occludingCard).toBeVisible()

  const intersection = await edge.evaluate((element, cardSelector) => {
    const path = element as SVGPathElement
    const matrix = path.getScreenCTM()
    const card = document.querySelector(cardSelector) as HTMLElement | null
    if (!matrix || !card) throw new Error('Missing edge/card geometry')
    const rect = card.getBoundingClientRect()
    for (let index = 0; index <= 100; index += 1) {
      const point = path.getPointAtLength(path.getTotalLength() * index / 100)
      const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix)
      if (
        screen.x >= rect.left && screen.x <= rect.right &&
        screen.y >= rect.top && screen.y <= rect.bottom
      ) return { x: screen.x, y: screen.y }
    }
    return null
  }, '[data-runtime-node="node-occluder"]')
  expect(intersection).not.toBeNull()

  const edgeZ = Number(await edgeLayer.evaluate((element) => getComputedStyle(element).zIndex))
  const nodeZ = Number(await nodeWorld.evaluate((element) => getComputedStyle(element).zIndex))
  expect(nodeZ).toBeGreaterThan(edgeZ)

  const output = runtime.locator('[data-runtime-node="node-image"] [data-visible-port="output"]')
  const outputCenter = await center(output)
  await page.mouse.move(outputCenter.x, outputCenter.y)
  await page.mouse.down()
  await page.mouse.move(intersection!.x, intersection!.y, { steps: 4 })
  await expect(runtime.locator('[data-runtime-draft-edge]')).toBeVisible()
  expect(Number(await edgeLayer.evaluate((element) => getComputedStyle(element).zIndex)))
    .toBeLessThan(nodeZ)
  await page.screenshot({
    path: '../output/playwright/t6-011-r8n-edges-under-cards.png',
    fullPage: true,
  })
  await page.mouse.up()
})

test('replacement restores minimap, Ctrl-wheel zoom, and Canvas context menu', async ({ page }) => {
  const state = createVisualState()
  const runtime = await openReplacement(page, state)
  const minimap = runtime.getByLabel('小地图')
  await expect(minimap).toBeVisible()
  await expect(minimap.locator('[data-minimap-node]')).toHaveCount(
    state.canvasNodes.filter((node) => node.node_type !== 'result').length,
  )

  const world = runtime.locator('[data-canvas-world]')
  const worldBox = await world.boundingBox()
  if (!worldBox) throw new Error('Canvas world has no browser geometry')
  await page.mouse.move(worldBox.x + worldBox.width / 2, worldBox.y + worldBox.height / 2)
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -240)
  await page.keyboard.up('Control')
  await expect(runtime.getByRole('status', { name: '当前缩放' })).not.toContainText('100%')

  await page.mouse.click(worldBox.x + worldBox.width - 180, worldBox.y + 150, {
    button: 'right',
  })
  const menu = runtime.getByRole('menu', { name: '画布快捷菜单' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '新建文本' })).toBeVisible()
})

test('top-right, selected-card, and chat controls expose truthful actions', async ({ page }) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  source.content = {
    ...source.content,
    asset_id: 'asset-toolbar',
    result_asset_id: 'asset-toolbar',
    asset_url: 'https://media.revid.test/toolbar.png',
    url: 'https://media.revid.test/toolbar.png',
    last_generation_job_id: 'job-toolbar',
  }
  state.assets.push({
    id: 'asset-toolbar',
    user_id: 'user-e2e',
    project_id: 'project-e2e',
    origin_canvas_id: 'canvas-first',
    canvas_node_id: 'node-image',
    type: 'image',
    url: 'https://media.revid.test/toolbar.png',
    content_text: null,
    source: 'generation',
    source_model: 'mock-image-model',
    source_task_id: 'job-toolbar',
    status: 'active',
    created_at: '2026-07-25T13:00:00Z',
    updated_at: '2026-07-25T13:00:00Z',
  })
  const runtime = await openReplacement(page, state)

  await runtime.getByRole('button', { name: '分享画布' }).click()
  await expect(runtime.getByRole('dialog', { name: '分享画布' })).toBeVisible()
  await runtime.getByRole('button', { name: /账户菜单/ }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Escape')

  await runtime.getByRole('button', { name: '创作帮助' }).click()
  await expect(page.getByRole('dialog', { name: '专业操作' })).toBeVisible()
  await page.getByRole('button', { name: '关闭专业操作' }).click()

  const sourceCard = runtime.locator('[data-runtime-node="node-image"]')
  await sourceCard.locator('[data-node-body]').click()
  await runtime.getByRole('button', { name: '区域编辑' }).click()
  await expect(page.getByRole('dialog', { name: '专业操作' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: '搜索专业操作' })).toHaveValue('区域')
})
