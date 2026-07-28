import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, test, type Locator } from '@playwright/test'
import { createVisualState, installMockApi } from './authenticated-workflow-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'
const MEDIA_URL = 'http://127.0.0.1:9099/fixtures/t6-011-playable.mp4'
const POSTER_URL = 'http://127.0.0.1:9099/fixtures/t6-011-poster.svg'

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

async function center(locator: Locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Element has no browser geometry')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test('T6-011 replacement keeps legacy Result readable but invisible and plays video on the stable source card', async ({
  page,
}) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  source.content = {
    ...source.content,
    title: 'Video Generation',
    subtype: 'video',
    asset_id: 'asset-video-local',
    result_asset_id: 'asset-video-local',
    asset_url: MEDIA_URL,
    url: MEDIA_URL,
    preview_url: POSTER_URL,
    last_generation_job_id: 'job-video-local',
  }
  state.canvasNodes.push({
    ...source,
    id: 'node-target',
    content: {
      title: 'Image Generation',
      subtype: 'image',
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

  const fixturePath = fileURLToPath(new URL('../fixtures/t6-011-playable.mp4', import.meta.url))
  const media = await readFile(fixturePath)
  await page.route(MEDIA_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'video/mp4',
    headers: { 'accept-ranges': 'bytes', 'cache-control': 'no-store' },
    body: media,
  }))
  await page.route(POSTER_URL, (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#15131e"/><circle cx="160" cy="90" r="28" fill="#7b61ff"/></svg>',
  }))
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const sourceCard = runtime.locator('[data-runtime-node="node-image"]')
  const video = sourceCard.locator('video')
  await expect(runtime.locator('[data-runtime-node="node-result"]')).toHaveCount(0)
  expect(state.canvasNodes.some((node) => node.id === 'node-result')).toBe(true)
  await expect(runtime.locator('[data-runtime-node]')).toHaveCount(2)
  await expect(video).toHaveAttribute('controls', '')
  await expect(video).toHaveAttribute('poster', POSTER_URL)
  await expect(sourceCard.locator('[data-node-body]')).toHaveAttribute('data-media-state', 'video')
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).readyState))
    .toBeGreaterThanOrEqual(2)
  await video.evaluate(async (element) => {
    const mediaElement = element as HTMLVideoElement
    await mediaElement.play()
  })
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0)

  const sourceBefore = { x: source.position_x, y: source.position_y }
  await video.dispatchEvent('pointerdown', { pointerId: 41, button: 0 })
  await video.dispatchEvent('click')
  await expect(runtime).toHaveAttribute('data-interaction-state', 'idle')
  expect({ x: source.position_x, y: source.position_y }).toEqual(sourceBefore)
})

test('T6-011 bound original card shows provider progress without Canvas delta polling', async ({
  page,
}) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  source.status = 'running'
  source.content = {
    ...source.content,
    title: 'Video Generation',
    subtype: 'video',
    active_generation_job_id: 'job-progress-live',
    active_generation_media_type: 'video',
  }
  const generationRequests: string[] = []
  let exactStatusReads = 0
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.includes('generation-job') || url.pathname.includes('generation-task')) {
      generationRequests.push(`${request.method()} ${url.pathname}${url.search}`)
    }
  })
  await installMockApi(page, state)
  await page.route(
    'http://localhost:8000/api/v2/generation-jobs/job-progress-live',
    async (route) => {
      exactStatusReads += 1
      const progress = exactStatusReads === 1 ? 12 : 47
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': 'http://127.0.0.1:9099',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          job_id: 'job-progress-live',
          node_id: 'node-image',
          media_type: 'video',
          status: 'running',
          stage: 'provider',
          progress,
          error: null,
          result_asset_id: null,
          version: exactStatusReads,
          updated_at: `2026-07-25T12:00:0${exactStatusReads}Z`,
        }),
      })
    },
  )
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const sourceCard = page.locator(
    '[data-canvas-runtime="replacement"] [data-runtime-node="node-image"]',
  )
  await expect.poll(() => exactStatusReads, { timeout: 8_000 }).toBeGreaterThanOrEqual(2)
  await expect(sourceCard).toHaveAttribute('data-boundary-loading', 'true')
  await expect(sourceCard.locator('[data-runtime-lifecycle]')).toHaveCount(0)
  await expect(sourceCard.locator('[data-runtime-loading-status]')).toContainText('模型生成中')
  expect(exactStatusReads).toBeGreaterThanOrEqual(2)
  expect(generationRequests.some((request) => (
    request.includes('/api/v2/projects/project-e2e/generation-jobs?canvas_id=canvas-first')
  ))).toBe(false)
  expect(generationRequests.some((request) => (
    request.includes('/api/generation-tasks')
  ))).toBe(false)
})

test('T6-011 symmetric acquisition keeps exactly one visible plus per side and shares SVG endpoints through hover draft selection and zoom', async ({
  page,
}) => {
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
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const sourceCard = runtime.locator('[data-runtime-node="node-image"]')
  const targetCard = runtime.locator('[data-runtime-node="node-target"]')
  const sourceOutput = sourceCard.locator('[data-visible-port="output"]')
  const targetInput = targetCard.locator('[data-visible-port="input"]')
  const outputAcquisition = sourceCard.locator('[data-port-acquisition="output"]')
  const inputAcquisitions = targetCard.locator('[data-port-acquisition="input"]')
  const edge = runtime.locator('[data-runtime-edge="connection-source-target"]')

  await expect(sourceOutput).toHaveCount(1)
  await expect(targetInput).toHaveCount(1)
  await expect(inputAcquisitions).toHaveCount(1)
  await expect(sourceCard.locator('[data-visible-port]')).toHaveCount(2)
  await expect(targetCard.locator('[data-visible-port]')).toHaveCount(2)
  expect((await outputAcquisition.boundingBox())!.width).toBeCloseTo(80, 1)
  expect((await inputAcquisitions.boundingBox())!.width).toBeCloseTo(80, 1)

  const assertEdgeMatchesCardBoundaries = async () => {
    const start = await pathEndpoint(edge, 'start')
    const end = await pathEndpoint(edge, 'end')
    const sourceBox = await sourceCard.boundingBox()
    const targetBox = await targetCard.boundingBox()
    if (!sourceBox || !targetBox) throw new Error('Cards have no browser geometry')
    expect(start.x).toBeCloseTo(sourceBox.x + sourceBox.width, 0)
    expect(start.y).toBeCloseTo(sourceBox.y + sourceBox.height / 2, 0)
    expect(end.x).toBeCloseTo(targetBox.x, 0)
    expect(end.y).toBeCloseTo(targetBox.y + targetBox.height / 2, 0)
  }
  await assertEdgeMatchesCardBoundaries()

  const acquisition = await outputAcquisition.boundingBox()
  if (!acquisition) throw new Error('Output acquisition has no browser geometry')
  const positions: Array<{ x: number; y: number }> = []
  for (const [dx, dy] of [[12, 18], [40, 40], [66, 56]] as const) {
    await page.mouse.move(acquisition.x + dx, acquisition.y + dy, { steps: 3 })
    positions.push(await center(sourceOutput))
    await assertEdgeMatchesCardBoundaries()
  }
  expect(new Set(positions.map((point) => `${Math.round(point.x)}:${Math.round(point.y)}`)).size)
    .toBe(3)
  const acquisitionCenter = {
    x: acquisition.x + acquisition.width / 2,
    y: acquisition.y + acquisition.height / 2,
  }
  for (const point of positions) {
    expect(Math.hypot(point.x - acquisitionCenter.x, point.y - acquisitionCenter.y))
      .toBeLessThanOrEqual(30.5)
  }
  const persistentStart = await pathEndpoint(edge, 'start')
  expect(Math.hypot(
    persistentStart.x - positions.at(-1)!.x,
    persistentStart.y - positions.at(-1)!.y,
  )).toBeGreaterThan(8)

  const dragStart = await center(sourceOutput)
  await page.mouse.move(dragStart.x, dragStart.y)
  await page.mouse.down()
  await page.mouse.move(dragStart.x + 160, dragStart.y + 90, { steps: 4 })
  const draft = runtime.locator('[data-runtime-draft-edge]')
  const draftStart = await pathEndpoint(draft, 'start')
  expect(Math.hypot(draftStart.x - dragStart.x, draftStart.y - dragStart.y)).toBeLessThanOrEqual(1.5)
  await page.mouse.up()

  await sourceCard.locator('[data-node-body]').click()
  await expect(sourceCard).toHaveAttribute('data-selected', 'true')
  await assertEdgeMatchesCardBoundaries()
  await runtime.getByRole('button', { name: '放大画布' }).click()
  await expect(runtime.getByRole('status', { name: '当前缩放' })).toContainText('110%')
  await assertEdgeMatchesCardBoundaries()

  for (let step = 0; step < 6; step += 1) {
    await runtime.getByRole('button', { name: '缩小画布' }).click()
  }
  await expect(runtime.getByRole('status', { name: '当前缩放' })).toContainText('50%')
  expect((await outputAcquisition.boundingBox())!.width).toBeCloseTo(40, 1)
  expect((await inputAcquisitions.boundingBox())!.width).toBeCloseTo(40, 1)
  await assertEdgeMatchesCardBoundaries()
  await page.screenshot({
    path: '../output/playwright/t6-011-r8m-acquisition-at-50-percent.png',
    fullPage: true,
  })
})
