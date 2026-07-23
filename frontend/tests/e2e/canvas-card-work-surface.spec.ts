import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
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

test('selected generation card follows the authenticated reference then mention workflow', async ({ page }, testInfo) => {
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
  const [generationCardBox, workSurfaceBox] = await Promise.all([
    page.locator('.canvas-node-surface[data-node-id="visual-generation"]').boundingBox(),
    workSurface.boundingBox(),
  ])
  if (!generationCardBox || !workSurfaceBox) throw new Error('Selected generation workbench geometry is unavailable')
  const workbenchGap = workSurfaceBox.y - (generationCardBox.y + generationCardBox.height)
  expect(workbenchGap).toBeGreaterThanOrEqual(10)
  expect(workbenchGap).toBeLessThanOrEqual(12)
  await expect(workSurface.getByRole('button', { name: '文生视频' })).toHaveCount(0)
  await expect(workSurface.getByRole('button', { name: '首帧生成视频' })).toHaveCount(0)
  await expect(workSurface.getByRole('button', { name: '首尾帧生成视频' })).toHaveCount(0)
  const prompt = workSurface.getByRole('textbox', { name: '卡片生成提示词' })
  await expect(prompt).toBeVisible()
  await expect(workSurface.getByRole('button', { name: '本地上传' })).toHaveCount(0)
  await expect(workSurface.getByRole('button', { name: '项目资产' })).toHaveCount(0)

  const directReferenceBaseline = state.documents[FIRST_CANVAS_ID].connections.length
  await prompt.fill('@')
  const referencePicker = workSurface.getByRole('listbox', { name: '已连接的可引用素材' })
  await expect(referencePicker).toBeVisible()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(directReferenceBaseline)
  const connectedOptions = referencePicker.getByRole('option')
  expect(await connectedOptions.count()).toBeGreaterThan(0)
  await connectedOptions.first().click()
  await expect(prompt).toHaveValue(/@/)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(directReferenceBaseline)

  await prompt.fill('@')
  await referencePicker.getByRole('option').first().focus()
  await page.keyboard.press('Escape')
  await expect(referencePicker).toHaveCount(0)
  await expect(prompt).toBeFocused()

  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await expect(workSurface.getByText('正在从画布选择参考')).toBeVisible()
  const canvasCandidates = page.getByRole('button', { name: /^选择 .+ 作为参考$/ })
  await expect(canvasCandidates).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(canvasCandidates).toHaveCount(0)
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await expect(canvasCandidates).toHaveCount(2)
  await page.mouse.click(420, 120)
  await expect(canvasCandidates).toHaveCount(0)
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await expect(canvasCandidates).toHaveCount(2)
  await page.keyboard.press('Control+z')
  await expect(canvasCandidates).toHaveCount(0)
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await expect(canvasCandidates).toHaveCount(2)
  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-card-work-model')
  await mkdir(outputDirectory, { recursive: true })
  const screenshotPath = resolve(outputDirectory, 'selected-video-card-work-surface.png')
  await page.screenshot({ path: screenshotPath, animations: 'disabled' })
  await testInfo.attach('selected-video-card-work-surface', { path: screenshotPath, contentType: 'image/png' })
  const t6005Directory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')
  await mkdir(t6005Directory, { recursive: true })
  const t6005VideoPath = resolve(t6005Directory, 'video-workbench-1440x900.png')
  await page.screenshot({
    path: t6005VideoPath,
    animations: 'disabled',
    clip: resolveAcceptanceCaptureClip([generationCardBox, workSurfaceBox], { width: 1440, height: 900 }, 32),
  })
  await testInfo.attach('t6-005-video-workbench-1440x900', { path: t6005VideoPath, contentType: 'image/png' })

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

})

test('video reference rail exposes durable roles order removal and per-image prompt intent', async ({ page }, testInfo) => {
  const state = createT6VisualConvergenceState()
  state.capabilityVersion = 6
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'visual-generation')!
  generation.content = {
    ...generation.content,
    generation_parameters: {
      schema_version: 1,
      video: {
        duration_seconds: 5,
        reference_bindings: [
          { node_id: 'visual-reference-top', asset_id: 'asset-reference', role: 'first-frame', order: 0 },
          { node_id: 'visual-selected', asset_id: 'asset-generated', role: 'last-frame', order: 1 },
        ],
      },
    },
  }
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
  const referenceRail = workSurface.getByRole('group', { name: '已选择视频参考' })
  await expect(referenceRail.getByRole('article')).toHaveCount(2)
  await expect(referenceRail.getByText('1')).toBeVisible()
  await expect(referenceRail.getByText('2')).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).include('.canvas-card-work-surface').analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')
  await mkdir(outputDirectory, { recursive: true })
  const screenshotPath = resolve(outputDirectory, 'video-reference-rail-1440x900.png')
  await page.screenshot({ path: screenshotPath, animations: 'disabled' })
  await testInfo.attach('t6-005-video-reference-rail-1440x900', { path: screenshotPath, contentType: 'image/png' })

  const environmentIntent = referenceRail.getByRole('button', { name: '为 环境参考 添加每图意图' })
  await environmentIntent.focus()
  await page.keyboard.press('Enter')
  const prompt = workSurface.getByRole('textbox', { name: '卡片生成提示词' })
  await expect(prompt).toHaveValue(/@环境参考/)
  await expect(prompt).toBeFocused()

  const selectedRole = referenceRail.getByRole('combobox', { name: '人物主参考 参考角色' })
  await selectedRole.selectOption('reference')
  await expect.poll(() => {
    const content = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'visual-generation')?.content as Record<string, unknown>
    const video = (content.generation_parameters as { video: { reference_bindings: Array<{ node_id: string; role: string }> } }).video
    return video.reference_bindings.find((binding) => binding.node_id === 'visual-selected')?.role
  }).toBe('reference')

  await referenceRail.getByRole('button', { name: '前移 人物主参考' }).focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => {
    const content = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'visual-generation')?.content as Record<string, unknown>
    const video = (content.generation_parameters as { video: { reference_bindings: Array<{ node_id: string }> } }).video
    return video.reference_bindings[0]?.node_id
  }).toBe('visual-selected')

  const connectionCount = state.documents[FIRST_CANVAS_ID].connections.length
  await referenceRail.getByRole('button', { name: '移除参考 人物主参考' }).focus()
  await page.keyboard.press('Enter')
  await expect(referenceRail.getByRole('article')).toHaveCount(1)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(connectionCount)
  await page.locator('.workspace-stage').press('Control+z')
  await expect(referenceRail.getByRole('article')).toHaveCount(2)
  await page.locator('.workspace-stage').press('Control+Shift+z')
  await expect(referenceRail.getByRole('article')).toHaveCount(1)
  await prompt.fill('@')
  const picker = workSurface.getByRole('listbox', { name: '已连接的可引用素材' })
  await expect(picker.getByRole('option', { name: '引用 人物主参考' })).toBeVisible()
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

test('selected script keeps direct editing and exposes attached AI authoring', async ({ page }, testInfo) => {
  const state = createT6VisualConvergenceState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const target = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('visual-script-a') ?? null
  ))
  if (!target) throw new Error('Script card geometry is unavailable')
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)

  const scriptSurface = page.locator('.canvas-node-surface[data-node-id="visual-script-a"]')
  await expect(scriptSurface.getByRole('textbox', { name: /编辑/ })).toBeVisible()
  const authoring = scriptSurface.getByRole('region', { name: 'AI 脚本写作' })
  await expect(authoring).toBeVisible()
  const [scriptBox, authoringBox] = await Promise.all([scriptSurface.boundingBox(), authoring.boundingBox()])
  if (!scriptBox || !authoringBox) throw new Error('Attached script authoring geometry is unavailable')
  const gap = authoringBox.y - (scriptBox.y + scriptBox.height)
  expect(gap).toBeGreaterThanOrEqual(10)
  expect(gap).toBeLessThanOrEqual(12)
  expect(authoringBox.x).toBeGreaterThanOrEqual(16)
  expect(authoringBox.x + authoringBox.width).toBeLessThanOrEqual(1424)
  await expect(authoring.getByRole('button', { name: '从创意生成脚本' })).toHaveCount(0)
  await expect(authoring.getByRole('button', { name: '优化当前脚本' })).toBeVisible()
  await expect(authoring.getByRole('textbox', { name: '脚本优化要求' })).toBeVisible()
  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')
  await mkdir(evidenceDirectory, { recursive: true })
  const screenshotPath = resolve(evidenceDirectory, 'script-workbench-1440x900.png')
  await page.screenshot({
    path: screenshotPath,
    animations: 'disabled',
    clip: resolveAcceptanceCaptureClip([scriptBox, authoringBox], { width: 1440, height: 900 }, 32),
  })
  await testInfo.attach('t6-005-script-workbench-1440x900', { path: screenshotPath, contentType: 'image/png' })
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
    const quickActions = element.querySelector('.canvas-card-work-surface__quick-actions')
    const modes = element.querySelector('.canvas-card-work-surface__modes')
    const sources = element.querySelector('.canvas-card-work-surface__sources')
    const connectorNeck = getComputedStyle(element, '::before')
    const promptShell = element.querySelector('.canvas-card-work-surface__prompt-shell')
    const prompt = element.querySelector('textarea')
    const footer = element.querySelector('footer')
    const submit = element.querySelector('.canvas-card-work-surface__submit')
    if (!(prompt instanceof HTMLElement)) throw new Error('Prompt is unavailable')
    const surfaceRect = element.getBoundingClientRect()
    const promptStyle = getComputedStyle(prompt)
    return {
      hasQuickActions: Boolean(quickActions),
      hasPermanentModes: Boolean(modes),
      hasPermanentSources: Boolean(sources),
      hasPromptShell: Boolean(promptShell),
      isSourceAttachedWorkbench: element.getAttribute('data-surface-style') === 'source-attached-media-workbench',
      submitBelongsToFooter: Boolean(footer?.contains(submit)),
      height: surfaceRect.height,
      width: surfaceRect.width,
      radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
      connectorContent: connectorNeck.content,
      promptBackground: promptStyle.backgroundColor,
      promptBorderWidth: Number.parseFloat(promptStyle.borderTopWidth),
    }
  })
  expect(hierarchy.hasQuickActions).toBe(true)
  expect(hierarchy.hasPermanentModes).toBe(false)
  expect(hierarchy.hasPermanentSources).toBe(false)
  expect(hierarchy.hasPromptShell).toBe(true)
  expect(hierarchy.isSourceAttachedWorkbench).toBe(true)
  expect(hierarchy.submitBelongsToFooter).toBe(true)
  expect(hierarchy.height).toBeGreaterThanOrEqual(154)
  expect(hierarchy.width).toBeCloseTo(660, 0)
  expect(hierarchy.radius).toBeGreaterThanOrEqual(15)
  expect(hierarchy.connectorContent).toBe('none')
  expect(hierarchy.promptBackground).not.toBe('rgba(0, 0, 0, 0)')
  expect(hierarchy.promptBorderWidth).toBe(0)

  const mediaCard = page.locator('.canvas-node-surface[data-node-id="generation-cover"]')
  const [mediaCardBox, attachedSurfaceBox] = await Promise.all([mediaCard.boundingBox(), surface.boundingBox()])
  if (!mediaCardBox || !attachedSurfaceBox) throw new Error('Attached workbench geometry is unavailable')
  const attachmentGap = attachedSurfaceBox.y - (mediaCardBox.y + mediaCardBox.height)
  const resolvedAttachmentGap = await surface.evaluate((element) => Number.parseFloat(
    getComputedStyle(element).getPropertyValue('--canvas-card-floating-gap'),
  ))
  expect(attachmentGap).toBeCloseTo(resolvedAttachmentGap, 0)

  const settingsButton = surface.getByRole('button', { name: /生成参数/ })
  await expect(settingsButton).toBeVisible()
  await settingsButton.click()
  const settingsPanel = surface.getByRole('region', { name: '生成参数' })
  await expect(settingsPanel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(settingsPanel).toHaveCount(0)
  await expect(settingsButton).toBeFocused()

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
  const t6005Directory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')
  await mkdir(t6005Directory, { recursive: true })
  const t6005ImagePath = resolve(t6005Directory, 'image-workbench-920x900.png')
  await page.screenshot({ path: t6005ImagePath, animations: 'disabled', clip: compactClip })
  await testInfo.attach('t6-005-image-workbench-920x900', { path: t6005ImagePath, contentType: 'image/png' })
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
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
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

test('canvas reference mode closes across return readonly Canvas switch reload and deletion', async ({ page }, testInfo) => {
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
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await expect(canvasCandidates).toHaveCount(1)
  await workSurface.getByRole('button', { name: '退出参考选择' }).click()
  await expect(canvasCandidates).toHaveCount(0)

  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(canvasCandidates).toHaveCount(0)
  await expect(page.getByRole('region', { name: /Revid/ })).toHaveAttribute('aria-description', '只读审阅模式')
  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')
  await mkdir(evidenceDirectory, { recursive: true })
  const readonlyPath = resolve(evidenceDirectory, 'readonly-review-375x812.png')
  await page.screenshot({ path: readonlyPath, animations: 'disabled' })
  await testInfo.attach('t6-005-readonly-review-375x812', { path: readonlyPath, contentType: 'image/png' })

  await page.setViewportSize({ width: 1366, height: 768 })
  await selectGenerationCard()
  workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await page.reload()
  await expect(canvasCandidates).toHaveCount(0)

  await selectGenerationCard()
  workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Delete')
  await expect(canvasCandidates).toHaveCount(0)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === 'generation-cover')).toBe(false)

  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === 'generation-cover')).toBe(true)
  await selectGenerationCard()
  workSurface = page.getByRole('region', { name: /封面生成 卡片工作区/ })
  await workSurface.getByRole('button', { name: '参考', exact: true }).click()
  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second$/)
  await expect(canvasCandidates).toHaveCount(0)
})

test('empty script card follows the reference source or direct-writing starts', async ({ page }, testInfo) => {
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
  const chooser = surface.getByRole('region', { name: '分镜脚本创作方式' })
  await expect(chooser).toBeVisible()
  await expect(chooser.getByRole('button', { name: '剧本生成分镜脚本' })).toBeEnabled()
  await expect(chooser.getByRole('button', { name: '角色生成分镜脚本' })).toBeEnabled()
  await expect(chooser.getByRole('button', { name: '自己编写分镜脚本' })).toBeEnabled()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 空文本卡片', exact: true }).click()
  await expect(surface.getByRole('region', { name: 'AI 脚本写作' })).toBeVisible()
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')
  await mkdir(evidenceDirectory, { recursive: true })
  const emptyScriptPath = resolve(evidenceDirectory, 'empty-script-1440x900.png')
  await page.screenshot({ path: emptyScriptPath, animations: 'disabled' })
  await testInfo.attach('t6-005-empty-script-1440x900', { path: emptyScriptPath, contentType: 'image/png' })

  const baselineConnections = state.documents[FIRST_CANVAS_ID].connections.length
  await chooser.getByRole('button', { name: '剧本生成分镜脚本' }).click()
  const sourceCandidate = page.getByRole('button', { name: '选择 镜头脚本 作为剧本来源' })
  await expect(sourceCandidate).toBeVisible()
  await sourceCandidate.click()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(baselineConnections + 1)
  expect(state.documents[FIRST_CANVAS_ID].connections.at(-1)).toMatchObject({
    source_node_id: 'script-source', target_node_id: 'empty-text-card', source_port: 'out', target_port: 'in',
  })

  await surface.getByRole('button', { name: '自己编写分镜脚本' }).click()
  await expect(surface.getByRole('textbox')).toBeVisible()
  await expect(surface.getByRole('textbox')).toBeFocused()
})

test('empty script role start persists exact image references and submits them without a graph edge', async ({ page }, testInfo) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'role-script-card',
    node_type: 'script',
    content: { title: '角色分镜脚本', subtype: 'script', serialization_version: 1 },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  const baselineConnections = state.documents[FIRST_CANVAS_ID].connections.length
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 角色分镜脚本', exact: true }).click()
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await page.setViewportSize({ width: 920, height: 900 })

  const surface = page.locator('.canvas-node-surface[data-node-id="role-script-card"]')
  const chooser = surface.getByRole('region', { name: '分镜脚本创作方式' })
  const roleSourceButton = chooser.getByRole('button', { name: '角色生成分镜脚本' })
  await roleSourceButton.click()
  const candidate = page.getByRole('button', { name: '选择 历史图片生成结果 作为角色参考' })
  await expect(candidate).toBeVisible()
  const rolePicker = chooser.locator('.script-empty-state__role-picker')
  await expect(rolePicker).toBeVisible()
  const pickerBox = await rolePicker.boundingBox()
  if (!pickerBox) throw new Error('Role reference picker geometry is unavailable')
  expect(pickerBox.x).toBeGreaterThanOrEqual(16)
  expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(904)

  await candidate.focus()
  await page.keyboard.press('Escape')
  await expect(rolePicker).toHaveCount(0)
  await expect(roleSourceButton).toBeFocused()
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(baselineConnections)
  expect((state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'role-script-card')?.content as Record<string, unknown>).reference_asset_ids).toBeUndefined()

  await roleSourceButton.click()
  await expect(candidate).toBeVisible()
  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')
  await mkdir(evidenceDirectory, { recursive: true })
  const rolePickerPath = resolve(evidenceDirectory, 'empty-script-role-reference-panel.png')
  await rolePicker.screenshot({ path: rolePickerPath, animations: 'disabled' })
  await testInfo.attach('t6-005-empty-script-role-reference-panel', { path: rolePickerPath, contentType: 'image/png' })
  const compactRolePickerPath = resolve(evidenceDirectory, 'empty-script-role-reference-920x900.png')
  await page.screenshot({ path: compactRolePickerPath, animations: 'disabled' })
  await testInfo.attach('t6-005-empty-script-role-reference-920x900', { path: compactRolePickerPath, contentType: 'image/png' })
  await candidate.click()
  await expect(roleSourceButton).toBeFocused()

  await expect.poll(() => {
    const node = state.documents[FIRST_CANVAS_ID].nodes.find((candidate) => candidate.id === 'role-script-card')
    return (node?.content as Record<string, unknown>)?.reference_asset_ids
  }).toEqual(['asset-generated'])
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(baselineConnections)
  await expect(surface.getByText('角色参考 1/8', { exact: true })).toBeVisible()

  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => {
    const node = state.documents[FIRST_CANVAS_ID].nodes.find((candidate) => candidate.id === 'role-script-card')
    return (node?.content as Record<string, unknown>)?.reference_asset_ids
  }).toBeUndefined()
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => {
    const node = state.documents[FIRST_CANVAS_ID].nodes.find((candidate) => candidate.id === 'role-script-card')
    return (node?.content as Record<string, unknown>)?.reference_asset_ids
  }).toEqual(['asset-generated'])

  const authoring = surface.getByRole('region', { name: 'AI 脚本写作' })
  await authoring.getByRole('textbox', { name: '创意 Brief' }).fill('根据角色参考生成一段雨夜车站分镜。')
  await authoring.getByRole('button', { name: '生成新脚本' }).click()
  await expect.poll(() => state.requests.find((request) => (
    request.method === 'POST' && request.path.endsWith('/text-generate') &&
    (request.body as Record<string, unknown>)?.canvas_node_id === 'role-script-card'
  ))?.body).toMatchObject({
    canvas_node_id: 'role-script-card',
    reference_asset_ids: ['asset-generated'],
  })
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(baselineConnections)
})

test('text workflow requires an allowed model and applies the result to the same revision-safe card', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'empty-text-to-video',
    node_type: 'script',
    content: { title: '视频文字起点', subtype: 'prompt', serialization_version: 1 },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  const baselineNodes = state.documents[FIRST_CANVAS_ID].nodes.length
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  let submittedBody: Record<string, unknown> | null = null
  await page.route('**/api/v2/generation-jobs', async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>
    const jobId = 'job-text-same-card'
    state.generationJobCanvasIds[jobId] = FIRST_CANVAS_ID
    state.generationJobs[jobId] = {
      job_id: jobId,
      node_id: 'empty-text-to-video',
      media_type: 'text',
      status: 'succeeded',
      stage: null,
      progress: 100,
      error: null,
      result_asset_id: null,
      version: 2,
      updated_at: '2026-07-23T12:00:01.000Z',
    }
    state.generationJobResults[jobId] = {
      job_id: jobId,
      node_id: 'empty-text-to-video',
      result: { media_type: 'text', content: '同卡生成结果：雨夜街道缓慢推进。' },
      version: 2,
    }
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: jobId,
        project_id: 'project-resources',
        canvas_id: FIRST_CANVAS_ID,
        node_id: 'empty-text-to-video',
        media_type: 'text',
        status: 'queued',
        model_id: 'agnes-2.0-flash',
        quota_revision: 1,
        version: 1,
      }),
    })
  })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const chooser = page.locator('.canvas-node-surface[data-node-id="empty-text-to-video"]').getByRole('group', { name: '文本卡片创作方式' })
  await expect(chooser.getByRole('button', { name: '图片反推提示词' })).toBeDisabled()
  await expect(chooser.getByRole('button', { name: '文字生音乐' })).toBeDisabled()
  await chooser.getByRole('button', { name: '文生视频' }).click()
  const workflow = page.getByRole('form', { name: '视频文字起点 文生视频' })
  await expect(workflow).toBeVisible()
  const cardRect = await page.locator('.canvas-node-surface[data-node-id="empty-text-to-video"]').boundingBox()
  const workflowRect = await workflow.boundingBox()
  expect(cardRect).not.toBeNull()
  expect(workflowRect).not.toBeNull()
  expect(
    workflowRect!.y + workflowRect!.height <= cardRect!.y ||
    workflowRect!.y >= cardRect!.y + cardRect!.height,
  ).toBe(true)
  expect(workflowRect!.y).toBeGreaterThanOrEqual(0)
  expect(workflowRect!.y + workflowRect!.height).toBeLessThanOrEqual(768)
  expect(workflowRect!.x).toBeGreaterThanOrEqual(0)
  expect(workflowRect!.x + workflowRect!.width).toBeLessThanOrEqual(1366)

  const submit = workflow.getByRole('button', { name: '生成到当前卡片' })
  await workflow.getByRole('textbox', { name: '文本工作流提示词' }).fill('雨夜街道上的缓慢推进镜头')
  await expect(submit).toBeDisabled()
  await workflow.getByRole('combobox', { name: '文本生成模型' }).selectOption('agnes-2.0-flash')
  await submit.click()

  await expect.poll(() => submittedBody).toMatchObject({
    project_id: 'project-resources',
    canvas_id: FIRST_CANVAS_ID,
    node_id: 'empty-text-to-video',
    media_type: 'text',
    provider_id: 'agnes',
    model_id: 'agnes-2.0-flash',
    input: {
      prompt: '雨夜街道上的缓慢推进镜头',
      mode: 'text-to-video',
      content_revision: 0,
    },
  })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(baselineNodes)
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'empty-text-to-video')?.content as Record<string, unknown>
  )?.text).toBe('同卡生成结果：雨夜街道缓慢推进。')
  expect(
    state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'empty-text-to-video')?.content,
  ).toMatchObject({
    last_generation_job_id: 'job-text-same-card',
    last_generation_result_version: 2,
  })
})

test('text-to-music remains visible but disabled when no allowed model advertises it', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'empty-text-to-music',
    node_type: 'script',
    content: { title: '音乐文字起点', subtype: 'prompt', serialization_version: 1 },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const chooser = page.locator('.canvas-node-surface[data-node-id="empty-text-to-music"]').getByRole('group', { name: '文本卡片创作方式' })
  await expect(chooser.getByRole('button', { name: '文字生音乐' })).toBeDisabled()
  await expect(page.getByRole('dialog', { name: '音频生成与驱动视频预检' })).toHaveCount(0)
})

test('direct writing on an empty text card autosaves through one undoable command', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'empty-direct-text',
    node_type: 'script',
    content: { title: '直接编写文本', subtype: 'prompt', serialization_version: 1 },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  await openResourceWorkspace(page, state, { width: 1366, height: 768 })
  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.press('Control+0')
  const surface = page.locator('.canvas-node-surface[data-node-id="empty-direct-text"]')
  await surface.getByRole('button', { name: '自己编写内容' }).click()
  const editor = surface.getByRole('textbox', { name: /编辑.*直接编写文本.*内容/ })
  await editor.fill('用户直接编写的文本')
  await editor.blur()

  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'empty-direct-text')?.content as Record<string, unknown>
  )).toMatchObject({ text: '用户直接编写的文本', content_revision: 1 })
  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'empty-direct-text')?.content as Record<string, unknown>
  )?.text ?? '').toBe('')
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'empty-direct-text')?.content as Record<string, unknown>
  )?.text).toBe('用户直接编写的文本')
})

test('refresh restores a persisted text job binding and applies its result to the original card', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes[0]
  const jobId = 'job-text-refresh'
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...source,
    id: 'refresh-text-card',
    node_type: 'script',
    content: {
      title: '刷新恢复文本',
      subtype: 'prompt',
      serialization_version: 1,
      text: '提交时文本',
      content_revision: 2,
      active_generation_job_id: jobId,
      active_generation_job_content_revision: 2,
      active_generation_media_type: 'text',
      active_generation_mode: 'text-to-video',
      active_generation_model_id: 'agnes-2.0-flash',
    },
    position_x: 400,
    position_y: 420,
    width: 280,
    height: 180,
  })
  state.generationJobCanvasIds[jobId] = FIRST_CANVAS_ID
  state.generationJobs[jobId] = {
    job_id: jobId,
    node_id: 'refresh-text-card',
    media_type: 'text',
    status: 'succeeded',
    stage: null,
    progress: 100,
    error: null,
    result_asset_id: null,
    version: 3,
    updated_at: '2026-07-23T12:01:00.000Z',
  }
  state.generationJobResults[jobId] = {
    job_id: jobId,
    node_id: 'refresh-text-card',
    result: { media_type: 'text', content: '刷新后写回原卡的结果' },
    version: 3,
  }
  const baselineNodes = state.documents[FIRST_CANVAS_ID].nodes.length

  await openResourceWorkspace(page, state, { width: 1366, height: 768 })
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'refresh-text-card')?.content as Record<string, unknown>
  )?.text).toBe('刷新后写回原卡的结果')
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(baselineNodes)
  await page.reload()
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'refresh-text-card')?.content as Record<string, unknown>
  )).toMatchObject({
    text: '刷新后写回原卡的结果',
    content_revision: 3,
    last_generation_job_id: jobId,
    last_generation_result_version: 3,
  })
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
  await workSurface.getByRole('button', { name: /生成参数/ }).click()
  const parameterPanel = workSurface.getByRole('region', { name: '生成参数' })
  const keyframesRadio = parameterPanel.getByRole('radio', { name: '关键帧' })
  await keyframesRadio.focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('Escape')
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
