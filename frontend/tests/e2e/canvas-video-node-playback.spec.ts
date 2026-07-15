import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import {
  createResourceMockState, documentPatches, FIRST_CANVAS_ID, openResourceWorkspace,
} from './canvas-resource-generation-fixture'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-066-video-node-playback')
const playbackOwnershipEvidence = resolve(process.cwd(), '..', 'output', 'playwright', 't5-069-video-playback-ownership')

function addGeneratedVideo(state: ReturnType<typeof createResourceMockState>, videoUrl: string, title = '无 CORS 生成视频') {
  const document = state.documents[FIRST_CANVAS_ID]
  document.nodes.push({
    id: 'result-no-cors-video', project_id: 'project-resources', canvas_id: FIRST_CANVAS_ID,
    node_type: 'result', content: {
      title, subtype: 'video', serialization_version: 1,
      asset_id: 'asset-no-cors-video', source_task_id: 'task-no-cors-video', url: videoUrl,
      width: 320, height: 180,
    }, position_x: 580, position_y: 460, width: 320, height: 180, z_index: 0,
    parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
    created_at: '2026-07-15T08:00:00Z', updated_at: '2026-07-15T08:00:00Z',
  })
  state.assets.push({
    id: 'asset-no-cors-video', user_id: 'user-resource', project_id: 'project-resources',
    origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: 'generation-no-cors-video', type: 'video',
    url: videoUrl, content_text: title, source: 'generation', source_model: 'mock-video-v1',
    source_task_id: 'task-no-cors-video', status: 'active', created_at: '2026-07-15T08:00:00Z', updated_at: '2026-07-15T08:00:00Z',
  })
}

async function startNoCorsVideoServer(options: { failPlaybackOnly?: boolean } = {}) {
  const body = readFileSync(resolve(process.cwd(), 'tests', 'fixtures', 'dynamic-frame-source.mp4'))
  const requests: Array<{ origin: string; range: string; status: number }> = []
  const server = createServer((request, response) => {
    const range = request.headers.range ?? ''
    const origin = request.headers.origin ?? ''
    if (options.failPlaybackOnly && !origin) {
      requests.push({ origin, range, status: 503 })
      response.writeHead(503, { 'Content-Type': 'text/plain', 'Content-Length': 11 })
      response.end('unavailable')
      return
    }
    if (!range.startsWith('bytes=')) {
      requests.push({ origin, range, status: 200 })
      response.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': body.length, 'Accept-Ranges': 'bytes' })
      response.end(body)
      return
    }
    const [startText, endText] = range.slice('bytes='.length).split('-', 2)
    const start = Number(startText)
    const end = endText ? Math.min(Number(endText), body.length - 1) : body.length - 1
    requests.push({ origin, range, status: 206 })
    response.writeHead(206, {
      'Content-Type': 'video/mp4', 'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Accept-Ranges': 'bytes',
    })
    response.end(body.subarray(start, end + 1))
  })
  await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No-CORS media server did not bind')
  return {
    url: `http://127.0.0.1:${address.port}/generated.mp4`, requests,
    close: () => new Promise<void>((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose())),
  }
}

async function selectNode(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

async function mediaSnapshot(video: import('@playwright/test').Locator) {
  return video.evaluate((element: HTMLVideoElement) => ({
    errorCode: element.error?.code ?? 0,
    readyState: element.readyState,
    networkState: element.networkState,
    paused: element.paused,
    volume: element.volume,
    currentTime: element.currentTime,
    duration: element.duration,
    width: element.videoWidth,
    height: element.videoHeight,
    origin: new URL(element.currentSrc || element.src).origin,
    crossOrigin: element.crossOrigin,
  }))
}

test('starting a second Canvas video pauses the first without rewinding it', async ({ page }) => {
  const state = createResourceMockState()
  addGeneratedVideo(state, 'https://media.revid.test/scenario.mp4', 'First video result')
  const first = state.documents[FIRST_CANVAS_ID].nodes.at(-1)!
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...first,
    id: 'result-second-video',
    content: {
      ...first.content,
      title: 'Second video result',
      asset_id: 'asset-second-video',
      source_task_id: 'task-second-video',
    },
    position_x: 940,
  })
  await openResourceWorkspace(page, state)
  const videos = page.locator('.canvas-node-surface video')
  await expect(videos).toHaveCount(2)
  await expect.poll(() => videos.nth(0).evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2)
  await expect.poll(() => videos.nth(1).evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2)

  await videos.nth(0).evaluate(async (video: HTMLVideoElement) => { video.loop = true; video.muted = true; await video.play() })
  await expect.poll(() => videos.nth(0).evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0)
  const firstTime = await videos.nth(0).evaluate((video: HTMLVideoElement) => video.currentTime)
  await videos.nth(1).evaluate(async (video: HTMLVideoElement) => { video.loop = true; video.muted = true; await video.play() })

  await expect.poll(() => videos.nth(0).evaluate((video: HTMLVideoElement) => video.paused)).toBe(true)
  expect(await videos.nth(0).evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThanOrEqual(firstTime)
  expect(await videos.nth(1).evaluate((video: HTMLVideoElement) => video.paused)).toBe(false)
  expect(documentPatches(state)).toHaveLength(0)
})

test('comparison preview and background node hand playback ownership to each other', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-compose')!
  await selectNode(page, String(generation.content.title))
  await page.locator('.compare-results-button').click()
  const backgroundVideo = page.locator('.canvas-node-surface video')
  const trayVideo = page.locator('.result-compare-tray video')
  await expect(backgroundVideo).toHaveCount(1)
  await expect(trayVideo).toHaveCount(1)
  await expect.poll(() => trayVideo.evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2)

  await backgroundVideo.evaluate(async (video: HTMLVideoElement) => { video.loop = true; video.muted = true; await video.play() })
  await expect.poll(() => backgroundVideo.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeGreaterThan(0)
  await trayVideo.evaluate(async (video: HTMLVideoElement) => { video.loop = true; video.muted = true; await video.play() })
  await expect.poll(() => backgroundVideo.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true)
  await mkdir(playbackOwnershipEvidence, { recursive: true })
  await page.screenshot({ path: resolve(playbackOwnershipEvidence, 'tray-video-owns-playback-1440x900.png'), fullPage: true })
  await backgroundVideo.focus()
  await page.keyboard.press('k')
  await expect.poll(() => trayVideo.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true)
  expect(documentPatches(state)).toHaveLength(0)
})

test('same no-ACAO generated video falls back once to direct native playback inside its node', async ({ page }) => {
  const mediaServer = await startNoCorsVideoServer()
  const state = createResourceMockState()
  addGeneratedVideo(state, mediaServer.url)
  const consoleErrors: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  try {
    await openResourceWorkspace(page, state)

  await page.getByRole('button', { name: '打开项目资源' }).click()
  const assetVideo = page.getByRole('complementary', { name: '项目资源' }).getByLabel('视频素材 无 CORS 生成视频')
  await expect.poll(async () => (await mediaSnapshot(assetVideo)).readyState).toBeGreaterThanOrEqual(1)
  expect((await mediaSnapshot(assetVideo)).crossOrigin).toBeNull()
  await assetVideo.evaluate(async (video: HTMLVideoElement) => { video.muted = true; await video.play() })
  await expect.poll(async () => (await mediaSnapshot(assetVideo)).currentTime).toBeGreaterThan(0)
  await assetVideo.evaluate((video: HTMLVideoElement) => video.pause())
  await page.getByRole('button', { name: '关闭项目资源' }).click()

  await selectNode(page, '无 CORS 生成视频')
  const nodeVideo = page.locator('video[aria-label="视频结果"]')
    await expect(nodeVideo).toHaveAttribute('data-playback-capability', 'playback-only')
    await expect.poll(async () => (await mediaSnapshot(nodeVideo)).readyState).toBeGreaterThanOrEqual(1)
    const nodeState = await mediaSnapshot(nodeVideo)
    expect(nodeState).toMatchObject({ crossOrigin: null, errorCode: 0, paused: true, origin: new URL(mediaServer.url).origin })
    expect(consoleErrors.some((message) => /cors|access-control-allow-origin/i.test(message))).toBe(true)
    expect(mediaServer.requests.some((request) => request.origin)).toBe(true)
    expect(mediaServer.requests.some((request) => !request.origin)).toBe(true)
    await expect(page.getByRole('button', { name: '截取当前帧' })).toHaveCount(0)
    await expect(page.getByRole('region', { name: '视频关键帧' })).toHaveCount(0)

    await nodeVideo.focus()
    await page.keyboard.press('Space')
    await expect.poll(async () => (await mediaSnapshot(nodeVideo)).currentTime).toBeGreaterThan(0)
    expect((await mediaSnapshot(nodeVideo)).paused).toBe(false)
    await page.keyboard.press('Space')
    await expect.poll(async () => (await mediaSnapshot(nodeVideo)).paused).toBe(true)
    const pausedAt = (await mediaSnapshot(nodeVideo)).currentTime
    await page.keyboard.press('ArrowRight')
    await expect.poll(async () => (await mediaSnapshot(nodeVideo)).currentTime).toBeGreaterThan(pausedAt)
    await page.keyboard.press('ArrowDown')
    expect((await mediaSnapshot(nodeVideo)).volume).toBeCloseTo(0.9)
    await mkdir(evidenceDirectory, { recursive: true })
    await page.screenshot({ path: resolve(evidenceDirectory, 'playback-only-desktop-1440x900.png'), fullPage: true })

    const requestCount = mediaServer.requests.length
    await page.waitForTimeout(400)
    expect(mediaServer.requests).toHaveLength(requestCount)
    expect(documentPatches(state)).toHaveLength(0)

    await page.reload()
    await selectNode(page, '无 CORS 生成视频')
    const reloadedVideo = page.locator('video[aria-label="视频结果"]')
    await expect(reloadedVideo).toHaveAttribute('data-playback-capability', 'playback-only')
    await reloadedVideo.focus()
    await page.keyboard.press('k')
    await expect.poll(async () => (await mediaSnapshot(reloadedVideo)).currentTime).toBeGreaterThan(0)
    expect(documentPatches(state)).toHaveLength(0)
  } finally {
    await mediaServer.close()
  }
})

test('CORS-readable generated video keeps keyboard playback, keyframes, and frame capture in compact Canvas', async ({ page }) => {
  const state = createResourceMockState()
  addGeneratedVideo(state, 'https://media.revid.test/scenario.mp4', '可截帧生成视频')
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '可截帧生成视频')
  const video = page.locator('video[aria-label="视频结果"]')
  await expect(video).toHaveAttribute('data-playback-capability', 'canvas-readable')
  await expect.poll(async () => (await mediaSnapshot(video)).readyState).toBeGreaterThanOrEqual(2)
  await expect(page.getByRole('button', { name: '截取当前帧' })).toBeVisible()
  await expect(page.getByRole('region', { name: '视频关键帧' })).toContainText('5 帧')
  const drawer = page.locator('.n-drawer:visible')
  await expect.poll(async () => {
    const box = await drawer.boundingBox()
    return box ? Math.round(box.x + box.width) : 0
  }).toBeLessThanOrEqual(920)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'canvas-readable-compact-920x900.png'), fullPage: true })
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await video.focus()
  await page.keyboard.press('k')
  await expect.poll(async () => (await mediaSnapshot(video)).currentTime).toBeGreaterThan(0)
  await page.keyboard.press('k')
  await expect.poll(async () => (await mediaSnapshot(video)).paused).toBe(true)
  expect(documentPatches(state)).toHaveLength(0)
})

test('invalid generated video performs one fallback then remains an explicit readonly error', async ({ page }) => {
  const state = createResourceMockState()
  addGeneratedVideo(state, 'https://media.revid.test/broken.mp4', '失效生成视频')
  let mediaRequestCount = 0
  page.on('request', (request) => { if (request.url().endsWith('/broken.mp4')) mediaRequestCount += 1 })
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '失效生成视频')
  await expect(page.getByText('媒体不可用，可稍后重试', { exact: true })).toBeVisible()
  expect(mediaRequestCount).toBe(2)
  await page.waitForTimeout(400)
  expect(mediaRequestCount).toBe(2)
  await expect(page.getByRole('button', { name: '截取当前帧' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: '视频关键帧' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await expect(page.locator('.n-drawer-mask')).toHaveCount(0)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'invalid-readonly-375x812.png'), fullPage: true })
})

for (const scenario of [
  { name: 'expired 403', path: 'forbidden.mp4' },
  { name: 'unsupported codec', path: 'unsupported.mp4' },
] as const) {
  test(`${scenario.name} remains an explicit bounded media error`, async ({ page }) => {
    const state = createResourceMockState()
    addGeneratedVideo(state, `https://media.revid.test/${scenario.path}`, scenario.name)
    let mediaRequestCount = 0
    page.on('request', (request) => { if (request.url().endsWith(`/${scenario.path}`)) mediaRequestCount += 1 })
    await openResourceWorkspace(page, state)
    await selectNode(page, scenario.name)
    await expect(page.getByText('媒体不可用，可稍后重试', { exact: true })).toBeVisible()
    expect(mediaRequestCount).toBe(2)
    await page.waitForTimeout(300)
    expect(mediaRequestCount).toBe(2)
    expect(documentPatches(state)).toHaveLength(0)
  })
}

test('failed playback-only second load stops after the single fallback', async ({ page }) => {
  const mediaServer = await startNoCorsVideoServer({ failPlaybackOnly: true })
  const state = createResourceMockState()
  addGeneratedVideo(state, mediaServer.url, '二次加载失败')
  try {
    await openResourceWorkspace(page, state)
    await selectNode(page, '二次加载失败')
    await expect(page.getByText('媒体不可用，可稍后重试', { exact: true })).toBeVisible()
    expect(mediaServer.requests).toHaveLength(2)
    expect([200, 206]).toContain(mediaServer.requests[0].status)
    expect(mediaServer.requests[1].status).toBe(503)
    await page.waitForTimeout(300)
    expect(mediaServer.requests).toHaveLength(2)
    expect(documentPatches(state)).toHaveLength(0)
  } finally {
    await mediaServer.close()
  }
})
