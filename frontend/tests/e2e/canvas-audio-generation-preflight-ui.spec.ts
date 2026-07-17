import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createResourceMockState, documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-089-audio-generation-preflight')

async function selectScript(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()
}

test('audio preflight is accessible and production fail-closed without Canvas/provider/quota mutation', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const patches = documentPatches(state).length
  const quotas = { ...state.quotas }
  await selectScript(page)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('combobox', { name: '搜索专业操作' }).fill('audio preflight')
  await palette.getByRole('option', { name: /音频生成与驱动视频预检/ }).click()
  const panel = page.getByRole('dialog', { name: '音频生成与驱动视频预检' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: '关闭音频预检' })).toBeFocused()
  await expect(panel.getByRole('status')).toContainText('音频执行已阻止')
  const accessibility = await new AxeBuilder({ page }).include('.audio-generation-panel').analyze()
  expect(accessibility.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([])
  await mkdir(evidenceDirectory, { recursive: true })
  await panel.screenshot({ path: resolve(evidenceDirectory, 'audio-generation-preflight-1440x900.png') })
  expect(documentPatches(state)).toHaveLength(patches)
  expect(state.generationCount).toBe(0)
  expect(state.quotas).toEqual(quotas)
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
})

test('375px review-only Canvas cannot open audio generation preflight', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectScript(page)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: '音频生成与驱动视频预检' })).toHaveCount(0)
})
