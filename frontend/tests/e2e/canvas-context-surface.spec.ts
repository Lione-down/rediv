import { expect, test } from '@playwright/test'
import {
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

test('Canvas keeps one contextual surface active and restores the revision opener', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const workspace = page.locator('.canvas-workspace')
  const resourceTrigger = page.getByRole('button', { name: '打开项目资源' })
  const revisionTrigger = page.getByRole('button', { name: '打开修订历史', exact: true })

  await resourceTrigger.click()
  await expect(workspace).toHaveAttribute('data-context-surface', 'resources')
  await expect(page.locator('.resource-panel-shell')).toBeVisible()

  await revisionTrigger.click()
  await expect(workspace).toHaveAttribute('data-context-surface', 'revision')
  await expect(page.locator('.resource-panel-shell')).toHaveCount(0)
  const revisionPanel = page.getByRole('dialog', { name: '修订历史与恢复' })
  await expect(revisionPanel).toBeVisible()

  await revisionPanel.getByRole('button', { name: '关闭修订历史' }).click()
  await expect(workspace).toHaveAttribute('data-context-surface', 'none')
  await expect(revisionTrigger).toBeFocused()
})

test('stage context interrupts resources without mutating or clearing selection and restores its opener', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const baselinePatches = documentPatches(state).length
  const graphTrigger = page.getByRole('button', { name: '打开画布内容与快捷键' })

  await graphTrigger.click()
  await page.getByRole('button', { name: /选择并定位.*镜头脚本/ }).click()
  await expect(page.getByRole('button', { name: '定位到 镜头脚本' })).toHaveClass(/selected/)
  await page.getByRole('button', { name: '打开项目资源' }).click()
  await expect(page.locator('.canvas-workspace')).toHaveAttribute('data-context-surface', 'resources')

  await graphTrigger.click()
  await expect(page.locator('.canvas-workspace')).toHaveAttribute('data-context-surface', 'stage')
  await expect(page.locator('.resource-panel-shell')).toHaveCount(0)
  const graphPanel = page.getByRole('dialog', { name: '画布内容与快捷键' })
  await expect(graphPanel).toBeFocused()
  await expect(graphPanel.getByRole('button', { name: /选择并定位.*镜头脚本/ })).toHaveAttribute('aria-pressed', 'true')

  await graphPanel.getByRole('button', { name: '关闭画布内容与快捷键' }).click()
  await expect(page.locator('.canvas-workspace')).toHaveAttribute('data-context-surface', 'none')
  await expect(graphTrigger).toBeFocused()
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})
