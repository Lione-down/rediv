import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-026-input-order')

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
}

test('prompt and media reorder persist atomically and drive preview plus provider payload', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  const context = page.getByRole('region', { name: '已连接生成上下文' })

  await context.getByRole('button', { name: '上移提示词 Cinematic direction with deliberately long English content' }).click()
  await expect(context.locator('li').filter({ hasText: '提示词 1' })).toContainText('Cinematic direction')
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const firstPatch = documentPatches(state)[0].body?.connection_upserts as Array<{ metadata?: Record<string, unknown> }>
  expect(firstPatch.filter((connection) => connection.metadata?.input_order)).toHaveLength(2)

  await context.getByRole('button', { name: '上移参考图 人物造型参考' }).click()
  await expect(context.locator('li').filter({ hasText: '参考图 1' })).toContainText('人物造型参考')
  await expect.poll(() => documentPatches(state).length).toBe(2)
  const secondPatch = documentPatches(state)[1].body?.connection_upserts as Array<{ metadata?: Record<string, unknown> }>
  expect(secondPatch.filter((connection) => connection.metadata?.input_order)).toHaveLength(2)

  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  const reloadedContext = page.getByRole('region', { name: '已连接生成上下文' })
  await expect(reloadedContext.locator('li').filter({ hasText: '提示词 1' })).toContainText('Cinematic direction')
  await expect(reloadedContext.locator('li').filter({ hasText: '参考图 1' })).toContainText('人物造型参考')

  await reloadedContext.getByText('检查最终生成请求').click()
  const preview = page.getByRole('region', { name: '最终合并提示词' }).locator('pre')
  await expect(preview).toContainText('【Cinematic direction with deliberately long English content】')
  await expect(page.getByRole('region', { name: '有序媒体请求' }).locator('li').first()).toContainText('人物造型参考')

  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/image-generate').length).toBe(1)
  const request = state.requests.find((item) => item.path === '/api/image-generate')!
  expect(request.body?.image_ids).toEqual(['asset-character', 'asset-reference'])
  expect(String(request.body?.prompt).indexOf('Cinematic direction')).toBeLessThan(String(request.body?.prompt).indexOf('中文剧情约束'))

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'reordered-inputs-1440x900.png'), fullPage: true })
})

test('input reorder participates in exact undo and redo history', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  const context = page.getByRole('region', { name: '已连接生成上下文' })
  await context.getByRole('button', { name: '上移提示词 Cinematic direction with deliberately long English content' }).click()
  await expect(context.locator('li').filter({ hasText: '提示词 1' })).toContainText('Cinematic direction')
  await expect.poll(() => documentPatches(state).length).toBe(1)

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+z')
  await expect(context.locator('li').filter({ hasText: '提示词 1' })).toContainText('中文剧情约束')
  await expect.poll(() => documentPatches(state).length).toBe(2)
  await page.keyboard.press('Control+Shift+z')
  await expect(context.locator('li').filter({ hasText: '提示词 1' })).toContainText('Cinematic direction')
  await expect.poll(() => documentPatches(state).length).toBe(3)
})

test('readonly review exposes order without mutation controls', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectGeneration(page)
  const context = page.getByRole('region', { name: '已连接生成上下文' })
  await expect(context.getByRole('button', { name: /上移|下移/ })).toHaveCount(0)
  await expect(context).toContainText('提示词 1')
  await expect(context).toContainText('参考图 1')
  expect(documentPatches(state)).toHaveLength(0)
})
