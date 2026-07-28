import { expect, test } from '@playwright/test'
import {
  configureProductAd,
  installWorkflowTemplateFixture,
  WORKFLOW_TEMPLATE_URL,
} from './workflow-template-library-fixture'

test('instantiated workflow and Storyboard project the same stable selected node', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installWorkflowTemplateFixture(page)
  await page.goto(WORKFLOW_TEMPLATE_URL)
  await page.getByRole('button', { name: '打开模板库' }).click()
  const dialog = await configureProductAd(page)
  await dialog.getByRole('button', { name: '添加到画布' }).click()

  const workflowNode = page.locator('[data-runtime-node="instance-node-brief"]')
  await expect(workflowNode).toBeVisible()
  await expect(workflowNode).toHaveAttribute('data-selected', 'true')
  await page.getByRole('button', { name: '故事板' }).click()
  await expect(page.locator('[data-storyboard-node-id="instance-node-brief"]')).toBeVisible()
  await page.getByRole('button', { name: '工作流' }).click()
  await expect(workflowNode).toBeVisible()
  await expect(workflowNode).toHaveAttribute('data-selected', 'true')
})
