import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page, type Route } from '@playwright/test'
import { cpus, platform, release, totalmem } from 'node:os'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { GENERATION_CAPABILITIES } from './canvas-generation-parameters-fixture'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-13T18:00:00Z'
const OUTPUT_DIR = resolve(process.cwd(), '..', 'output', 'playwright', 't5-005-unit-e')
const REQUIRED_VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'compact-desktop', width: 1366, height: 768 },
  { name: 'narrow-workspace', width: 920, height: 900 },
  { name: 'mobile-review', width: 375, height: 812 },
] as const

interface PerformanceState {
  nodeCount: number
  connectionCount: number
  requests: Array<{ method: string; path: string }>
}

interface InteractionTrace {
  durationMs: number
  frameIntervals: number[]
  minimapUpdates: number
  pointerFeedback: number[]
  longTasks: number[]
}

declare global {
  interface Window {
    __canvasInteractionTrace?: InteractionTrace & { stop: () => InteractionTrace }
    __canvasListenerAudit?: () => number
  }
}

const user = {
  id: 'user-performance', username: 'performance-owner', email: 'performance@example.com',
  nickname: '性能验收创作者', avatar_url: '', role: 'user', status: 'active',
  generation_status: 'enabled', created_at: NOW, updated_at: NOW, last_login_at: NOW,
}

function canvas(id: string, name: string, sortOrder: number) {
  return {
    id, project_id: 'project-performance', name, sort_order: sortOrder, status: 'active',
    viewport_x: 0, viewport_y: 0, viewport_zoom: 1, graph_revision: 0,
    created_at: NOW, updated_at: NOW, deleted_at: null,
  }
}

const canvases = [canvas('canvas-performance', '性能画布', 0), canvas('canvas-alternate', '切换画布', 1)]
const nodeTypes = ['text', 'image', 'video', 'model', 'result', 'refine', 'composite'] as const

function seededNodes(canvasId: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const column = index % 20
    const row = Math.floor(index / 20)
    const title = `性能节点 ${String(index + 1).padStart(3, '0')}`
    return {
      id: `${canvasId}-node-${index}`, project_id: 'project-performance', canvas_id: canvasId,
      node_type: nodeTypes[index % nodeTypes.length],
      content: { title, text: `${title} 的 deterministic placeholder` },
      position_x: 180 + column * 280, position_y: 260 + row * 180,
      width: 220, height: 128, z_index: index, parent_node_id: null,
      is_locked: index % 37 === 0, is_collapsed: false,
      status: index % 29 === 0 ? 'running' : index % 31 === 0 ? 'success' : 'idle',
      created_at: NOW, updated_at: NOW,
    }
  })
}

function seededConnections(canvasId: string, nodeCount: number, connectionCount: number) {
  return Array.from({ length: connectionCount }, (_, index) => {
    const sourceIndex = index % nodeCount
    const offset = index < nodeCount ? 1 : 10
    const targetIndex = (sourceIndex + offset) % nodeCount
    return {
      id: `${canvasId}-connection-${index}`, project_id: 'project-performance', canvas_id: canvasId,
      source_node_id: `${canvasId}-node-${sourceIndex}`, source_port: 'out',
      target_node_id: `${canvasId}-node-${targetIndex}`, target_port: 'in',
      status: 'active', metadata: {}, created_at: NOW, updated_at: NOW,
    }
  })
}

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, headers: corsHeaders(), body: JSON.stringify(body) })
}

async function installPerformanceApi(page: Page, state: PerformanceState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    state.requests.push({ method, path })

    if (method === 'GET' && path === '/me') return fulfillJson(route, { user, quotas: { text: 9, image: 8, video: 7 } })
    if (method === 'GET' && path === '/projects') {
      return fulfillJson(route, { items: [{ id: 'project-performance', user_id: user.id, name: '性能验收项目', created_at: NOW }], total: 1 })
    }
    if (method === 'GET' && path === '/assets') return fulfillJson(route, { items: [], total: 0, page: 1, page_size: 100 })
    if (method === 'GET' && path === '/templates') return fulfillJson(route, { items: [], total: 0 })
    if (method === 'GET' && path === '/api/generation-tasks') return fulfillJson(route, { items: [], total: 0, page: 1, page_size: 100 })
    if (method === 'GET' && path === '/api/generation-capabilities') return fulfillJson(route, GENERATION_CAPABILITIES)
    if (method === 'GET' && path === '/api/projects/project-performance/canvases') {
      return fulfillJson(route, { items: canvases, order_revision: 0 })
    }
    const documentMatch = path.match(/^\/api\/projects\/project-performance\/canvases\/([^/]+)\/document$/)
    if (method === 'GET' && documentMatch) {
      const canvasId = decodeURIComponent(documentMatch[1])
      const activeCanvas = canvases.find((item) => item.id === canvasId)
      if (!activeCanvas) return fulfillJson(route, { detail: 'Canvas not found' }, 404)
      return fulfillJson(route, {
        canvas: activeCanvas,
        nodes: seededNodes(canvasId, state.nodeCount),
        connections: seededConnections(canvasId, state.nodeCount, state.connectionCount),
        revision: 0,
      })
    }
    if (method === 'PATCH' && path.endsWith('/viewport')) {
      const canvasId = path.split('/').at(-2) ?? 'canvas-performance'
      return fulfillJson(route, canvases.find((item) => item.id === canvasId) ?? canvases[0])
    }
    const nodeMatch = path.match(/\/nodes\/([^/]+)$/)
    if (method === 'PUT' && nodeMatch) {
      const canvasId = path.split('/canvases/')[1]?.split('/')[0] ?? 'canvas-performance'
      const nodeIndex = Number(decodeURIComponent(nodeMatch[1]).split('-').at(-1))
      return fulfillJson(route, seededNodes(canvasId, state.nodeCount)[nodeIndex])
    }
    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

async function installListenerAudit(page: Page) {
  await page.addInitScript(() => {
    const originalAdd = EventTarget.prototype.addEventListener
    const originalRemove = EventTarget.prototype.removeEventListener
    const objectIds = new WeakMap<object, number>()
    const active = new Set<string>()
    let nextId = 1
    const trackedTypes = new Set(['keydown', 'keyup', 'pointermove', 'pointerup', 'pointercancel', 'wheel', 'pagehide'])
    function id(value: object) {
      if (!objectIds.has(value)) objectIds.set(value, nextId++)
      return objectIds.get(value)
    }
    function capture(options?: boolean | AddEventListenerOptions) {
      return typeof options === 'boolean' ? options : Boolean(options?.capture)
    }
    function key(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
      if (!listener) return ''
      return `${id(target)}:${type}:${id(listener as object)}:${capture(options)}`
    }
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (trackedTypes.has(type) && (this === window || this === document)) active.add(key(this, type, listener, options))
      return originalAdd.call(this, type, listener, options)
    }
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      if (trackedTypes.has(type) && (this === window || this === document)) active.delete(key(this, type, listener, options))
      return originalRemove.call(this, type, listener, options)
    }
    window.__canvasListenerAudit = () => active.size
  })
}

async function openCanvas(page: Page, state: PerformanceState, viewport = { width: 1366, height: 768 }) {
  await page.setViewportSize(viewport)
  await installPerformanceApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'performance-token'))
  const startedAt = Date.now()
  await page.goto('/app/projects/project-performance/canvases/canvas-performance?canvas_runtime=legacy')
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
  await expect(page.locator('.minimap-node')).toHaveCount(state.nodeCount)
  return Date.now() - startedAt
}

function percentile(values: number[], percentileValue: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1)]
}

async function startInteractionTrace(page: Page) {
  await page.evaluate(() => {
    const frameIntervals: number[] = []
    const pointerFeedback: number[] = []
    const longTasks: number[] = []
    const startedAt = performance.now()
    let minimapUpdates = 0
    let isPointerSamplePending = false
    let isRunning = true
    let previousFrame = performance.now()
    const onFrame = (now: number) => {
      frameIntervals.push(now - previousFrame)
      previousFrame = now
      if (isRunning) requestAnimationFrame(onFrame)
    }
    const onPointerMove = () => {
      if (isPointerSamplePending) return
      isPointerSamplePending = true
      const receivedAt = performance.now()
      requestAnimationFrame(() => {
        isPointerSamplePending = false
        pointerFeedback.push(Math.max(0, performance.now() - receivedAt))
      })
    }
    const observer = typeof PerformanceObserver === 'undefined'
      ? null
      : new PerformanceObserver((list) => list.getEntries().forEach((entry) => longTasks.push(entry.duration)))
    try { observer?.observe({ type: 'longtask', buffered: false }) } catch { /* unsupported Chromium metric */ }
    const minimapObserver = new MutationObserver(() => { minimapUpdates += 1 })
    const minimapViewport = document.querySelector('.minimap-viewport')
    if (minimapViewport) minimapObserver.observe(minimapViewport, { attributes: true, attributeFilter: ['style'] })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    requestAnimationFrame(onFrame)
    window.__canvasInteractionTrace = {
      durationMs: 0, frameIntervals, minimapUpdates, pointerFeedback, longTasks,
      stop: () => {
        isRunning = false
        observer?.disconnect()
        minimapObserver.disconnect()
        window.removeEventListener('pointermove', onPointerMove)
        return {
          durationMs: performance.now() - startedAt,
          frameIntervals: [...frameIntervals],
          minimapUpdates,
          pointerFeedback: [...pointerFeedback],
          longTasks: [...longTasks],
        }
      },
    }
  })
}

async function runInteractionProfile(page: Page) {
  const surface = page.locator('.canvas-surface')
  const box = await surface.boundingBox()
  if (!box) throw new Error('Canvas surface is unavailable')
  const point = (x: number, y: number) => ({ x: box.x + x, y: box.y + y })

  await page.mouse.click(point(260, 320).x, point(260, 320).y)
  await page.mouse.move(point(260, 320).x, point(260, 320).y)
  await page.mouse.down()
  await page.mouse.move(point(300, 350).x, point(300, 350).y, { steps: 8 })
  await page.mouse.up()
  await page.mouse.click(point(600, 320).x, point(600, 320).y, { modifiers: ['Control'] })
  await page.mouse.move(point(300, 350).x, point(300, 350).y)
  await page.mouse.down()
  await page.mouse.move(point(340, 380).x, point(340, 380).y, { steps: 8 })
  await page.mouse.up()
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Escape')

  const startedAt = Date.now()
  let direction = 1
  while (Date.now() - startedAt < 30_000) {
    await page.mouse.move(point(720, 420).x, point(720, 420).y)
    await page.mouse.down({ button: 'middle' })
    await page.mouse.move(point(720 + direction * 90, 420 + direction * 35).x, point(720 + direction * 90, 420 + direction * 35).y, { steps: 2 })
    await page.mouse.up({ button: 'middle' })
    await page.mouse.wheel(0, direction * 180)
    direction *= -1
  }
}

async function environmentRecord(page: Page, browser: Browser) {
  const browserEnvironment = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info')
    const gpuRenderer = gl && debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : 'unavailable'
    return {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemoryGb: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
      deviceScaleFactor: window.devicePixelRatio,
      gpuRenderer,
      hardwareAcceleration: Boolean(gl && debugInfo && !/swiftshader|software/i.test(gpuRenderer)),
    }
  })
  return {
    operatingSystem: { platform: platform(), release: release() },
    cpu: cpus()[0]?.model ?? 'unknown',
    memoryBytes: totalmem(),
    chromiumVersion: browser.version(),
    ...browserEnvironment,
  }
}

async function heapSize(page: Page) {
  const session = await page.context().newCDPSession(page)
  await session.send('Performance.enable')
  await session.send('HeapProfiler.collectGarbage')
  const result = await session.send('Performance.getMetrics') as { metrics: Array<{ name: string; value: number }> }
  await session.detach()
  return result.metrics.find((metric) => metric.name === 'JSHeapUsedSize')?.value ?? 0
}

test('200-node 300-connection Canvas passes focused interaction thresholds', async ({ page, browser }, testInfo) => {
  test.setTimeout(90_000)
  const state: PerformanceState = { nodeCount: 200, connectionCount: 300, requests: [] }
  const stableRenderMs = await openCanvas(page, state)
  await expect(page.locator('.connection-line.active')).toHaveCount(300)
  await expect(page.locator('.connection-flow')).toHaveCount(0)
  await startInteractionTrace(page)
  await runInteractionProfile(page)
  await expect(page.locator('.connection-flow')).toHaveCount(0)
  const trace = await page.evaluate(() => window.__canvasInteractionTrace?.stop())
  if (!trace) throw new Error('Interaction trace was not installed')

  const averageFrameInterval = trace.frameIntervals.reduce((sum, value) => sum + value, 0) / trace.frameIntervals.length
  const metrics = {
    seed: { nodes: state.nodeCount, connections: state.connectionCount },
    stableRenderMs,
    averageFps: 1000 / averageFrameInterval,
    frameIntervalP95Ms: percentile(trace.frameIntervals, 0.95),
    pointerFeedbackP95Ms: percentile(trace.pointerFeedback, 0.95),
    longestInteractionTaskMs: Math.max(0, ...trace.longTasks),
    minimapUpdatesPerSecond: trace.minimapUpdates / (trace.durationMs / 1000),
    samples: {
      frames: trace.frameIntervals.length,
      pointerFeedback: trace.pointerFeedback.length,
      longTasks: trace.longTasks.length,
    },
    environment: await environmentRecord(page, browser),
  }
  await mkdir(OUTPUT_DIR, { recursive: true })
  const metricsPath = resolve(OUTPUT_DIR, 'performance-metrics.json')
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8')
  await testInfo.attach('performance-metrics', { path: metricsPath, contentType: 'application/json' })

  expect(metrics.seed).toEqual({ nodes: 200, connections: 300 })
  expect(metrics.stableRenderMs).toBeLessThanOrEqual(3_000)
  expect(metrics.averageFps).toBeGreaterThanOrEqual(55)
  expect(metrics.frameIntervalP95Ms).toBeLessThanOrEqual(33)
  expect(metrics.pointerFeedbackP95Ms).toBeLessThanOrEqual(50)
  expect(metrics.longestInteractionTaskMs).toBeLessThan(200)
  expect(metrics.minimapUpdatesPerSecond).toBeLessThanOrEqual(15.5)
  await page.close()
})

test('twenty Canvas switches keep listener and retained-heap signals bounded', async ({ page }) => {
  const state: PerformanceState = { nodeCount: 200, connectionCount: 300, requests: [] }
  await installListenerAudit(page)
  await openCanvas(page, state)
  const baselineListeners = await page.evaluate(() => window.__canvasListenerAudit?.() ?? 0)
  const baselineHeap = await heapSize(page)

  for (let index = 0; index < 20; index += 1) {
    const currentName = index % 2 === 0 ? '性能画布' : '切换画布'
    const nextName = index % 2 === 0 ? '切换画布' : '性能画布'
    await page.getByRole('button', { name: currentName, exact: true }).click()
    await page.getByRole('option', { name: new RegExp(nextName) }).click()
    await expect(page.locator('.minimap-node')).toHaveCount(200)
  }

  const finalListeners = await page.evaluate(() => window.__canvasListenerAudit?.() ?? 0)
  const finalHeap = await heapSize(page)
  expect(finalListeners).toBeLessThanOrEqual(baselineListeners + 2)
  expect(finalHeap).toBeLessThanOrEqual(Math.max(baselineHeap * 1.5, baselineHeap + 20 * 1024 * 1024))
  expect(state.requests.filter((request) => request.method === 'GET' && request.path.endsWith('/document'))).toHaveLength(21)
})

test('Canvas accessibility and required viewport matrix remain usable', async ({ page }, testInfo) => {
  const state: PerformanceState = { nodeCount: 8, connectionCount: 12, requests: [] }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openCanvas(page, state)

  const axe = await new AxeBuilder({ page })
    .include('.canvas-workspace')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const seriousViolations = axe.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
  expect(seriousViolations).toEqual([])

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await expect(stage).toBeFocused()
  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: '画布内容与快捷键' })
  await expect(dialog).toBeFocused()
  await dialog.getByRole('button', { name: '选择并定位 性能节点 001' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: '定位到 性能节点 001' })).toHaveClass(/selected/)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await dialog.getByRole('button', { name: /查看连线 性能节点 001 到 性能节点 002/ }).click()
  await expect(dialog.getByRole('button', { name: /查看连线 性能节点 001 到 性能节点 002/ })).toHaveAttribute('aria-pressed', 'true')
  const reducedMotionFlow = page.locator('.connection-flow[data-flow-reason="selected"]')
  await expect(reducedMotionFlow).toHaveCount(1)
  await expect(reducedMotionFlow).toHaveAttribute('data-flow-segments', '3')
  await expect(reducedMotionFlow).toHaveCSS('animation-name', 'none')
  await expect(reducedMotionFlow).toHaveCSS('pointer-events', 'none')
  const reducedMotionDuration = await page.locator('.canvas-workspace').evaluate((element) => (
    getComputedStyle(element).getPropertyValue('--v2-duration-fast').trim()
  ))
  expect(reducedMotionDuration).toMatch(/^0(?:s|ms)$/)

  await page.evaluate(() => { document.documentElement.style.zoom = '200%' })
  for (const locator of [
    page.getByRole('link', { name: '返回项目首页' }),
    page.getByRole('button', { name: '性能画布', exact: true }),
    page.getByRole('button', { name: '画布已同步 · r0' }),
  ]) await expect(locator).toBeVisible()
  await page.evaluate(() => { document.documentElement.style.zoom = '' })

  await mkdir(OUTPUT_DIR, { recursive: true })
  for (const viewport of REQUIRED_VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    if (viewport.width < 768) {
      await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '自动排列节点' })).toHaveCount(0)
      await expect(stage).toHaveAttribute('aria-description', '只读审阅模式')
    } else {
      await expect(stage).toHaveAttribute('aria-description', '可编辑画布')
    }
    const screenshotPath = resolve(OUTPUT_DIR, `${viewport.name}.png`)
    await page.screenshot({ path: screenshotPath })
    await testInfo.attach(viewport.name, { path: screenshotPath, contentType: 'image/png' })
  }
})
