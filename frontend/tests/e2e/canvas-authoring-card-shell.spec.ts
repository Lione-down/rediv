import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  resolveCanvasAuthoringCardPresentation,
} from '../../src/components/canvas/canvas-authoring-card-presentation'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-073-authoring-cards')

function node(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'authoring-node',
    type: 'script',
    title: '镜头脚本',
    x: 40,
    y: 60,
    width: 320,
    height: 200,
    content: '黄昏海岸，人物从左侧进入画面。',
    contentData: { subtype: 'script', serialization_version: 1 },
    status: 'idle',
    ...overrides,
  }
}

test('only canonical script, note, and generation nodes receive authoring cards', () => {
  expect(resolveCanvasAuthoringCardPresentation(node())?.kind).toBe('script')
  expect(resolveCanvasAuthoringCardPresentation(node({ type: 'note', contentData: { subtype: 'annotation', serialization_version: 1 } }))?.kind).toBe('note')
  expect(resolveCanvasAuthoringCardPresentation(node({ type: 'generation', contentData: { subtype: 'image', serialization_version: 1 } }))?.kind).toBe('generation')
  expect(resolveCanvasAuthoringCardPresentation(node({ type: 'asset', contentData: { subtype: 'image', serialization_version: 1, url: '/asset.png' } }))).toBeNull()
  expect(resolveCanvasAuthoringCardPresentation(node({ type: 'result', contentData: { subtype: 'image', serialization_version: 1, url: '/result.png' } }))).toBeNull()
  expect(resolveCanvasAuthoringCardPresentation(node({ type: 'future-node', contentData: { serialization_version: 9 } }))).toBeNull()
})

test('authoring card slots remain bounded and derive from one visual size', () => {
  const card = resolveCanvasAuthoringCardPresentation(node())!
  expect(card.slots).toEqual({
    header: { x: 0, y: 0, width: 320, height: 40 },
    body: { x: 0, y: 40, width: 320, height: 80 },
    status: null,
  })

  const generation = resolveCanvasAuthoringCardPresentation(node({
    type: 'generation',
    width: 340,
    height: 220,
    status: 'running',
    contentData: { subtype: 'video', serialization_version: 1 },
  }))!
  expect(generation.slots).toEqual({
    header: { x: 0, y: 0, width: 340, height: 40 },
    body: { x: 0, y: 40, width: 340, height: 58 },
    status: { x: 0, y: 98, width: 340, height: 30 },
  })
})

test('long content, empty states, locks, and lifecycle remain honest and bounded', () => {
  const longEnglish = 'A restrained cinematic direction with consistent wardrobe and practical lighting. '.repeat(8)
  const card = resolveCanvasAuthoringCardPresentation(node({ content: longEnglish, isLocked: true }))!
  expect(card.bodyPreview.length).toBeLessThanOrEqual(144)
  expect(card.bodyPreview.endsWith('…')).toBe(true)
  expect(card.isLocked).toBe(true)
  expect(card.lifecycle).toBeNull()

  const empty = resolveCanvasAuthoringCardPresentation(node({ type: 'note', content: '  ', contentData: { subtype: 'annotation', serialization_version: 1 } }))!
  expect(empty.bodyPreview).toBe('暂无备注')

  const failed = resolveCanvasAuthoringCardPresentation(node({ type: 'generation', status: 'warning', contentData: { subtype: 'video', serialization_version: 1 } }))!
  expect(failed.lifecycle).toEqual({ tone: 'danger', label: '生成失败' })
})

test('recipe cards expose public recipe identity without leaking internal prompt fields', () => {
  const card = resolveCanvasAuthoringCardPresentation(node({
    type: 'generation',
    title: '不应覆盖公开配方名',
    content: 'INTERNAL_PROMPT_MUST_NOT_RENDER',
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      generation_recipe_id: 'character-sheet',
      generation_recipe_version: 2,
      prompt: 'SECOND_INTERNAL_PROMPT',
    },
  }))!
  expect(card.title).toBe('角色设定图')
  expect(card.bodyPreview).toContain('单参考图')
  expect(JSON.stringify(card)).not.toContain('INTERNAL_PROMPT')
})

test('authoring hierarchy preserves one selected editor, media surface, and mutation boundary', async ({ page }) => {
  const state = createResourceMockState()
  const generation = state.documents['canvas-first'].nodes.find((item) => item.id === 'generation-existing')
  if (generation) generation.status = 'running'
  await openResourceWorkspace(page, state)
  const baselinePatches = documentPatches(state).length

  await expect(page.getByRole('img', { name: '图片结果' })).toHaveCount(1)
  await expect(page.locator('.node-status-overlay.is-running')).toHaveCount(0)
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).hover({ position: { x: 420, y: 360 } })
  await page.waitForTimeout(120)
  expect(documentPatches(state)).toHaveLength(baselinePatches)

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: /选择并定位.*镜头脚本/ }).click()
  await expect(page.getByRole('region', { name: '节点内容编辑器' })).toHaveCount(1)
  await expect(page.getByRole('textbox', { name: /编辑.*镜头脚本.*内容/ })).toHaveCount(1)
  const composer = await page.locator('.canvas-node-surface.is-composer').boundingBox()
  expect(composer?.width).toBeGreaterThan(250)
  expect(composer?.height).toBeGreaterThan(68)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'authoring-selected-1440x900.png'), fullPage: true })
})
