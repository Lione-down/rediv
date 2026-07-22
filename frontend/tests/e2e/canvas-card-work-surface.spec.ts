import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Buffer } from 'node:buffer'
import { createResourceMockState, documentPatches, FIRST_CANVAS_ID, openResourceWorkspace } from './canvas-resource-generation-fixture'
import { createT6VisualConvergenceState } from './canvas-card-visual-convergence-fixture'
import { ACCEPTANCE_LANDSCAPE_URL, configureLandscapeMaterializedAcceptance, parkAcceptancePointer, resolveAcceptanceCaptureClip } from './canvas-card-acceptance-capture'
interface ScreenRect { height: number; width: number; x: number; y: number }

function expectMeasuredMediaToolbar(toolbar: ScreenRect, node: ScreenRect, stage: ScreenRect) {
  const safeLeft = stage.x + 28
  const safeRight = stage.x + stage.width - 28
  const expectedWidth = Math.min(900, safeRight - safeLeft)
  const expectedLeft = Math.min(
    Math.max(node.x + node.width / 2 - expectedWidth / 2, safeLeft),
    safeRight - expectedWidth,
  )
  expect(toolbar.width).toBeCloseTo(expectedWidth, 0)
  expect(toolbar.x).toBeCloseTo(expectedLeft, 0)
}

test('selected generation card owns its modes sources prompt and canvas references', async ({ page }, testInfo) => {
  const state = createT6VisualConvergenceState()
  const referenceNode = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'visual-reference-top')!
  const referenceAsset = state.assets.find((asset) => asset.id === 'asset-reference')!
  state.assets.push({ ...referenceAsset, id: 'asset-extra-reference', canvas_node_id: 'visual-extra-reference' })
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...referenceNode,
    id: 'visual-extra-reference',
    content: { ...referenceNode.content, title: '额外画布参考', asset_id: 'asset-extra-reference' },
    position_x: 1530,
    position_y: 650,
  })
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const target = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('visual-generation') ?? null
  ))
  if (!target) throw new Error('Generation card geometry is unavailable')
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
  const closeDetails = page.getByRole('button', { name: '关闭节点详情' })
  if (await closeDetails.isVisible().catch(() => false)) await closeDetails.click()

  const workSurface = page.getByRole('region', { name: /卡片工作区/ })
  await expect(workSurface).toBeVisible()
  await expect(workSurface.getByRole('button', { name: '文生视频' })).toBeVisible()
  await expect(workSurface.getByRole('button', { name: '首帧生成视频' })).toBeVisible()
  await expect(workSurface.getByRole('button', { name: '首尾帧生成视频' })).toBeVisible()
  await expect(workSurface.getByRole('textbox', { name: '卡片生成提示词' })).toBeVisible()
  await expect(workSurface.getByRole('button', { name: '本地上传' })).toBeEnabled()
  await expect(workSurface.getByRole('button', { name: '项目资产' })).toBeEnabled()

  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await expect(workSurface.getByText('正在从画布选择参考')).toBeVisible()
  const canvasCandidates = page.getByRole('button', { name: /^选择 .+ 作为参考$/ })
  await expect(canvasCandidates).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(canvasCandidates).toHaveCount(0)
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await expect(canvasCandidates).toHaveCount(2)
  await page.mouse.click(420, 120)
  await expect(canvasCandidates).toHaveCount(0)
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await expect(canvasCandidates).toHaveCount(2)
  await page.keyboard.press('Control+z')
  await expect(canvasCandidates).toHaveCount(0)
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await expect(canvasCandidates).toHaveCount(2)
  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-card-work-model')
  await mkdir(outputDirectory, { recursive: true })
  const screenshotPath = resolve(outputDirectory, 'selected-video-card-work-surface.png')
  await page.screenshot({ path: screenshotPath, animations: 'disabled' })
  await testInfo.attach('selected-video-card-work-surface', { path: screenshotPath, contentType: 'image/png' })

  const referenceConnectionCount = state.documents[FIRST_CANVAS_ID].connections.length
  await page.getByRole('button', { name: '选择 额外画布参考 作为参考' }).click()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(referenceConnectionCount + 1)
  await expect(canvasCandidates).toHaveCount(0)
  expect(state.documents[FIRST_CANVAS_ID].connections.at(-1)).toMatchObject({
    source_node_id: 'visual-extra-reference',
    target_node_id: 'visual-generation',
    target_port: 'media',
  })
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(referenceConnectionCount)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(referenceConnectionCount + 1)

  const baselineConnectionCount = state.documents[FIRST_CANVAS_ID].connections.length
  await workSurface.getByLabel('上传本地素材到当前卡片').setInputFiles({
    name: 'card-reference.png',
    mimeType: 'image/png',
    buffer: Buffer.from('89504e470d0a1a0a0000000049454e44ae426082', 'hex'),
  })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(baselineConnectionCount + 1)
  expect(state.documents[FIRST_CANVAS_ID].connections.at(-1)).toMatchObject({
    target_node_id: 'visual-generation',
    target_port: 'media',
    metadata: { input_order: 1, source_acquisition: 'card' },
  })

  const projectAssetsTrigger = workSurface.getByRole('button', { name: '项目资产' })
  const patchesBeforeProjectAssetDismissal = documentPatches(state).length
  await projectAssetsTrigger.click()
  const projectAssetsPanel = page.getByRole('complementary', { name: '项目资源' })
  await expect(projectAssetsPanel).toBeVisible()
  await expect(page.getByText('选择一张项目图片，作为当前生成卡片的来源和画布引用。')).toBeVisible()
  await projectAssetsPanel.getByRole('tab', { name: '项目资产' }).focus()
  await page.keyboard.press('Escape')
  await expect(projectAssetsPanel).toHaveCount(0)
  await expect(projectAssetsTrigger).toBeFocused()
  await expect(workSurface).toBeVisible()
  expect(documentPatches(state)).toHaveLength(patchesBeforeProjectAssetDismissal)
})

test('materialized result is visibly projected into the same generation card', async ({ page }, testInfo) => {
  const state = createResourceMockState()
  configureLandscapeMaterializedAcceptance(state, FIRST_CANVAS_ID)
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-materialized-card')
  await mkdir(outputDirectory, { recursive: true })
  const targetBeforeSelection = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('generation-cover') ?? null
  ))
  const sourceSurface = page.locator('.canvas-node-surface[data-node-id="generation-cover"]')
  if (!targetBeforeSelection) throw new Error('Image generation card geometry is unavailable')
  await expect(sourceSurface.getByRole('img')).toBeVisible()
  await expect(sourceSurface.getByRole('img')).toHaveAttribute('src', ACCEPTANCE_LANDSCAPE_URL)
  await expect(sourceSurface.getByLabel('媒体分辨率')).toHaveText('640 × 360')
  await expect.poll(() => page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('result-existing') ?? null
  ))).toBeNull()
  const idleBox = await sourceSurface.boundingBox()
  if (!idleBox) throw new Error('Idle materialized card geometry is unavailable')
  const idleClip = resolveAcceptanceCaptureClip([idleBox], { width: 1366, height: 768 }, 32)
  const idleScreenshotPath = resolve(outputDirectory, 'idle-materialized-image-card.png')
  await page.screenshot({ path: idleScreenshotPath, animations: 'disabled', clip: idleClip })
  await testInfo.attach('idle-materialized-image-card', { path: idleScreenshotPath, contentType: 'image/png' })

  await page.mouse.click(
    targetBeforeSelection.x + targetBeforeSelection.width / 2,
    targetBeforeSelection.y + targetBeforeSelection.height / 2,
  )
  await expect(page.getByRole('button', { name: '关闭节点详情' })).toHaveCount(0)
  await expect.poll(() => page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('result-existing') ?? null
  ))).toBeNull()
  const targetAfterSelection = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('generation-cover') ?? null
  ))
  expect(targetAfterSelection).toEqual(targetBeforeSelection)
  await expect(sourceSurface.getByRole('img')).toBeVisible()
  await expect(sourceSurface.getByLabel('媒体分辨率')).toHaveText('640 × 360')
  await expect(sourceSurface.getByRole('region', { name: /卡片工作区/ })).toBeVisible()
  await parkAcceptancePointer(page)
  const [sourceBox, workSurfaceBox] = await Promise.all([
    sourceSurface.boundingBox(),
    sourceSurface.getByRole('region', { name: /卡片工作区/ }).boundingBox(),
  ])
  if (!sourceBox || !workSurfaceBox) throw new Error('Projected media card geometry is unavailable')
  expect(workSurfaceBox.width / sourceBox.width).toBeGreaterThanOrEqual(2.04)
  expect(workSurfaceBox.width / sourceBox.width).toBeLessThanOrEqual(2.08)
  await expect(page.getByRole('toolbar', { name: '媒体节点操作' })).toBeVisible()
  const mediaToolbarBox = await page.getByRole('toolbar', { name: '媒体节点操作' }).boundingBox()
  const workspaceBox = await page.locator('.workspace-stage').boundingBox()
  if (!mediaToolbarBox || !workspaceBox) throw new Error('Media toolbar geometry is unavailable')
  expectMeasuredMediaToolbar(mediaToolbarBox, sourceBox, workspaceBox)
  expect(mediaToolbarBox.height).toBeGreaterThanOrEqual(48)
  expect(mediaToolbarBox.height).toBeLessThanOrEqual(52)
  const mediaToolbarBottomGap = sourceBox.y - (mediaToolbarBox.y + mediaToolbarBox.height)
  expect(mediaToolbarBottomGap).toBeGreaterThanOrEqual(26)
  expect(mediaToolbarBottomGap).toBeLessThanOrEqual(34)
  await expect(page.getByRole('toolbar', { name: /1 个已选节点的操作/ })).toHaveCount(0)
  await expect(page.locator('.result-lineage-node')).toHaveCount(0)
  const screenshotPath = resolve(outputDirectory, 'selected-materialized-image-card.png')
  const selectedClip = resolveAcceptanceCaptureClip([sourceBox, workSurfaceBox, mediaToolbarBox], { width: 1366, height: 768 })
  await page.screenshot({ path: screenshotPath, animations: 'disabled', clip: selectedClip })
  await testInfo.attach('selected-materialized-image-card', { path: screenshotPath, contentType: 'image/png' })

  await page.getByRole('toolbar', { name: '媒体节点操作' }).getByLabel('打开节点详情').click()
  await expect(page.getByRole('button', { name: '关闭节点详情' })).toBeVisible()
  await page.getByRole('button', { name: '关闭节点详情' }).click()

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 历史图片生成结果' }).click()
  await expect.poll(() => page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('result-existing') ?? null
  ))).not.toBeNull()
})

test('selected materialized composer presents one continuous creator hierarchy', async ({ page }, testInfo) => {
  const state = createResourceMockState()
  configureLandscapeMaterializedAcceptance(state, FIRST_CANVAS_ID)
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  const target = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('generation-cover') ?? null
  ))
  if (!target) throw new Error('Materialized composer target is unavailable')
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)

  const surface = page.locator('.canvas-card-work-surface')
  await expect(surface).toBeVisible()
  const hierarchy = await surface.evaluate((element) => {
    const topBand = element.querySelector('.canvas-card-work-surface__toolbar')
    const modes = element.querySelector('.canvas-card-work-surface__modes')
    const sources = element.querySelector('.canvas-card-work-surface__sources')
    const prompt = element.querySelector('textarea')
    const footer = element.querySelector('footer')
    const submit = element.querySelector('.canvas-card-work-surface__submit')
    if (!(prompt instanceof HTMLElement)) throw new Error('Prompt is unavailable')
    const surfaceRect = element.getBoundingClientRect()
    const promptStyle = getComputedStyle(prompt)
    return {
      hasTopBand: Boolean(topBand),
      controlsShareTopBand: modes?.parentElement === topBand && sources?.parentElement === topBand,
      submitBelongsToFooter: Boolean(footer?.contains(submit)),
      height: surfaceRect.height,
      promptBackground: promptStyle.backgroundColor,
      promptBorderWidth: Number.parseFloat(promptStyle.borderTopWidth),
    }
  })
  expect(hierarchy.hasTopBand).toBe(true)
  expect(hierarchy.controlsShareTopBand).toBe(true)
  expect(hierarchy.submitBelongsToFooter).toBe(true)
  expect(hierarchy.height).toBeGreaterThanOrEqual(188)
  expect(hierarchy.promptBackground).toBe('rgba(0, 0, 0, 0)')
  expect(hierarchy.promptBorderWidth).toBe(0)

  const prompt = surface.locator('textarea')
  await prompt.focus()
  await expect.poll(() => prompt.evaluate((element) => {
    const style = getComputedStyle(element)
    return style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2
  })).toBe(true)
  await prompt.blur()
  await expect(prompt).not.toBeFocused()
  await page.locator('.canvas-surface').focus()
  await page.setViewportSize({ width: 920, height: 900 })
  await parkAcceptancePointer(page)
  const compactBox = await surface.boundingBox()
  expect(compactBox).not.toBeNull()
  expect(compactBox!.x).toBeGreaterThanOrEqual(0)
  expect(compactBox!.x + compactBox!.width).toBeLessThanOrEqual(920)
  expect(documentPatches(state)).toHaveLength(baselinePatches)
  const [compactMediaBox, compactToolbarBox] = await Promise.all([
    page.locator('.canvas-node-surface[data-node-id="generation-cover"]').boundingBox(),
    page.getByRole('toolbar', { name: '媒体节点操作' }).boundingBox(),
  ])
  if (!compactMediaBox || !compactToolbarBox) throw new Error('Compact acceptance geometry is unavailable')
  const compactClip = resolveAcceptanceCaptureClip([compactBox!, compactMediaBox, compactToolbarBox], { width: 920, height: 900 })
  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-materialized-card')
  await mkdir(outputDirectory, { recursive: true })
  const screenshotPath = resolve(outputDirectory, 'selected-materialized-image-card-920x900.png')
  await page.screenshot({ path: screenshotPath, animations: 'disabled', clip: compactClip })
  await testInfo.attach('selected-materialized-image-card-920x900', { path: screenshotPath, contentType: 'image/png' })
})

test('card-local work surface projects pending and failure on the originating card', async ({ page }) => {
  const state = createResourceMockState()
  const existingResult = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing')!
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...existingResult,
    id: 'failure-reference',
    node_type: 'asset',
    content: {
      ...(existingResult.content as Record<string, unknown>),
      title: '失败场景参考',
      asset_id: 'asset-reference',
      source_task_id: null,
      url: 'https://media.revid.test/reference.png',
    },
    position_x: 1380,
    position_y: 460,
  })
  state.generationOutcome = 'failure'
  let releaseGeneration!: () => void
  state.generationGate = new Promise<void>((resolveGate) => { releaseGeneration = resolveGate })
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  const target = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('generation-cover') ?? null
  ))
  if (!target) throw new Error('Generation card geometry is unavailable')
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
  const workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await expect(workSurface.getByText('正在从画布选择参考')).toBeVisible()
  await workSurface.getByRole('textbox', { name: '卡片生成提示词' }).fill('保持当前卡片生成')
  const request = page.waitForRequest((candidate) => candidate.method() === 'POST' && candidate.url().endsWith('/api/image-generate'))
  await workSurface.getByRole('button', { name: '在当前卡片生成' }).click()
  await request
  await expect(workSurface.getByRole('status')).toContainText('正在提交')
  releaseGeneration()
  await expect(workSurface.getByRole('status')).toContainText('失败', { timeout: 6_000 })
  await expect(workSurface.getByRole('alert')).toContainText('mock provider unavailable')
  await expect(workSurface.getByText('正在从画布选择参考')).toHaveCount(0)
})

test('canvas reference mode closes across return readonly Canvas switch reload and deletion', async ({ page }) => {
  const state = createResourceMockState()
  const existingResult = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing')!
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...existingResult,
    id: 'lifecycle-reference',
    node_type: 'asset',
    content: {
      ...(existingResult.content as Record<string, unknown>),
      title: '生命周期参考',
      asset_id: 'asset-lifecycle-reference',
      source_task_id: null,
      url: 'https://media.revid.test/lifecycle-reference.png',
    },
    position_x: 1380,
    position_y: 460,
  })
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  const canvasCandidates = page.getByRole('button', { name: /^选择 .+ 作为参考$/ })

  async function selectGenerationCard() {
    await page.getByRole('region', { name: /Revid/ }).focus()
    await page.keyboard.press('Control+0')
    await expect.poll(() => page.locator('.canvas-surface').evaluate((element) => {
      const inspection = (element as HTMLElement & {
        __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
      }).__revidCanvasInspection
      return Boolean(
        inspection?.getNodeScreenRect?.('generation-cover') &&
        inspection?.getNodeScreenRect?.('lifecycle-reference'),
      )
    })).toBe(true)
    const target = await page.locator('.canvas-surface').evaluate((element) => (
      (element as HTMLElement & {
        __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
      }).__revidCanvasInspection?.getNodeScreenRect?.('generation-cover') ?? null
    ))
    if (!target) throw new Error('Generation card geometry is unavailable')
    await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
    await expect(page.getByRole('region', { name: /封面生成 卡片工作区/ })).toBeVisible()
  }

  await selectGenerationCard()
  let workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await expect(canvasCandidates).toHaveCount(1)
  await workSurface.getByRole('button', { name: '退出参考选择' }).click()
  await expect(canvasCandidates).toHaveCount(0)

  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(canvasCandidates).toHaveCount(0)
  await expect(page.getByRole('region', { name: /Revid/ })).toHaveAttribute('aria-description', '只读审阅模式')

  await page.setViewportSize({ width: 1366, height: 768 })
  await selectGenerationCard()
  workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await page.reload()
  await expect(canvasCandidates).toHaveCount(0)

  await selectGenerationCard()
  workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Delete')
  await expect(canvasCandidates).toHaveCount(0)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === 'generation-cover')).toBe(false)

  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === 'generation-cover')).toBe(true)
  await selectGenerationCard()
  workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '画布参考' }).click()
  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second$/)
  await expect(canvasCandidates).toHaveCount(0)
})

test('empty text card exposes multiple work choices and enters direct writing in place', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'empty-text-card',
    node_type: 'script',
    content: { title: '空文本卡片', subtype: 'script', serialization_version: 1 },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const surface = page.locator('.canvas-node-surface[data-node-id="empty-text-card"]')
  const chooser = surface.getByRole('group', { name: '文本卡片创作方式' })
  await expect(chooser).toBeVisible()
  await expect(chooser.getByRole('button', { name: '自己编写内容' })).toBeEnabled()
  await expect(chooser.getByRole('button', { name: '文生视频' })).toBeEnabled()
  await expect(chooser.getByRole('button', { name: '图片反推提示词' })).toBeDisabled()
  await expect(chooser.getByRole('button', { name: '文字生音乐' })).toBeEnabled()

  await chooser.getByRole('button', { name: '自己编写内容' }).click()
  await expect(surface.getByRole('textbox')).toBeVisible()
  await expect(surface.getByRole('textbox')).toBeFocused()
})

test('text-to-video choice creates and selects a connected video generation card', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'empty-text-to-video',
    node_type: 'script',
    content: { title: '视频文字起点', subtype: 'script', serialization_version: 1 },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  const baselineNodes = state.documents[FIRST_CANVAS_ID].nodes.length
  const baselineConnections = state.documents[FIRST_CANVAS_ID].connections.length
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const chooser = page.locator('.canvas-node-surface[data-node-id="empty-text-to-video"]').getByRole('group', { name: '文本卡片创作方式' })
  await chooser.getByRole('button', { name: '文生视频' }).click()
  const workflow = page.getByRole('form', { name: '视频文字起点 文生视频' })
  await expect(workflow).toBeVisible()
  await workflow.getByRole('textbox', { name: '文本工作流提示词' }).fill('雨夜街道上的缓慢推进镜头')
  await workflow.getByRole('button', { name: '创建视频卡片' }).click()

  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(baselineNodes + 1)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(baselineConnections + 1)
  const created = state.documents[FIRST_CANVAS_ID].nodes.at(-1)
  expect(created).toMatchObject({ node_type: 'generation', content: expect.objectContaining({ subtype: 'video' }) })
  await expect(page.locator(`.canvas-node-surface[data-node-id="${created?.id}"]`).getByRole('region', { name: /卡片工作区/ })).toBeVisible()
})

test('text-to-music choice opens the existing safe audio preflight', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'empty-text-to-music',
    node_type: 'script',
    content: { title: '音乐文字起点', subtype: 'script', serialization_version: 1 },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const chooser = page.locator('.canvas-node-surface[data-node-id="empty-text-to-music"]').getByRole('group', { name: '文本卡片创作方式' })
  await chooser.getByRole('button', { name: '文字生音乐' }).click()
  await expect(page.getByRole('dialog', { name: '音频生成与驱动视频预检' })).toBeVisible()
})

test('keyframes mode writes the matching video reference contract before mock generation', async ({ page }) => {
  const state = createT6VisualConvergenceState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const target = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('visual-generation') ?? null
  ))
  if (!target) throw new Error('Video generation card geometry is unavailable')
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
  const workSurface = page.getByRole('region', { name: /卡片工作区/ })
  await workSurface.getByRole('button', { name: '首尾帧生成视频' }).click()
  await expect(workSurface.getByRole('button', { name: '在当前卡片生成' })).toBeEnabled()
  await workSurface.getByRole('button', { name: '在当前卡片生成' }).click()

  await expect.poll(() => state.generationCount).toBe(1)
  const persisted = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'visual-generation')
  expect(persisted?.content).toMatchObject({
    generation_parameters: {
      schema_version: 1,
      video: expect.objectContaining({ reference_mode: 'keyframes' }),
    },
  })
})
