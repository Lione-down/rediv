import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-087-workflow-orchestration')

async function openWorkflowBatch(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成', exact: true }).click()
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('combobox', { name: '搜索专业操作' }).fill('batch preflight')
  await palette.getByRole('option', { name: /批处理预检/ }).click()
  const panel = page.getByRole('dialog', { name: '批处理预检' })
  await expect(panel).toBeVisible()
  return panel
}

test('workflow batch preflight is visible, accessible, and mock-only with no Canvas or provider mutation', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const patchCount = documentPatches(state).length
  const originalQuotas = { ...state.quotas }
  const panel = await openWorkflowBatch(page)

  await expect(panel).toContainText('Workflow Template v1')
  await expect(panel).toContainText('预估单位')
  await expect(panel.getByRole('button', { name: '开始 mock 批处理' })).toBeEnabled()
  const accessibility = await new AxeBuilder({ page }).include('.workflow-batch-panel').analyze()
  expect(accessibility.violations.filter((violation) => (
    violation.impact === 'serious' || violation.impact === 'critical'
  ))).toEqual([])
  await mkdir(evidenceDirectory, { recursive: true })
  await panel.screenshot({ path: resolve(evidenceDirectory, 'workflow-preflight-1440x900.png') })
  expect(documentPatches(state)).toHaveLength(patchCount)
  expect(state.generationCount).toBe(0)
  expect(state.quotas).toEqual(originalQuotas)

  await panel.getByRole('button', { name: '开始 mock 批处理' }).click()
  await expect(panel).toContainText('Mock run：running')
  await panel.getByRole('button', { name: '取消 mock 批处理' }).click()
  await expect(panel).toContainText('Mock run：cancelled')
  expect(documentPatches(state)).toHaveLength(patchCount)
  expect(state.generationCount).toBe(0)
  expect(state.quotas).toEqual(originalQuotas)
})
