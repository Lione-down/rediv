import { expect, test } from '@playwright/test'
import {
  configureProductAd,
  installWorkflowTemplateFixture,
  openWorkflowTemplateLibrary,
  WORKFLOW_TEMPLATE_URL,
} from './workflow-template-library-fixture'

test('Template Library classifies exact lifecycle versions and instantiates only after confirmed preflight', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const fixture = await installWorkflowTemplateFixture(page)
  await page.goto(WORKFLOW_TEMPLATE_URL)

  await page.getByRole('button', { name: '打开模板库' }).click()
  const dialog = page.getByRole('dialog', { name: '工作流模板库' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('tab', { name: 'Built-in' })).toHaveAttribute('aria-selected', 'true')
  await expect(dialog.getByRole('button', { name: /配置模板/ })).toHaveCount(3)
  await expect(dialog).toContainText('v1')
  await expect(dialog).toContainText('4 节点 · 3 步骤')
  await expect(dialog).toContainText('920+ 可编辑')
  await expect(dialog).toContainText('费用级别由预检确认')
  await expect(dialog).toContainText('2026-07-28')
  await expect(dialog).toContainText('text.tool_calling')

  await dialog.getByRole('tab', { name: 'My Templates' }).click()
  await expect(dialog).toContainText('品牌主张短片')
  await expect(dialog).not.toContainText('已停用旧短片')
  await dialog.getByRole('tab', { name: 'Recent' }).click()
  await expect(dialog).toContainText('商品广告短片')
  await dialog.getByRole('tab', { name: 'Deprecated' }).click()
  await expect(dialog).toContainText('已停用旧短片')
  await dialog.getByRole('tab', { name: 'Built-in' }).click()

  await configureProductAd(page)
  await expect(dialog).toContainText('brief → script → images → videos')
  await expect(dialog).toContainText('graph.connections')
  await expect(dialog.getByRole('status')).toContainText('预检通过')
  await expect(dialog).toContainText('Text 1 · Image 6 · Video 6')
  await expect(dialog).toContainText('requires_confirmation')
  await expect(dialog).toContainText('Capability snapshot')
  await expect(dialog).toContainText('v7')
  await expect(dialog.getByRole('button', { name: '添加到画布' })).toBeEnabled()
  await page.screenshot({
    path: '../output/playwright/t6-022/template-library-1440-confirmed.png',
    fullPage: true,
  })

  const preflightRequests = fixture.requests.filter((request) => request.path.endsWith('/preflight'))
  expect(preflightRequests).toHaveLength(2)
  expect(preflightRequests[0].body).toMatchObject({
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    variable_bindings: {
      product_name: '澄海手冲壶',
      shot_count: 6,
      aspect_ratio: '9:16',
    },
    asset_bindings: {
      product_reference: [{
        asset_id: 'asset-template-reference',
        source_revision: fixture.expectedAssetRevision,
      }],
    },
    cost_confirmed: false,
  })
  expect(preflightRequests[1].body?.cost_confirmed).toBe(true)

  await dialog.getByRole('button', { name: '添加到画布' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('[data-runtime-node="instance-node-brief"]')).toBeVisible()
  const instantiateRequests = fixture.requests.filter(
    (request) => request.path.endsWith('/workflow-template-instances'),
  )
  expect(instantiateRequests).toHaveLength(1)
  expect(instantiateRequests[0].body).toMatchObject({
    template_id: 'revid.product-ad',
    template_version: 1,
    base_revision: 0,
    cost_confirmed: true,
    preflight_fingerprint: 'f'.repeat(64),
  })
  expect(String(instantiateRequests[0].body?.client_mutation_id)).toMatch(/^workflow-template-/)
  expect(fixture.state.authenticatedRequests.some((request) => (
    request.includes('/generate') || request.includes('/generation-jobs')
  ))).toBe(false)
})

test('missing required configuration stays actionable and writes no product state', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  const fixture = await installWorkflowTemplateFixture(page)
  await page.goto(WORKFLOW_TEMPLATE_URL)
  await page.getByRole('button', { name: '打开模板库' }).click()
  const dialog = page.getByRole('dialog', { name: '工作流模板库' })
  await dialog.getByRole('button', { name: /配置模板 商品广告短片/ }).click()
  await dialog.getByRole('button', { name: '运行预检' }).click()

  await expect(dialog.getByRole('alert')).toContainText('请填写商品名称')
  await expect(dialog.getByRole('textbox', { name: '商品名称' })).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  await expect(dialog.getByRole('button', { name: '添加到画布' })).toBeDisabled()
  await page.screenshot({
    path: '../output/playwright/t6-022/template-library-1366-validation.png',
    fullPage: true,
  })
  expect(fixture.requests.filter((request) => request.method === 'POST')).toHaveLength(0)
  expect(fixture.state.canvasNodes.some((node) => node.id === 'instance-node-brief')).toBe(false)
})

test('920 workspace keeps every template action reachable', async ({ page }) => {
  const { dialog } = await openWorkflowTemplateLibrary(page, { width: 920, height: 900 })
  await expect(dialog).toBeInViewport()
  await dialog.getByRole('button', { name: /配置模板 商品广告短片/ }).click()
  await expect(dialog.getByRole('textbox', { name: '商品名称' })).toBeInViewport()
  await expect(dialog.getByRole('button', { name: '运行预检' })).toBeInViewport()
  await page.screenshot({
    path: '../output/playwright/t6-022/template-library-920-config.png',
    fullPage: true,
  })
})
