import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildCanvasNodeInteraction } from '../../src/components/canvas/canvas-node-interaction'
import { isConnectionTargetCompatible } from '../../src/components/canvas/composables/use-canvas-connection-presentation'
import type { CanvasNode } from '../../src/types/canvas'
import { createResourceMockState, documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-013')

test('registry capability is the sole node-local editing gate', () => {
  const node: CanvasNode = { id: 'script', type: 'script', title: '脚本', x: 0, y: 0, width: 320, height: 200, content: '初稿', contentData: { subtype: 'script', serialization_version: 1 } }
  expect(buildCanvasNodeInteraction(node, { isReadOnly: false, isSelected: true })).toMatchObject({ kind: 'composer', content: '初稿' })
  expect(buildCanvasNodeInteraction(node, { isReadOnly: true, isSelected: true })).toEqual({ kind: 'static' })
})

test('connection target compatibility follows typed registry ports', () => {
  const source: CanvasNode = { id: 'script', type: 'script', title: '脚本', x: 0, y: 0, width: 320, height: 200, contentData: { subtype: 'script', serialization_version: 1 } }
  const generation: CanvasNode = { id: 'generation', type: 'generation', title: '图片生成', x: 400, y: 0, width: 340, height: 220, contentData: { subtype: 'image', serialization_version: 1 } }
  const note: CanvasNode = { id: 'note', type: 'note', title: '备注', x: 800, y: 0, width: 260, height: 180, contentData: { subtype: 'annotation', serialization_version: 1 } }
  expect(isConnectionTargetCompatible(source, generation, 'out')).toBe(true)
  expect(isConnectionTargetCompatible(source, note, 'out')).toBe(false)
})

test('queued durable tasks trigger bounded resource polling until terminal state', async ({ page }) => {
  const state = createResourceMockState()
  const task = state.tasks.find((item) => item.id === 'task-existing-success')!
  task.status = 'queued'
  await openResourceWorkspace(page, state)
  const taskRequests = () => state.requests.filter((item) => item.method === 'GET' && item.path === '/api/generation-tasks').length
  await expect.poll(taskRequests, { timeout: 4_000 }).toBeGreaterThanOrEqual(2)
  task.status = 'succeeded'
  await expect.poll(taskRequests, { timeout: 5_000 }).toBeGreaterThanOrEqual(3)
})

test('selected editable node persists node-local content and native result media is visible', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)

  const result = page.getByRole('img', { name: '图片结果' })
  await expect(result).toBeVisible()
  expect(await result.evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight }))).toEqual({ width: 320, height: 180 })
  await mkdir(evidenceDirectory, { recursive: true })
  await result.screenshot({ path: resolve(evidenceDirectory, 'visible-image-result.png') })

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toHaveCount(0)
  const editor = page.getByRole('textbox', { name: '编辑镜头脚本内容' })
  await editor.fill('黄昏海岸，人物从画面右侧入场。')
  await editor.blur()
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(0)
  await page.reload()
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: '编辑镜头脚本内容' })).toHaveValue('黄昏海岸，人物从画面右侧入场。')
})

test('IME composition owns the editor until compositionend', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toHaveCount(0)
  const editor = page.getByRole('textbox', { name: '编辑镜头脚本内容' })
  const baseline = documentPatches(state).length
  await editor.dispatchEvent('compositionstart')
  await editor.evaluate((element: HTMLTextAreaElement) => {
    element.value = '正在输入中文'
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '文', inputType: 'insertCompositionText', isComposing: true }))
  })
  await page.waitForTimeout(650)
  expect(documentPatches(state)).toHaveLength(baseline)
  await editor.dispatchEvent('compositionend')
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(baseline)
})

test('broken result media is explicit and visible Canvas edges stay passive', async ({ page }) => {
  const state = createResourceMockState()
  const result = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')!
  ;(result.content as Record<string, unknown>).url = 'https://media.revid.test/broken.png'
  await openResourceWorkspace(page, state)

  const unavailable = page.getByRole('alert').filter({ hasText: '媒体不可用' })
  await expect(unavailable).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await unavailable.screenshot({ path: resolve(evidenceDirectory, 'broken-media-state.png') })
  const line = page.locator('.connection-line').first()
  await expect(line).toHaveAttribute('marker-end', 'url(#canvas-edge-arrow)')
  await expect(page.locator('.connection-hit')).toHaveCSS('pointer-events', 'stroke')
  await expect(page.locator('.connection-layer')).toHaveCSS('pointer-events', 'none')
  await expect(line).toHaveCSS('pointer-events', 'none')
})

test('video result exposes native controls and decoded metadata', async ({ page }) => {
  const state = createResourceMockState()
  const result = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')!
  Object.assign(result.content as Record<string, unknown>, { subtype: 'video', url: 'https://media.revid.test/generated.mp4' })
  await openResourceWorkspace(page, state)
  const video = page.locator('video[aria-label="视频结果"]')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => ({ width: element.videoWidth, height: element.videoHeight, controls: element.controls }))).toEqual({ width: 160, height: 90, controls: true })
})
