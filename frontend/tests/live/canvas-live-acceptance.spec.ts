import {
  canvasDocumentChecksum,
  expect,
  test,
} from './live-fixture'

interface Project { id: string; name: string }
interface Canvas { id: string; name: string; sort_order: number; status: string; viewport_x: number; viewport_y: number; viewport_zoom: number; graph_revision: number }
interface CanvasList { items: Canvas[]; order_revision: number }
interface Document { canvas: Canvas; nodes: unknown[]; connections: unknown[]; revision: number }
interface PerformanceState { stableRenderMs: number; durationMs: number; fps: number; frameP95Ms: number; pointerP95Ms: number; longTasks: number }
interface LiveState { projectId: string; projectName: string; largeCanvasId: string; duplicateCanvasId: string; checksum: string; revision: number; order: string[]; performance: PerformanceState }

const canvasesPath = (projectId: string) => `/api/projects/${encodeURIComponent(projectId)}/canvases`
const documentPath = (projectId: string, canvasId: string) => `${canvasesPath(projectId)}/${encodeURIComponent(canvasId)}/document`

function nodeUpserts() {
  return Array.from({ length: 200 }, (_, index) => ({
    id: `t5008-node-${String(index).padStart(3, '0')}`,
    node_type: 'text',
    content: { label: `Acceptance ${index}` },
    position_x: index % 2 ? -index * 12 : index * 12,
    position_y: Math.floor(index / 2) * 16,
    width: 300,
    height: 200,
    z_index: index,
    parent_node_id: null,
    is_locked: false,
    is_collapsed: false,
  }))
}

function connectionUpserts() {
  return Array.from({ length: 300 }, (_, index) => ({
    id: `t5008-connection-${String(index).padStart(3, '0')}`,
    source_node_id: `t5008-node-${String(Math.floor(index / 20)).padStart(3, '0')}`,
    source_port: 'out',
    target_node_id: `t5008-node-${String((index % 20) + 20).padStart(3, '0')}`,
    target_port: 'in',
    metadata: { acceptance: true, index },
  }))
}

test('pre-restart certifies live Canvas metadata, conflict handling, 200/300 persistence, and viewport', async ({ live, request, page }) => {
  test.setTimeout(90000)
  test.skip(live.phase !== 'pre-restart', 'Only the pre-restart phase creates the functional journey')
  const session = await live.login(request, page)
  const projectName = `T5-008 acceptance ${live.runId}`
  const project = await session.postJson<Project>('/projects', { name: projectName })
  const initial = await session.getJson<CanvasList>(canvasesPath(project.id))
  expect(initial.items).toHaveLength(1)
  expect(initial.items[0].name).toBe('画布 1')

  const second = await session.postJson<{ item: Canvas; order_revision: number }>(canvasesPath(project.id), {
    name: '重复名称',
    base_order_revision: initial.order_revision,
  })
  const renamed = await session.requestJson<{ item: Canvas; order_revision: number }>('PATCH', `${canvasesPath(project.id)}/${second.item.id}`, { name: '重复名称' })
  expect(renamed.status).toBe(200)
  const largeCanvasId = initial.items[0].id
  const largePatch = await session.requestJson<Document>('PATCH', documentPath(project.id, largeCanvasId), {
    base_revision: 0,
    client_mutation_id: `t5008-${live.runId}-large-graph`,
    node_upserts: nodeUpserts(),
    node_deletes: [],
    connection_upserts: connectionUpserts(),
    connection_deletes: [],
  })
  expect(largePatch.status, JSON.stringify(largePatch.data)).toBe(200)
  const document = await session.getJson<Document>(documentPath(project.id, largeCanvasId))
  expect(document.nodes).toHaveLength(200)
  expect(document.connections).toHaveLength(300)
  const retryPayload = {
    base_revision: document.revision,
    client_mutation_id: `t5008-${live.runId}-retry`,
    node_upserts: [{ ...nodeUpserts()[0], content: { label: 'idempotent retry' } }],
    node_deletes: [], connection_upserts: [], connection_deletes: [],
  }
  const firstRetry = await session.requestJson<{ revision: number }>('PATCH', documentPath(project.id, largeCanvasId), retryPayload)
  const secondRetry = await session.requestJson<{ revision: number }>('PATCH', documentPath(project.id, largeCanvasId), retryPayload)
  expect(firstRetry.status).toBe(200)
  expect(secondRetry.status).toBe(200)
  expect(secondRetry.data).toEqual(firstRetry.data)
  const conflictPayload = {
    base_revision: firstRetry.data.revision,
    client_mutation_id: `t5008-${live.runId}-conflict`,
    node_upserts: [{ ...nodeUpserts()[1], content: { label: 'conflict winner' } }],
    node_deletes: [], connection_upserts: [], connection_deletes: [],
  }
  const winner = await session.requestJson<{ revision: number }>('PATCH', documentPath(project.id, largeCanvasId), conflictPayload)
  const loser = await session.requestJson<unknown>('PATCH', documentPath(project.id, largeCanvasId), {
    ...conflictPayload,
    client_mutation_id: `t5008-${live.runId}-conflict-loser`,
  })
  expect(winner.status).toBe(200)
  expect(loser.status).toBe(409)
  const viewport = await session.requestJson<Canvas>('PATCH', `${canvasesPath(project.id)}/${largeCanvasId}/viewport`, { x: -480, y: 320, zoom: 2 })
  expect(viewport.status).toBe(200)

  const duplicated = await session.postJson<{ item: Canvas; order_revision: number }>(`${canvasesPath(project.id)}/${largeCanvasId}/duplicate`, {
    base_order_revision: renamed.data.order_revision,
    name: '重复名称',
  })
  const afterDuplicate = await session.getJson<CanvasList>(canvasesPath(project.id))
  const order = [duplicated.item.id, second.item.id, largeCanvasId]
  const reorder = await session.requestJson<CanvasList>('PATCH', `${canvasesPath(project.id)}/order`, {
    base_order_revision: afterDuplicate.order_revision,
    ordered_canvas_ids: order,
  })
  expect(reorder.status).toBe(200)
  const stale = await session.requestJson<unknown>('PATCH', `${canvasesPath(project.id)}/order`, {
    base_order_revision: afterDuplicate.order_revision,
    ordered_canvas_ids: order,
  })
  expect(stale.status).toBe(409)
  expect(await session.getJson<CanvasList>(canvasesPath(project.id))).toMatchObject({ items: expect.arrayContaining([
    expect.objectContaining({ id: largeCanvasId, sort_order: 2 }),
  ]) })

  const finalDocument = await session.getJson<Document>(documentPath(project.id, largeCanvasId))
  const renderStarted = Date.now()
  await page.goto(`/app/projects/${encodeURIComponent(project.id)}/canvases/${encodeURIComponent(largeCanvasId)}`)
  await expect(page.locator('#canvas-main')).toBeVisible({ timeout: 3000 })
  const stableRenderMs = Date.now() - renderStarted
  const performance = await page.evaluate(async () => {
    const surface = document.querySelector('.canvas-surface')
    const intervals: number[] = []
    const pointerDurations: number[] = []
    let longTasks = 0
    const observer = 'PerformanceObserver' in window
      ? new PerformanceObserver((list) => { longTasks += list.getEntries().filter((entry) => entry.duration >= 200).length })
      : null
    try { observer?.observe({ entryTypes: ['longtask'] }) } catch { /* unsupported in this browser */ }
    const started = performance.now()
    let previous = started
    let frames = 0
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        intervals.push(now - previous)
        previous = now
        frames += 1
        if (surface) {
          const pointerStarted = performance.now()
          surface.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 320 + (frames % 120), clientY: 240 + (frames % 80), pointerId: 1 }))
          pointerDurations.push(performance.now() - pointerStarted)
        }
        if (now - started >= 30000) resolve()
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    observer?.disconnect()
    const sorted = intervals.slice(1).sort((left, right) => left - right)
    const sortedPointer = pointerDurations.sort((left, right) => left - right)
    const frameP95Ms = sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0
    const pointerP95Ms = sortedPointer[Math.max(0, Math.ceil(sortedPointer.length * 0.95) - 1)] ?? 0
    return { durationMs: Math.round(performance.now() - started), fps: frames / ((performance.now() - started) / 1000), frameP95Ms, pointerP95Ms, longTasks }
  })
  expect(stableRenderMs).toBeLessThanOrEqual(3000)
  expect(performance.fps).toBeGreaterThanOrEqual(55)
  expect(performance.frameP95Ms).toBeLessThanOrEqual(33)
  expect(performance.pointerP95Ms).toBeLessThanOrEqual(50)
  expect(performance.longTasks).toBe(0)
  await live.writeState({
    projectId: project.id,
    projectName,
    largeCanvasId,
    duplicateCanvasId: duplicated.item.id,
    checksum: canvasDocumentChecksum(finalDocument),
    revision: finalDocument.revision,
    order,
    performance: { stableRenderMs, ...performance },
  } satisfies LiveState)
})

test('post-restart restores the exact live 200/300 document, viewport, order, and duplicate graph', async ({ live, request, page }) => {
  test.skip(live.phase !== 'post-restart', 'Only the post-restart phase verifies the functional journey')
  const state = await live.readState<LiveState>()
  const session = await live.login(request, page)
  const anonymous = await request.get(`${live.apiOrigin}/projects/${encodeURIComponent(state.projectId)}`)
  expect([401, 403]).toContain(anonymous.status())
  const foreign = await session.requestJson<unknown>('GET', '/projects/not-owned-by-acceptance')
  expect([403, 404]).toContain(foreign.status)
  const projects = await session.getJson<{ items: Project[] }>('/projects')
  expect(projects.items).toContainEqual(expect.objectContaining({ id: state.projectId, name: state.projectName }))
  const canvases = await session.getJson<CanvasList>(canvasesPath(state.projectId))
  expect(canvases.items.map((item) => item.id)).toEqual(state.order)
  const document = await session.getJson<Document>(documentPath(state.projectId, state.largeCanvasId))
  expect(document.nodes).toHaveLength(200)
  expect(document.connections).toHaveLength(300)
  expect(document.revision).toBe(state.revision)
  expect(canvasDocumentChecksum(document)).toBe(state.checksum)
  expect(document.canvas).toMatchObject({ viewport_x: -480, viewport_y: 320, viewport_zoom: 2 })
  const duplicate = await session.getJson<Document>(documentPath(state.projectId, state.duplicateCanvasId))
  expect(duplicate.nodes).toHaveLength(200)
  expect(duplicate.connections).toHaveLength(300)
  expect(new Set(duplicate.nodes.map((node) => (node as { id: string }).id))).not.toEqual(
    new Set(document.nodes.map((node) => (node as { id: string }).id)),
  )
  expect(state.performance.stableRenderMs).toBeLessThanOrEqual(3000)
  expect(state.performance.fps).toBeGreaterThanOrEqual(55)
  expect(state.performance.frameP95Ms).toBeLessThanOrEqual(33)
  expect(state.performance.pointerP95Ms).toBeLessThanOrEqual(50)
  expect(state.performance.longTasks).toBe(0)
})

test('pre-restart captures live responsive Canvas and mobile review boundaries', async ({ live, request, page }) => {
  test.skip(live.phase !== 'pre-restart', 'Visual boundary is captured before the owned restart')
  const state = await live.readState<LiveState>()
  const session = await live.login(request, page)
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 920, height: 900 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport)
    await page.goto(`/app/projects/${encodeURIComponent(state.projectId)}/canvases/${encodeURIComponent(state.largeCanvasId)}`)
    await expect(page.locator('#canvas-main')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('zh-CN')
    const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
    await stage.focus()
    await expect(stage).toHaveAttribute('aria-description', /画布|审阅模式/)
    if (viewport.width === 1440) {
      await page.keyboard.press('?')
      await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('button', { name: '打开画布内容与快捷键' })).toBeFocused()
    }
    const screenshotPath = test.info().outputPath(`live-${viewport.width}x${viewport.height}.png`)
    await page.screenshot({ path: screenshotPath })
    await test.info().attach(`live-${viewport.width}x${viewport.height}`, { path: screenshotPath, contentType: 'image/png' })
    if (viewport.width <= 375) {
      await expect(page.getByRole('button', { name: '自动排列节点' })).toHaveCount(0)
      await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
      await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toBeVisible()
      await expect(page.getByRole('button', { name: /删除节点/ })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /删除连线/ })).toHaveCount(0)
    }
  }
  await session.getJson<Canvas>(`${canvasesPath(state.projectId)}/${state.largeCanvasId}`)
})
