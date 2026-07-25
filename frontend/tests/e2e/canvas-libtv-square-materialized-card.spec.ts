import { expect, test, type Page } from '@playwright/test'
import { Buffer } from 'node:buffer'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'
import { parkAcceptancePointer, resolveAcceptanceCaptureClip } from './canvas-card-acceptance-capture'

interface ScreenRect { height: number; width: number; x: number; y: number }

async function setZoom(page: Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

test('isolated square materialized card matches the official single-card hierarchy', async ({ page }, testInfo) => {
  const state = createResourceMockState()
  const document = state.documents[FIRST_CANVAS_ID]
  const generation = document.nodes.find((node) => node.id === 'generation-cover')!
  const result = document.nodes.find((node) => node.id === 'result-existing')!
  const asset = state.assets.find((candidate) => candidate.id === 'asset-generated')!
  const squareUrl = 'https://media.revid.test/square-1024.svg'

  state.capturedFrames['/square-1024.svg'] = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <rect width="1024" height="1024" rx="48" fill="#6242df"/>
      <path d="M0 0h128v128H0zM896 0h128v128H896zM0 896h128v128H0zM896 896h128v128H896z" fill="#d8ccff"/>
      <text x="512" y="512" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="64">SQUARE 1:1</text>
    </svg>
  `, 'utf8')

  document.nodes = document.nodes.filter((node) => node.id !== 'script-source')
  generation.position_x = 523
  generation.position_y = 160
  result.content = {
    ...result.content,
    url: squareUrl,
    width: 1024,
    height: 1024,
  }
  asset.url = squareUrl

  await openResourceWorkspace(page, state, { width: 1366, height: 768 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  const sourceSurface = page.locator('.canvas-node-surface[data-node-id="generation-cover"]')
  const image = sourceSurface.getByRole('img')
  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute('src', squareUrl)
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight]))
    .toEqual([1024, 1024])
  await expect(sourceSurface.getByLabel('媒体分辨率')).toHaveText('1024 × 1024')

  const before = await sourceSurface.boundingBox()
  if (!before) throw new Error('Square materialized card geometry is unavailable')
  expect(before.width).toBeCloseTo(before.height, 0)
  expect(before.x + before.width / 2).toBeCloseTo(683, 0)
  await expect(page.locator('.canvas-node-surface img')).toHaveCount(1)
  await expect(page.locator('.canvas-node-surface[data-node-id="result-existing"]')).toHaveCount(0)

  await page.mouse.click(before.x + before.width / 2, before.y + before.height / 2)
  const after = await sourceSurface.boundingBox()
  expect(after).toEqual(before)
  await expect(page.locator('.result-lineage-node')).toHaveCount(0)
  await expect(page.locator('.node-status-overlay')).toHaveCount(0)

  const toolbar = page.getByRole('toolbar', { name: '媒体节点操作' })
  const composer = sourceSurface.getByRole('region', { name: /卡片工作区/ })
  await expect(toolbar).toBeVisible()
  await expect(composer).toBeVisible()
  await parkAcceptancePointer(page)
  const [toolbarBox, composerBox] = await Promise.all([toolbar.boundingBox(), composer.boundingBox()])
  if (!toolbarBox || !composerBox) throw new Error('Square contextual surface geometry is unavailable')
  const stageBox = await page.locator('.workspace-stage').boundingBox()
  if (!stageBox) throw new Error('Square workspace stage geometry is unavailable')

  const mediaCenter = before.x + before.width / 2
  expect(toolbarBox.x + toolbarBox.width / 2).toBeCloseTo(mediaCenter, 0)
  expect(composerBox.x).toBeGreaterThanOrEqual(stageBox.x + 32)
  expect(composerBox.x + composerBox.width).toBeLessThanOrEqual(stageBox.x + stageBox.width - 32)
  expect(toolbarBox.width).toBeCloseTo(900, 0)
  expect(toolbarBox.height).toBeGreaterThanOrEqual(48)
  expect(toolbarBox.height).toBeLessThanOrEqual(52)
  expect(composerBox.width / before.width).toBeGreaterThanOrEqual(2.04)
  expect(composerBox.width / before.width).toBeLessThanOrEqual(2.08)
  const toolbarBottomGap = before.y - (toolbarBox.y + toolbarBox.height)
  expect(toolbarBottomGap).toBeGreaterThanOrEqual(26)
  expect(toolbarBottomGap).toBeLessThanOrEqual(34)
  expect(documentPatches(state)).toHaveLength(baselinePatches)

  for (const percent of [17, 36, 50, 67, 82, 100, 200]) {
    await setZoom(page, percent)
    const [zoomedMedia, zoomedComposer] = await Promise.all([sourceSurface.boundingBox(), composer.boundingBox()])
    if (!zoomedMedia || !zoomedComposer) throw new Error(`Square ${percent}% composer geometry is unavailable`)
    expect(zoomedMedia.width).toBeCloseTo(320 * percent / 100, 0)
    expect(zoomedComposer.width).toBeGreaterThanOrEqual(658)
    expect(zoomedComposer.width).toBeLessThanOrEqual(662)
    expect(zoomedComposer.height).toBeGreaterThanOrEqual(188)
    expect(zoomedComposer.x).toBeGreaterThanOrEqual(stageBox.x + 32)
    expect(zoomedComposer.x + zoomedComposer.width).toBeLessThanOrEqual(stageBox.x + stageBox.width - 32)
    expect(zoomedComposer.y - (zoomedMedia.y + zoomedMedia.height)).toBeCloseTo(16 * percent / 100, 0)
  }
  await setZoom(page, 100)

  const squareClip = resolveAcceptanceCaptureClip(
    [toolbarBox, before, composerBox],
    { width: 1366, height: 768 },
  )

  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-materialized-card')
  await mkdir(outputDirectory, { recursive: true })
  const screenshotPath = resolve(outputDirectory, 'selected-materialized-square-card.png')
  await page.screenshot({ path: screenshotPath, animations: 'disabled', clip: squareClip })
  await testInfo.attach('selected-materialized-square-card', { path: screenshotPath, contentType: 'image/png' })

  await setZoom(page, 67)
  await parkAcceptancePointer(page)
  const [officialScaleMedia, officialScaleToolbar, officialScaleComposer] = await Promise.all([
    sourceSurface.boundingBox(), toolbar.boundingBox(), composer.boundingBox(),
  ])
  if (!officialScaleMedia || !officialScaleToolbar || !officialScaleComposer) {
    throw new Error('Official-scale square contextual geometry is unavailable')
  }
  expect(officialScaleMedia.width).toBeCloseTo(320 * 0.67, 0)
  expect(officialScaleToolbar.width).toBeCloseTo(900, 0)
  expect(officialScaleToolbar.height).toBeGreaterThanOrEqual(48)
  expect(officialScaleToolbar.height).toBeLessThanOrEqual(52)
  expect(officialScaleComposer.width).toBeGreaterThanOrEqual(658)
  expect(officialScaleComposer.width).toBeLessThanOrEqual(662)
  expect(officialScaleComposer.height).toBeGreaterThanOrEqual(188)
  expect(officialScaleToolbar.x).toBeGreaterThanOrEqual(stageBox.x)
  expect(officialScaleToolbar.x + officialScaleToolbar.width)
    .toBeLessThanOrEqual(stageBox.x + stageBox.width)
  expect(officialScaleComposer.x).toBeGreaterThanOrEqual(stageBox.x + 32)
  expect(officialScaleComposer.x + officialScaleComposer.width)
    .toBeLessThanOrEqual(stageBox.x + stageBox.width - 32)
  expect(officialScaleComposer.y - (officialScaleMedia.y + officialScaleMedia.height))
    .toBeCloseTo(16 * 0.67, 0)
  expect(documentPatches(state)).toHaveLength(baselinePatches)

  const officialScaleClip = resolveAcceptanceCaptureClip(
    [officialScaleToolbar, officialScaleMedia, officialScaleComposer],
    { width: 1366, height: 768 },
  )
  const officialScaleScreenshotPath = resolve(
    outputDirectory,
    'selected-materialized-square-card-official-scale.png',
  )
  await page.screenshot({
    path: officialScaleScreenshotPath,
    animations: 'disabled',
    clip: officialScaleClip,
  })
  await testInfo.attach('selected-materialized-square-card-official-scale', {
    path: officialScaleScreenshotPath,
    contentType: 'image/png',
  })

  const officialFrameClip = {
    x: Math.floor(officialScaleToolbar.x - 12),
    y: Math.floor(officialScaleToolbar.y - 34),
    width: 960,
    height: 562,
  }
  expect(officialFrameClip.x).toBeGreaterThanOrEqual(0)
  expect(officialFrameClip.y).toBeGreaterThanOrEqual(0)
  expect(officialFrameClip.x + officialFrameClip.width).toBeLessThanOrEqual(1366)
  expect(officialFrameClip.y + officialFrameClip.height).toBeLessThanOrEqual(768)
  const officialFrameScreenshotPath = resolve(
    outputDirectory,
    'selected-materialized-square-card-official-frame.png',
  )
  await page.screenshot({
    path: officialFrameScreenshotPath,
    animations: 'disabled',
    clip: officialFrameClip,
  })
  await testInfo.attach('selected-materialized-square-card-official-frame', {
    path: officialFrameScreenshotPath,
    contentType: 'image/png',
  })
})
