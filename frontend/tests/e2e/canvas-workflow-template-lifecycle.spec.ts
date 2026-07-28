import { expect, test } from '@playwright/test'
import {
  configureProductAd,
  installWorkflowTemplateFixture,
  WORKFLOW_TEMPLATE_URL,
} from './workflow-template-library-fixture'


test('instance lifecycle previews overrides and explicitly upgrades clones and detaches', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const fixture = await installWorkflowTemplateFixture(page)
  await page.goto(WORKFLOW_TEMPLATE_URL)

  await page.getByRole('button', { name: '打开模板库' }).click()
  const dialog = await configureProductAd(page)
  await dialog.getByRole('button', { name: '添加到画布' }).click()
  await page.locator('[data-runtime-node="instance-node-script"]').click()
  await page.getByRole('button', { name: '调整脚本配置' }).click()

  const lifecycle = page.getByRole('region', { name: '模板版本管理' })
  await expect(lifecycle).toBeVisible()
  await expect(lifecycle).toContainText('当前版本 1')
  await expect(lifecycle).toContainText('可兼容升级到版本 2')
  await expect(lifecycle).toContainText('版本变更摘要')
  await expect(lifecycle).toContainText('新增 optional variable campaign_note')
  await expect(lifecycle).toContainText('本地修改受保护')
  await expect(lifecycle).toContainText('脚本内容')

  expect(fixture.requests.filter((request) => request.path.endsWith('/upgrade'))).toHaveLength(0)
  expect(fixture.requests.filter((request) => request.path.endsWith('/clone'))).toHaveLength(0)
  expect(fixture.requests.filter((request) => request.path.endsWith('/detach'))).toHaveLength(0)
  expect(fixture.requests.filter((request) => request.path.endsWith('/runs'))).toHaveLength(0)

  await lifecycle.getByRole('button', { name: '应用兼容升级' }).click()
  await lifecycle.getByRole('button', { name: '确认升级到版本 2' }).click()
  await expect(lifecycle).toContainText('当前版本 2')
  await expect(lifecycle).toContainText('本地修改受保护')
  await expect(page.locator('[data-runtime-node="instance-node-script"]')).toContainText(
    '本地脚本标题',
  )
  expect(fixture.requests.filter((request) => request.path.endsWith('/upgrade'))).toHaveLength(1)

  await page.reload()
  await page.locator('[data-runtime-node="instance-node-script"]').click()
  await page.getByRole('button', { name: '调整脚本配置' }).click()
  await expect(lifecycle).toContainText('当前版本 2')
  await expect(lifecycle).toContainText('本地修改受保护')
  await expect(page.locator('[data-runtime-node="instance-node-script"]')).toContainText(
    '本地脚本标题',
  )

  await lifecycle.getByRole('button', { name: '复制实例' }).click()
  await lifecycle.getByRole('button', { name: '确认复制实例' }).click()
  await expect(page.locator('[data-runtime-node="clone-node-script"]')).toBeVisible()
  expect(fixture.requests.filter((request) => request.path.endsWith('/clone'))).toHaveLength(1)

  await lifecycle.getByRole('button', { name: '脱离模板' }).click()
  await lifecycle.getByRole('button', { name: '确认脱离模板' }).click()
  await expect(lifecycle).toContainText('已脱离模板管理')
  await expect(page.locator('[data-runtime-node="instance-node-script"]')).toContainText(
    '本地脚本标题',
  )
  expect(fixture.requests.filter((request) => request.path.endsWith('/detach'))).toHaveLength(1)
  expect(fixture.requests.filter((request) => request.path.endsWith('/runs'))).toHaveLength(0)
})


test('mobile review-only lifecycle exposes diff but no mutation actions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installWorkflowTemplateFixture(page)
  await page.goto(WORKFLOW_TEMPLATE_URL)
  await page.getByRole('button', { name: '打开模板库' }).click()
  const dialog = await configureProductAd(page)
  await dialog.getByRole('button', { name: '添加到画布' }).click()
  await page.setViewportSize({ width: 375, height: 812 })
  await page.locator('[data-runtime-node="instance-node-script"]').click()

  const lifecycle = page.getByRole('region', { name: '模板版本管理' })
  await expect(lifecycle).toContainText('当前版本 1')
  await expect(lifecycle).toContainText('仅支持审阅')
  await expect(lifecycle.getByRole('button', { name: '应用兼容升级' })).toHaveCount(0)
  await expect(lifecycle.getByRole('button', { name: '复制实例' })).toHaveCount(0)
  await expect(lifecycle.getByRole('button', { name: '脱离模板' })).toHaveCount(0)
})
