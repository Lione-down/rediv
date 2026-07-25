import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canvasNodeWorldRect } from '../../src/components/canvas/canvas-geometry'
import { buildCanvasNodePresentation, canvasNodeVisualSize } from '../../src/components/canvas/canvas-node-presentation'
import type { CanvasNode } from '../../src/types/canvas'
import { addEarlierVariant, createResourceMockState, documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'
import { resolveOwnedMediaActionTarget } from '../../src/modules/canvas/professional-action-registry'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-015-final')

function exposeCanonicalResult(state: ReturnType<typeof createResourceMockState>) {
  const source = state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')!
  const content = source.content as Record<string, unknown>
  delete content.generation_status
  delete content.generation_task_id
  delete content.result_materialized_task_id
  state.tasks = state.tasks.filter((task) => task.canvas_node_id !== 'generation-cover')
}

test('text, generation, and result nodes expose semantic presentation geometry', () => {
  const base = { x: 120, y: 80, width: 320, height: 180, title: 'Node', contentData: { serialization_version: 1 } }
  const text = { ...base, id: 'text', type: 'script', contentData: { ...base.contentData, subtype: 'script' } } satisfies CanvasNode
  const generation = { ...base, id: 'generation', type: 'generation', contentData: { ...base.contentData, subtype: 'image' } } satisfies CanvasNode
  const result = { ...base, id: 'result', type: 'result', contentData: { ...base.contentData, subtype: 'image', url: 'https://media.revid.test/result.png', width: 1600, height: 900 } } satisfies CanvasNode

  expect(buildCanvasNodePresentation(text).visualKind).toBe('text')
  expect(buildCanvasNodePresentation(generation).visualKind).toBe('generation')
  expect(buildCanvasNodePresentation(result)).toMatchObject({ visualKind: 'result', media: { aspectRatio: 16 / 9 } })
  expect(canvasNodeVisualSize(text).height).toBe(160)
  expect(canvasNodeVisualSize(generation).height).toBe(160)
  expect(canvasNodeVisualSize(result)).toEqual({ width: 320, height: 180 })
  expect(canvasNodeWorldRect(text, 'label').top).toBeLessThan(text.y)
  expect(canvasNodeWorldRect(text, 'composer').top).toBeGreaterThan(text.y + canvasNodeVisualSize(text).height)
})

test('result media has one visible surface, keeps its ratio, and visible edges stay passive', async ({ page }) => {
  const state = createResourceMockState()
  exposeCanonicalResult(state)
  const result = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')!
  delete (result.content as Record<string, unknown>).width
  delete (result.content as Record<string, unknown>).height
  await openResourceWorkspace(page, state)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const image = page.getByRole('img', { name: '图片结果' })
  await expect(image).toBeVisible()
  const dimensions = await image.evaluate((element: HTMLImageElement) => {
    const rect = element.getBoundingClientRect()
    const surface = element.closest('.canvas-node-surface')!.getBoundingClientRect()
    return {
      naturalRatio: element.naturalWidth / element.naturalHeight,
      renderedRatio: rect.width / rect.height,
      surfaceRatio: surface.width / surface.height,
    }
  })
  expect(dimensions.naturalRatio).toBeCloseTo(16 / 9, 5)
  expect(dimensions.renderedRatio).toBeCloseTo(16 / 9, 1)
  expect(dimensions.surfaceRatio).toBeCloseTo(16 / 9, 1)
  await expect.poll(() => {
    const adopted = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')?.content.aspect_ratio
    return typeof adopted === 'number' ? adopted : 0
  }).toBeCloseTo(16 / 9, 2)
  await expect(page.getByRole('img', { name: '图片结果' })).toHaveCount(1)
  const viewportStyle = await page.locator('.canvas-node-media__viewport').first().evaluate((element) => {
    const style = getComputedStyle(element)
    return { borderWidth: Number.parseFloat(style.borderTopWidth), radius: Number.parseFloat(style.borderTopLeftRadius) }
  })
  expect(viewportStyle.borderWidth).toBe(1)
  expect(viewportStyle.radius).toBe(12)
  const resolution = page.getByLabel('媒体分辨率')
  await expect(resolution).toBeVisible()
  await expect(resolution).toHaveText(/\d+ × \d+/)
  const metadataHeader = await resolution.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const viewport = element.closest('.canvas-node-media')?.querySelector('.canvas-node-media__viewport')?.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      parentClass: element.parentElement?.className ?? '',
      rect: { bottom: rect.bottom, right: rect.right },
      viewport: viewport ? { right: viewport.right, top: viewport.top } : null,
      background: style.backgroundColor,
      backdropFilter: style.backdropFilter,
      borderWidth: Number.parseFloat(style.borderTopWidth),
      radius: Number.parseFloat(style.borderTopLeftRadius),
    }
  })
  expect(metadataHeader.parentClass).toContain('canvas-node-media')
  expect(metadataHeader.parentClass).not.toContain('viewport')
  expect(metadataHeader.viewport).not.toBeNull()
  expect(metadataHeader.rect.right).toBeCloseTo(metadataHeader.viewport!.right, 0)
  expect(metadataHeader.viewport!.top - metadataHeader.rect.bottom).toBeGreaterThanOrEqual(4)
  expect(metadataHeader.viewport!.top - metadataHeader.rect.bottom).toBeLessThanOrEqual(8)
  expect(metadataHeader.background).toBe('rgba(0, 0, 0, 0)')
  expect(metadataHeader.backdropFilter).toBe('none')
  expect(metadataHeader.borderWidth).toBe(0)
  expect(metadataHeader.radius).toBe(0)
  await expect(page.locator('.connection-hit')).toHaveCSS('pointer-events', 'stroke')
  await expect(page.locator('.connection-layer')).toHaveCSS('pointer-events', 'none')
  await expect(page.locator('.connection-flow')).toHaveCount(0)
  const activeEdge = page.locator('.connection-line.active').first()
  await expect(activeEdge).toHaveCSS('stroke-width', '2px')
  await expect(page.locator('.connection-hit').first()).toHaveCSS('stroke-width', '20px')
  await expect(activeEdge).not.toHaveAttribute('marker-end', /.+/)
  await expect(page.locator('#canvas-edge-arrow')).toHaveCount(0)
  await expect(activeEdge).toHaveCSS('pointer-events', 'none')
  await expect(activeEdge).toHaveCSS('stroke-dasharray', 'none')
  await page.locator('.connection-hit').first().focus()
  await page.keyboard.press('Enter')
  const selectedFlow = page.locator('.connection-flow[data-flow-reason="selected"]')
  await expect(selectedFlow).toHaveCount(1)
  await expect(selectedFlow).toBeVisible()
  await expect(selectedFlow).toHaveCSS('animation-name', /canvas-connection-flow/)
  await expect(selectedFlow).toHaveCSS('animation-duration', '3s')
  await expect(selectedFlow).toHaveCSS('pointer-events', 'none')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'canvas-media-and-passive-edges.png'), fullPage: true })
})

test('edge hover owns one localized flow and clears without graph mutation', async ({ page }) => {
  const state = createResourceMockState()
  exposeCanonicalResult(state)
  await openResourceWorkspace(page, state)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const baselinePatches = documentPatches(state).length

  await page.locator('.connection-hit').first().dispatchEvent('pointerenter')
  const hoverFlow = page.locator('.connection-flow[data-flow-reason="hover"]')
  await expect(hoverFlow).toHaveCount(1)
  await expect(hoverFlow).toHaveCSS('animation-duration', '3s')
  await page.locator('.connection-hit').first().dispatchEvent('pointerleave')
  await expect(hoverFlow).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('owned media action target fails closed on project, owner, status, and URL drift', () => {
  const state = createResourceMockState()
  const node = state.documents['canvas-first'].nodes.find((candidate) => candidate.id === 'result-existing')!
  const context = {
    assets: state.assets,
    projectId: 'project-resources',
    selectedNodes: [{
      id: node.id,
      type: node.node_type,
      title: String(node.content.title),
      contentData: node.content,
      x: node.position_x,
      y: node.position_y,
      width: node.width,
      height: node.height,
    }],
    userId: 'user-resource',
  }

  expect(resolveOwnedMediaActionTarget(context)).toMatchObject({
    assetId: 'asset-generated',
    kind: 'image',
    nodeId: 'result-existing',
    url: 'https://media.revid.test/generated.png',
  })
  expect(resolveOwnedMediaActionTarget({ ...context, projectId: 'other-project' })).toBeNull()
  expect(resolveOwnedMediaActionTarget({ ...context, userId: 'other-user' })).toBeNull()
  expect(resolveOwnedMediaActionTarget({
    ...context,
    assets: context.assets.map((asset) => asset.id === 'asset-generated' ? { ...asset, status: 'deleted' } : asset),
  })).toBeNull()
  expect(resolveOwnedMediaActionTarget({
    ...context,
    assets: context.assets.map((asset) => asset.id === 'asset-generated' ? { ...asset, url: 'https://media.revid.test/drift.png' } : asset),
  })).toBeNull()
})

test('selected owned image exposes contextual actions without fabricating unsupported execution', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 历史图片生成结果' }).click()

  const toolbar = page.getByRole('toolbar', { name: '媒体节点操作' })
  await expect(toolbar).toBeVisible()
  for (const name of ['高清放大', '扩展画面', '局部重绘', '擦除区域', '主体抠图', '图片拆分', '下载媒体', '全屏查看']) {
    await expect(toolbar.getByLabel(name)).toBeVisible()
  }
  for (const name of ['高清放大', '扩展画面', '多角度', '光影控制', '局部重绘', '擦除区域', '主体抠图', '图片拆分', '画笔', '裁剪']) {
    await expect(toolbar.getByText(name, { exact: true })).toBeVisible()
  }
  for (const name of ['多角度', '光影控制', '画笔', '裁剪']) {
    await expect(toolbar.getByLabel(name)).toBeDisabled()
  }
  await expect(toolbar.getByLabel('图片拆分')).toBeDisabled()
  await expect(toolbar.getByLabel('下载媒体')).toHaveAttribute('href', 'https://media.revid.test/generated.png')

  const geometry = await page.evaluate(() => {
    const toolbarRect = document.querySelector<HTMLElement>('.canvas-media-toolbar')!.getBoundingClientRect()
    const mediaRect = document.querySelector<HTMLElement>('.canvas-node-surface[data-node-id="result-existing"]')!.getBoundingClientRect()
    return {
      bottomGap: mediaRect.top - toolbarRect.bottom,
      centerDelta: Math.abs((mediaRect.left + mediaRect.width / 2) - (toolbarRect.left + toolbarRect.width / 2)),
      toolbarWidth: toolbarRect.width,
      widthRatio: toolbarRect.width / mediaRect.width,
    }
  })
  expect(geometry.bottomGap).toBeGreaterThanOrEqual(26)
  expect(geometry.bottomGap).toBeLessThanOrEqual(34)
  expect(geometry.centerDelta).toBeLessThanOrEqual(2)
  expect(geometry.toolbarWidth).toBeCloseTo(900, 0)
  expect(geometry.widthRatio).toBeGreaterThanOrEqual(2.75)
  expect(geometry.widthRatio).toBeLessThanOrEqual(2.9)

  await page.evaluate(() => {
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value() {
        this.setAttribute('data-fullscreen-requested', 'true')
        return Promise.resolve()
      },
    })
  })
  await toolbar.getByLabel('全屏查看').click()
  await expect(page.locator('.canvas-node-media__viewport[data-fullscreen-requested="true"]')).toBeVisible()

  await toolbar.getByLabel('高清放大').click()
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  await expect(palette.getByRole('option')).toHaveCount(1)
  await expect(palette.getByRole('option')).toContainText('高清放大')
})

test('image and video generation editors expose compact capability-owned submission summaries', async ({ page }) => {
  const state = createResourceMockState()
  const imageGeneration = state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')!
  state.documents['canvas-first'].nodes.push({
    ...imageGeneration,
    id: 'video-generation-parity',
    content: {
      ...imageGeneration.content,
      title: '视频生成参数验收',
      subtype: 'video',
      text: '海面镜头缓慢推进',
      generation_status: undefined,
      generation_task_id: undefined,
      result_materialized_task_id: undefined,
    },
    position_x: 600,
    position_y: 520,
  })
  await openResourceWorkspace(page, state)

  for (const item of [
    { title: '封面生成', media: '图片', summary: ['输出1 个', '成本估算不可用'] },
    { title: '视频生成参数验收', media: '视频', summary: ['输出1 个', '成本估算不可用', '音频暂不可用'] },
  ]) {
    await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
    await page.getByRole('button', { name: `选择并定位 ${item.title}` }).click()
    const editor = page.getByRole('region', { name: '生成任务编辑器' })
    await expect(editor.getByLabel('生成提示词')).toBeVisible()
    await expect(editor.getByRole('region', { name: '生成参数' })).toBeVisible()
    await expect(editor.getByRole('button', { name: `开始${item.media}生成` })).toBeVisible()
    const summary = editor.getByRole('group', { name: '生成提交摘要' })
    await expect(summary).toBeVisible()
    for (const text of item.summary) await expect(summary).toContainText(text)
  }
})

test('selected result family exposes a restrained version stack without hiding graph identities', async ({ page }) => {
  const state = createResourceMockState()
  addEarlierVariant(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 历史图片生成结果' }).click()

  const stack = page.getByLabel('2 个生成结果版本')
  await expect(stack).toBeVisible()
  await expect(page.getByRole('button', { name: '定位到 历史图片生成结果' })).toBeVisible()
  await expect(page.getByRole('button', { name: '定位到 更早的封面版本' })).toBeVisible()
  const geometry = await stack.evaluate((element) => {
    const stackRect = element.getBoundingClientRect()
    const mediaRect = document.querySelector<HTMLElement>('.canvas-node-surface[data-node-id="result-existing"]')!.getBoundingClientRect()
    return {
      leftDelta: stackRect.left - mediaRect.left,
      topDelta: stackRect.top - mediaRect.top,
      widthDelta: stackRect.width - mediaRect.width,
    }
  })
  expect(geometry.leftDelta).toBeGreaterThanOrEqual(4)
  expect(geometry.leftDelta).toBeLessThanOrEqual(8)
  expect(geometry.topDelta).toBeGreaterThanOrEqual(4)
  expect(geometry.topDelta).toBeLessThanOrEqual(8)
  expect(Math.abs(geometry.widthDelta)).toBeLessThanOrEqual(1)
})

test('16:9, 1:1, and 9:16 media remain recognizable without stretching', async ({ page }) => {
  const cases = [
    { url: 'https://media.revid.test/landscape.png', width: 320, height: 180 },
    { url: 'https://media.revid.test/square.png', width: 240, height: 240 },
    { url: 'https://media.revid.test/portrait.png', width: 180, height: 320 },
  ]
  for (const item of cases) {
    const state = createResourceMockState()
    const result = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')!
    Object.assign(result.content as Record<string, unknown>, { url: item.url, width: item.width, height: item.height })
    await openResourceWorkspace(page, state)
    const image = page.getByRole('img', { name: '图片素材' })
    await expect(image).toBeVisible()
    const metrics = await image.evaluate((element: HTMLImageElement) => ({
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      objectFit: getComputedStyle(element).objectFit,
      surfaceRatio: element.closest('.canvas-node-surface')!.getBoundingClientRect().width /
        element.closest('.canvas-node-surface')!.getBoundingClientRect().height,
    }))
    expect(metrics).toMatchObject({ naturalWidth: item.width, naturalHeight: item.height, objectFit: 'cover' })
    expect(metrics.surfaceRatio).toBeCloseTo(item.width / item.height, 1)
    expect(Math.abs(metrics.naturalWidth / metrics.naturalHeight - item.width / item.height)).toBeLessThan(1 / Math.max(item.width, item.height))
    await expect(page.getByRole('img', { name: '图片素材' })).toHaveCount(1)
  }
})

test('portrait media context menu resolves its complete visible surface', async ({ page }) => {
  const state = createResourceMockState()
  const result = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')!
  Object.assign(result.content as Record<string, unknown>, {
    url: 'https://media.revid.test/portrait.png', width: 180, height: 320,
  })
  await openResourceWorkspace(page, state)
  const image = page.getByRole('img', { name: '图片素材' })
  await expect(image).toBeVisible()
  const surface = image.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " canvas-node-surface ")]')
  const box = await surface.boundingBox()
  if (!box) throw new Error('Portrait media surface is unavailable')

  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 12, { button: 'right' })

  await expect(page.getByText('复制节点', { exact: true })).toBeVisible()
  await expect(page.getByText('新建脚本节点', { exact: true })).toHaveCount(0)
})

test('minimap centers portrait media from canonical visible bounds', async ({ page }) => {
  const state = createResourceMockState()
  const result = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')!
  Object.assign(result.content as Record<string, unknown>, {
    url: 'https://media.revid.test/portrait.png', width: 180, height: 320,
  })
  await openResourceWorkspace(page, state)

  await page.getByRole('button', { name: '定位到 封面生成' }).click()

  const image = page.getByRole('img', { name: '图片素材' })
  const surface = image.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " canvas-node-surface ")]')
  const [canvasBox, surfaceBox] = await Promise.all([
    page.locator('.canvas-surface').boundingBox(),
    surface.boundingBox(),
  ])
  if (!canvasBox || !surfaceBox) throw new Error('Canvas or portrait media surface is unavailable')
  const canvasCenter = { x: canvasBox.x + canvasBox.width / 2, y: canvasBox.y + canvasBox.height / 2 }
  const surfaceCenter = { x: surfaceBox.x + surfaceBox.width / 2, y: surfaceBox.y + surfaceBox.height / 2 }

  expect(Math.abs(surfaceCenter.x - canvasCenter.x)).toBeLessThanOrEqual(2)
  expect(Math.abs(surfaceCenter.y - canvasCenter.y)).toBeLessThanOrEqual(2)
})

test('DOM media and composer scale from the shared world geometry at 10%, 100%, and 200%', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const zoom = page.getByLabel('缩放百分比')
  const surface = page.locator('.canvas-node-surface.is-media').first()
  const widths = new Map<number, number>()
  for (const percent of [100, 10, 200]) {
    await zoom.fill(String(percent))
    await zoom.press('Enter')
    await expect(zoom).toHaveValue(String(percent))
    widths.set(percent, (await surface.boundingBox())!.width)
  }
  expect(Math.abs(widths.get(10)! - widths.get(100)! * 0.1)).toBeLessThanOrEqual(1)
  expect(Math.abs(widths.get(200)! - widths.get(100)! * 2)).toBeLessThanOrEqual(1)
})

test('dense overview keeps media recognizable while idle edges recede at 36% and 17%', async ({ page }) => {
  const state = createResourceMockState()
  const sourceNodes = state.documents['canvas-first'].nodes
  const script = sourceNodes.find((node) => node.id === 'script-source')!
  const generation = sourceNodes.find((node) => node.id === 'generation-cover')!
  const result = sourceNodes.find((node) => node.id === 'result-existing')!
  const connection = state.documents['canvas-first'].connections[0]
  state.documents['canvas-first'].nodes = []
  state.documents['canvas-first'].connections = []
  for (let index = 0; index < 24; index += 1) {
    const column = index % 6
    const row = Math.floor(index / 6)
    const x = 120 + column * 920
    const y = 140 + row * 320
    const scriptId = `dense-script-${index}`
    const generationId = `dense-generation-${index}`
    const resultId = `dense-result-${index}`
    state.documents['canvas-first'].nodes.push(
      { ...script, id: scriptId, content: { ...script.content, title: `脚本 ${index + 1}` }, position_x: x, position_y: y },
      { ...generation, id: generationId, content: { ...generation.content, title: `生成 ${index + 1}` }, position_x: x + 350, position_y: y },
      { ...result, id: resultId, content: { ...result.content, title: `结果 ${index + 1}` }, position_x: x + 700, position_y: y },
    )
    state.documents['canvas-first'].connections.push(
      {
        ...connection,
        id: `dense-prompt-${index}`,
        source_node_id: scriptId,
        source_port: 'out',
        target_node_id: generationId,
        target_port: 'prompt',
      },
      {
        ...connection,
        id: `dense-result-edge-${index}`,
        source_node_id: generationId,
        source_port: 'out',
        target_node_id: resultId,
        target_port: 'in',
      },
      {
        ...connection,
        id: `dense-cross-${index}`,
        source_node_id: scriptId,
        source_port: 'out',
        target_node_id: `dense-generation-${(index + 1) % 24}`,
        target_port: 'prompt',
      },
    )
  }
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })
  await expect(page.locator('.connection-line.active')).toHaveCount(48)
  await expect(page.locator('.canvas-node-surface.is-media')).toHaveCount(24)

  const zoom = page.getByLabel('缩放百分比')
  for (const percent of [36, 17]) {
    await zoom.fill(String(percent))
    await zoom.press('Enter')
    await expect(zoom).toHaveValue(String(percent))
    const metrics = await page.evaluate(() => {
      const edge = document.querySelector<SVGPathElement>('.connection-line.active')!
      const media = document.querySelector<HTMLElement>('.canvas-node-surface.is-media')!.getBoundingClientRect()
      const style = getComputedStyle(edge)
      return {
        markerCount: document.querySelectorAll('#canvas-edge-arrow').length,
        mediaHeight: media.height,
        mediaWidth: media.width,
        opacity: Number(style.opacity),
        strokeWidth: Number.parseFloat(style.strokeWidth),
      }
    })
    expect(metrics.mediaWidth).toBeCloseTo(320 * percent / 100, 0)
    expect(metrics.mediaHeight).toBeCloseTo(180 * percent / 100, 0)
    expect(metrics.opacity).toBeLessThanOrEqual(percent === 36 ? 0.6 : 0.45)
    expect(metrics.strokeWidth).toBeLessThanOrEqual(percent === 36 ? 1.2 : 1)
    expect(metrics.markerCount).toBe(0)
  }
})

test('selected editable node opens a composer below the node content surface', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toHaveCount(0)
  await page.locator('.canvas-node-surface[data-node-id="script-source"] .canvas-runtime-card__body').dblclick()
  const editor = page.getByRole('textbox', { name: '编辑镜头脚本内容' })
  const composer = page.getByRole('region', { name: '节点内容编辑器' })
  await expect(editor).toBeVisible()
  await expect(composer).toBeVisible()
  const rects = await page.locator('.canvas-node-surface.is-composer').evaluate((element) => {
    const composerRect = element.getBoundingClientRect()
    return { top: composerRect.top, height: composerRect.height }
  })
  expect(rects.height).toBeGreaterThan(68)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-node-composer.png'), fullPage: true })
})

test('empty media keeps upload in the official-equivalent Add authority without duplicate node chrome', async ({ page }) => {
  const state = createResourceMockState()
  state.documents['canvas-first'].nodes.push({
    ...state.documents['canvas-first'].nodes[0],
    id: 'empty-image-asset',
    node_type: 'asset',
    content: { title: '待上传图片', subtype: 'image', serialization_version: 1 },
    position_x: 1380,
    position_y: 460,
  })
  await openResourceWorkspace(page, state)

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 待上传图片' }).click()
  await expect(page.getByRole('toolbar', { name: '空媒体恢复操作' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '为当前媒体上传素材' })).toHaveCount(0)

  await page.getByRole('button', { name: '添加节点' }).click()
  await page.getByRole('menu', { name: '添加节点' }).getByRole('menuitem', { name: '上传素材' }).click()
  await expect(page.getByRole('complementary', { name: '项目资源' })).toBeVisible()
})

test('accepted viewport matrix retains desktop editing and mobile review-only hierarchy', async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900, name: '1440x900', readonly: false },
    { width: 1366, height: 768, name: '1366x768', readonly: false },
    { width: 920, height: 900, name: '920x900', readonly: false },
    { width: 375, height: 812, name: '375x812', readonly: true },
  ]
  await mkdir(evidenceDirectory, { recursive: true })
  for (const viewport of viewports) {
    await openResourceWorkspace(page, createResourceMockState(), { width: viewport.width, height: viewport.height })
    const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
    await expect(stage).toHaveAttribute('aria-description', viewport.readonly ? '只读审阅模式' : '可编辑画布')
    await stage.focus()
    await page.keyboard.press('Control+0')
    await expect(page.getByRole('img', { name: '图片素材' })).toBeVisible()
    const resolution = page.getByLabel('媒体分辨率').first()
    await expect(resolution).toBeVisible()
    const [resolutionBox, mediaBox] = await Promise.all([
      resolution.boundingBox(),
      resolution.locator('xpath=..').locator('.canvas-node-media__viewport').boundingBox(),
    ])
    if (!resolutionBox || !mediaBox) throw new Error(`${viewport.name} media header geometry is unavailable`)
    expect(resolutionBox.x + resolutionBox.width).toBeCloseTo(mediaBox.x + mediaBox.width, 0)
    expect(resolutionBox.y + resolutionBox.height).toBeLessThanOrEqual(mediaBox.y)
    expect(resolutionBox.x).toBeGreaterThanOrEqual(0)
    expect(resolutionBox.x + resolutionBox.width).toBeLessThanOrEqual(viewport.width)
    if (viewport.width === 920) {
      await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
      await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
      const graphDialog = page.getByRole('dialog', { name: '画布内容与快捷键' })
      await expect(graphDialog).toHaveCount(0)
      await page.getByRole('button', { name: '关闭节点详情' }).click()
      await expect(page.locator('.n-drawer-mask')).toHaveCount(0)
      await page.locator('.canvas-node-surface[data-node-id="script-source"] .canvas-runtime-card__body').dblclick()
      await expect(page.getByRole('region', { name: '节点内容编辑器' })).toBeVisible()
    }
    if (viewport.readonly) await expect(page.getByRole('textbox', { name: /编辑.*内容/ })).toHaveCount(0)
    await page.screenshot({ path: resolve(evidenceDirectory, `${viewport.name}.png`), fullPage: true })
  }
})
