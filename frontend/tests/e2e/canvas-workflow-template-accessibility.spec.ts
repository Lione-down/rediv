import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import {
  installWorkflowTemplateFixture,
  openWorkflowTemplateLibrary,
  WORKFLOW_TEMPLATE_URL,
} from './workflow-template-library-fixture'

test('Template Library supports roving tabs, Escape focus return, reduced motion, and scoped axe', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const { opener, dialog } = await openWorkflowTemplateLibrary(page, { width: 920, height: 900 })
  const builtIn = dialog.getByRole('tab', { name: 'Built-in' })
  await builtIn.focus()
  await builtIn.press('ArrowRight')
  await expect(dialog.getByRole('tab', { name: 'My Templates' })).toBeFocused()
  await expect(dialog.getByRole('tab', { name: 'My Templates' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  const accessibility = await new AxeBuilder({ page })
    .include('[data-workflow-template-surface]')
    .analyze()
  expect(
    accessibility.violations.filter((violation) => (
      violation.impact === 'serious' || violation.impact === 'critical'
    )),
  ).toEqual([])

  await expect(dialog).toHaveCSS('transition-duration', '0s')
  await dialog.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('375px keeps Template Library review-only and sends no preflight or instantiate request', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  const fixture = await installWorkflowTemplateFixture(page)
  await page.goto(WORKFLOW_TEMPLATE_URL)
  await page.getByRole('button', { name: '打开模板库' }).click()
  const dialog = page.getByRole('dialog', { name: '工作流模板库' })
  await expect(dialog).toContainText('移动端仅支持审阅')
  await dialog.getByRole('button', { name: /查看模板 商品广告短片/ }).click()
  await expect(dialog).toContainText('4 个节点')
  await expect(dialog).toContainText('3 个步骤')
  await expect(dialog.getByRole('button', { name: '运行预检' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: '添加到画布' })).toHaveCount(0)
  await page.screenshot({
    path: '../output/playwright/t6-022/template-library-375-review.png',
    fullPage: true,
  })
  expect(fixture.requests.filter((request) => request.method === 'POST')).toHaveLength(0)
})
