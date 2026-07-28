import { expect, test } from '@playwright/test'
import {
  configureProductAd,
  installWorkflowTemplateFixture,
  WORKFLOW_TEMPLATE_URL,
} from './workflow-template-library-fixture'

test('template workflow runs only after explicit preflight confirmation and recovers after reload', async ({
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

  const controls = page.getByRole('region', { name: '工作流运行' })
  await expect(controls).toBeVisible()
  expect(fixture.requests.filter(
    (request) => request.method === 'POST' && request.path.endsWith('/runs'),
  )).toHaveLength(0)

  await controls.getByRole('checkbox', { name: '确认运行预计费用' }).check()
  await controls.getByRole('button', { name: '检查工作流运行' }).click()
  await expect(controls).toContainText('运行预检通过')
  await expect(controls.getByRole('button', { name: '显式启动工作流' })).toBeEnabled()
  expect(fixture.requests.filter((request) => request.path.endsWith('/runs/preflight'))).toHaveLength(1)
  expect(fixture.requests.filter((request) => request.path.endsWith('/runs'))).toHaveLength(0)

  await controls.getByRole('button', { name: '显式启动工作流' }).click()
  await expect(controls).toContainText('工作流排队中')
  const starts = fixture.requests.filter((request) => request.path.endsWith('/runs'))
  expect(starts).toHaveLength(1)
  expect(starts[0].body).toMatchObject({
    cost_confirmed: true,
    preflight_fingerprint: 'r'.repeat(64),
  })
  expect(String(starts[0].body?.client_run_id)).toMatch(/^workflow-run-/)

  await page.reload()
  await page.locator('[data-runtime-node="instance-node-script"]').click()
  await page.getByRole('button', { name: '调整脚本配置' }).click()
  const recoveredControls = page.getByRole('region', { name: '工作流运行' })
  await expect(recoveredControls).toContainText('工作流排队中')
  expect(fixture.requests.filter((request) => request.path.endsWith('/runs'))).toHaveLength(1)

  await recoveredControls.getByRole('button', { name: '取消工作流' }).click()
  await expect(recoveredControls).toContainText('工作流已取消')
  expect(fixture.requests.filter(
    (request) => request.method === 'POST' && request.path.endsWith('/runs/workflow-run-e2e/cancel'),
  )).toHaveLength(1)
})
