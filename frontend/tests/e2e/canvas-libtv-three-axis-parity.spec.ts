import { expect, test, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createLibTvParityState } from './canvas-libtv-parity-fixture'
import { createResourceMockState, documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 't5-096', 'revid', '2026-07-20')
const evidenceManifestPath = resolve(process.cwd(), '..', 'ai', 'evidence', 't5-096', 'revid-review-evidence-2026-07-20.json')
const currentSnapshotOverlayPath = resolve(process.cwd(), '..', 'ai', 'evidence', 't6-003', 't5-096-snapshot-overlay-2026-07-21.json')
const shouldUpdateEvidence = process.env.UPDATE_T5_096_EVIDENCE === '1'

interface EvidenceManifest {
  files: Array<{ name: string; sha256: string; snapshot_sha256?: string }>
}

async function openEmptyWorkspace(page: Page, viewport = { width: 1440, height: 900 }) {
  const state = createResourceMockState()
  state.documents['canvas-first'].nodes = []
  state.documents['canvas-first'].connections = []
  await openResourceWorkspace(page, state, viewport)
  return state
}

async function capture(page: Page, name: string, baseline: 't5-096' | 't6-011-candidate' = 't5-096') {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(Array.from(document.images).map(async (image) => {
      if (!image.complete) await new Promise<void>((resolveImage) => image.addEventListener('load', () => resolveImage(), { once: true }))
      await image.decode().catch(() => undefined)
    }))
    for (const video of document.querySelectorAll<HTMLVideoElement>('video')) {
      video.pause()
      video.load()
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        await Promise.race([
          new Promise<void>((resolveMetadata) => video.addEventListener('loadedmetadata', () => resolveMetadata(), { once: true })),
          new Promise<void>((resolveTimeout) => setTimeout(resolveTimeout, 1000)),
        ])
      }
    }
    await new Promise<void>((resolveSettled) => setTimeout(resolveSettled, 350))
    await new Promise<void>((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())))
  })
  const screenshot = await page.screenshot({ animations: 'disabled', caret: 'hide' })
  const comparisonScreenshot = await page.screenshot({
    animations: 'disabled',
    caret: 'hide',
    mask: [page.locator('video')],
    maskColor: '#ff00ff',
  })
  const snapshotName = `${baseline}-${name}`
  if (shouldUpdateEvidence) {
    await mkdir(evidenceDirectory, { recursive: true })
    await writeFile(resolve(evidenceDirectory, name), screenshot)
  } else if (baseline === 't5-096') {
    const manifest = JSON.parse(await readFile(evidenceManifestPath, 'utf8')) as EvidenceManifest
    const currentSnapshotOverlay = JSON.parse(await readFile(currentSnapshotOverlayPath, 'utf8')) as EvidenceManifest
    const evidence = currentSnapshotOverlay.files.find((file) => file.name === name)
      ?? manifest.files.find((file) => file.name === name)
    expect(evidence?.snapshot_sha256, `missing verification snapshot hash for ${name}`).toBeTruthy()
    const snapshot = await readFile(test.info().snapshotPath(snapshotName))
    const snapshotHash = createHash('sha256').update(snapshot).digest('hex')
    expect(snapshotHash, `${name} verification snapshot integrity drift`).toBe(evidence!.snapshot_sha256)
  }
  expect(comparisonScreenshot).toMatchSnapshot(snapshotName, { maxDiffPixelRatio: 0.002, threshold: 0.2 })
}

async function setZoom(page: Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

test('L096-RAIL-DISCLOSURES-EMPTY-NATIVE matches the observed rail geometry across exact viewports', async ({ page }) => {
  const observations = [
    { viewport: { width: 1440, height: 900 }, first: { left: 579.5, top: 847.2 }, last: { left: 828.5, top: 847.2 } },
    { viewport: { width: 1366, height: 768 }, first: { left: 542.7, top: 715.2 }, last: { left: 791.7, top: 715.2 } },
    { viewport: { width: 920, height: 900 }, first: { left: 319.5, top: 847.2 }, last: { left: 568.5, top: 847.2 } },
  ]

  for (const observation of observations) {
    await openEmptyWorkspace(page, observation.viewport)
    const metrics = await page.getByRole('toolbar', { name: '画布主要操作' }).evaluate((rail) => {
    const railRect = rail.getBoundingClientRect()
    const buttons = Array.from(rail.querySelectorAll<HTMLButtonElement>('button'))
      .filter((button) => {
        if (button.closest('details:not([open])')) return false
        const rect = button.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
      .map((button) => {
        const rect = button.getBoundingClientRect()
        const visualRect = button.querySelector<HTMLElement>('[data-rail-visual]')?.getBoundingClientRect()
        return {
          height: rect.height,
          left: rect.left,
          top: rect.top,
          visualHeight: visualRect?.height ?? null,
          visualWidth: visualRect?.width ?? null,
          width: rect.width,
        }
      })
    return {
      bottomGap: innerHeight - railRect.bottom,
      buttonHeightSpread: Math.max(...buttons.map((button) => button.height)) - Math.min(...buttons.map((button) => button.height)),
      buttonTopSpread: Math.max(...buttons.map((button) => button.top)) - Math.min(...buttons.map((button) => button.top)),
      buttonWidthSpread: Math.max(...buttons.map((button) => button.width)) - Math.min(...buttons.map((button) => button.width)),
      centerDelta: Math.abs(railRect.left + railRect.width / 2 - innerWidth / 2),
      flexDirection: getComputedStyle(rail).flexDirection,
      firstButton: buttons[0],
      lastButton: buttons.at(-1),
      lefts: buttons.map((button) => button.left),
      missingVisualSurfaces: buttons.filter((button) => button.visualWidth === null || button.visualHeight === null).length,
      visualHeights: buttons.map((button) => button.visualHeight),
      visualWidths: buttons.map((button) => button.visualWidth),
    }
    })

    expect(metrics.flexDirection).toBe('row')
    expect(metrics.bottomGap).toBeLessThanOrEqual(24)
    expect(metrics.centerDelta).toBeLessThanOrEqual(2)
    expect(metrics.buttonTopSpread).toBeLessThanOrEqual(2)
    expect(metrics.buttonWidthSpread).toBeLessThanOrEqual(2)
    expect(metrics.buttonHeightSpread).toBeLessThanOrEqual(2)
    expect(metrics.firstButton.width).toBeGreaterThanOrEqual(40)
    expect(metrics.firstButton.height).toBeGreaterThanOrEqual(40)
    expect(metrics.missingVisualSurfaces).toBe(0)
    expect(metrics.visualWidths).toEqual(metrics.visualWidths.map(() => 32))
    expect(metrics.visualHeights).toEqual(metrics.visualHeights.map(() => 32))
    expect(metrics.lefts).toEqual([...metrics.lefts].sort((leftA, leftB) => leftA - leftB))
    expect(Math.abs(metrics.firstButton.left + 4 - observation.first.left), JSON.stringify({ metrics, observation })).toBeLessThanOrEqual(2)
    expect(Math.abs(metrics.firstButton.top + 4 - observation.first.top), JSON.stringify({ metrics, observation })).toBeLessThanOrEqual(2)
    expect(Math.abs(metrics.lastButton!.left + 4 - observation.last.left), JSON.stringify({ metrics, observation })).toBeLessThanOrEqual(2)
    expect(Math.abs(metrics.lastButton!.top + 4 - observation.last.top), JSON.stringify({ metrics, observation })).toBeLessThanOrEqual(2)
  }
})

test('L096-DISCLOSURE-ADD-ESC exposes the scoped nine-action catalog without mutation', async ({ page }) => {
  const state = await openEmptyWorkspace(page)
  const trigger = page.getByRole('button', { name: '添加节点' })

  await trigger.click()
  const menu = page.getByRole('menu', { name: '添加节点' })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveCount(9)
  await expect(menu.getByRole('menuitem').allTextContents()).resolves.toEqual([
    '文本',
    '脚本',
    '图片生成',
    '视频生成',
    '视频合成',
    '音频生成',
    '素材库NEW',
    '上传',
    '从生成历史选择',
  ])
  await menu.getByRole('menuitem', { name: '上传' }).click()
  await expect(page.getByRole('complementary', { name: '项目资源' })).toBeVisible()

  expect(state.documents['canvas-first'].nodes).toHaveLength(0)
  expect(state.documents['canvas-first'].connections).toHaveLength(0)
  expect(documentPatches(state)).toHaveLength(0)
})

test('L096-DISCLOSURE-ADD-VIDEO-SYNTHESIS creates the authoritative Video Composition card', async ({ page }) => {
  const state = await openEmptyWorkspace(page)

  await page.getByRole('button', { name: '添加节点' }).click()
  await page.getByRole('menuitem', { name: '视频合成' }).click()

  await expect.poll(() => state.documents['canvas-first'].nodes.length).toBe(1)
  const composition = state.documents['canvas-first'].nodes[0]
  expect(composition.content.subtype).toBe('video-composition')
  const card = page.locator(`.canvas-runtime-card[data-node-id="${composition.id}"]`)
  await card.locator('.canvas-runtime-card__drag-region').click()
  await expect(page.locator('[data-capability-workflow="video-composition"]')).toBeVisible()
  await expect(page.getByRole('dialog', { name: '视频编辑预检' })).toHaveCount(0)
  expect(state.documents['canvas-first'].connections).toHaveLength(0)
  expect(documentPatches(state)).toHaveLength(1)
})

test('L096-DISCLOSURE-ADD-HISTORY opens the existing generation history authority', async ({ page }) => {
  const state = await openEmptyWorkspace(page)

  await page.getByRole('button', { name: '添加节点' }).click()
  await page.getByRole('menuitem', { name: '从生成历史选择' }).click()

  const resources = page.getByRole('complementary', { name: '项目资源' })
  await expect(resources).toBeVisible()
  await expect(resources.getByRole('tab', { name: '生成记录' })).toHaveAttribute('aria-selected', 'true')
  await expect(resources.getByRole('tabpanel', { name: '生成记录' })).toBeVisible()
  await resources.getByRole('button', { name: '关闭项目资源' }).click()
  await expect(page.getByRole('button', { name: '添加节点' })).toBeFocused()
  expect(state.documents['canvas-first'].nodes).toHaveLength(0)
  expect(state.documents['canvas-first'].connections).toHaveLength(0)
  expect(documentPatches(state)).toHaveLength(0)
})

test('L096-CONTEXT-OVERLAY-EXCLUSIVE keeps one active contextual surface without mutation', async ({ page }) => {
  const state = await openEmptyWorkspace(page)

  await page.getByRole('button', { name: '打开修订历史', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toBeVisible()

  await page.getByRole('button', { name: '添加节点' }).click()
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toHaveCount(0)
  await expect(page.getByRole('menu', { name: '添加节点' })).toBeVisible()

  await page.getByRole('button', { name: '打开修订历史', exact: true }).click()
  await expect(page.getByRole('menu', { name: '添加节点' })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toBeVisible()

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toBeVisible()

  await page.getByRole('button', { name: '添加节点' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toHaveCount(0)
  await page.getByRole('menuitem', { name: '上传' }).click()

  await expect(page.getByRole('complementary', { name: '项目资源' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toHaveCount(0)
  expect(state.documents['canvas-first'].nodes).toHaveLength(0)
  expect(state.documents['canvas-first'].connections).toHaveLength(0)
  expect(documentPatches(state)).toHaveLength(0)
})

test('L096-REVID-EMPTY-EXACT-MATRIX records exact empty viewports and zoom states', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 920, height: 900 },
  ]) {
    const state = await openEmptyWorkspace(page, viewport)
    expect(page.viewportSize()).toEqual(viewport)
    await capture(page, `revid-empty-${viewport.width}x${viewport.height}-100pct.png`)
    expect(documentPatches(state)).toHaveLength(0)
  }

  const state = await openEmptyWorkspace(page)
  for (const percent of [17, 36, 200]) {
    await setZoom(page, percent)
    await capture(page, `revid-empty-1440x900-${percent}pct.png`)
  }
  await page.getByRole('button', { name: '添加节点' }).click()
  await capture(page, 'revid-empty-add-disclosure-1440x900-200pct.png')
  expect(documentPatches(state)).toHaveLength(0)
})

test('L096-REVID-POPULATED-CONTEXT records media-first graph and selected high-zoom context', async ({ page }) => {
  const responsiveState = createLibTvParityState()
  await openResourceWorkspace(page, responsiveState, { width: 1440, height: 900 })
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+0')
  const fittedZoom = await page.getByLabel('缩放百分比').inputValue()

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 920, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.getByLabel('缩放百分比')).toHaveValue(fittedZoom)
    expect(responsiveState.documents['canvas-first'].nodes.filter((node) => node.node_type === 'group')).toHaveLength(1)
    expect(responsiveState.documents['canvas-first'].nodes.filter((node) => node.node_type !== 'group')).toHaveLength(10)
    await expect(page.locator('.canvas-node-surface:not(.is-composer)')).toHaveCount(11)
    await expect(page.locator('.connection-line.active')).toHaveCount(11)
    await expect(page.locator('.canvas-node-surface.is-media')).toHaveCount(9)
    await expect(page.getByRole('toolbar', { name: '空媒体恢复操作' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '为当前媒体上传素材' })).toHaveCount(0)
    await capture(
      page,
      `revid-populated-${viewport.width}x${viewport.height}-fit.png`,
      't6-011-candidate',
    )
    expect(documentPatches(responsiveState)).toHaveLength(0)
  }

  const state = createLibTvParityState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: /选择并定位.*角色主参考/ }).click()
  const contextPanel = page.getByRole('complementary', { name: '节点详情 角色主参考' })
  await expect(contextPanel).toBeVisible()

  await page.getByRole('button', { name: '打开修订历史', exact: true }).click()
  await expect(contextPanel).toHaveCount(0)
  await page.getByRole('button', { name: '关闭修订历史' }).click()
  await expect(contextPanel).toBeVisible()

  await page.getByRole('button', { name: '添加节点' }).click()
  await expect(contextPanel).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(contextPanel).toBeVisible()

  await capture(page, 'revid-image-selected-1440x900-100pct.png', 't6-011-candidate')
  await setZoom(page, 200)
  await capture(page, 'revid-image-selected-1440x900-200pct.png', 't6-011-candidate')
  await page.keyboard.press('Escape')
  expect(documentPatches(state)).toHaveLength(0)
})
