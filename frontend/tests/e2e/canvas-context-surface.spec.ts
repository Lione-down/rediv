import { expect, test } from '@playwright/test'
import {
  createResourceMockState,
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
