import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { documentPatches, createResourceMockState, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-090-agent-skill-preflight')

async function selectScript(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()
}

test('Agent/Skill Canvas context preflight is accessible, scoped, mock-only, and mutation-free', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const patches = documentPatches(state).length
  const quotas = { ...state.quotas }
  await selectScript(page)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('combobox', { name: '搜索专业操作' }).fill('agent context')
  await palette.getByRole('option', { name: /Agent Canvas context preflight/ }).click()
  const panel = page.getByRole('dialog', { name: 'Agent/Skill Canvas context preflight' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: '关闭 Agent/Skill context 预检' })).toBeFocused()
  await expect(panel.getByRole('status')).toContainText('Mock-only')
  await expect(panel).toContainText('script-source')
  const accessibility = await new AxeBuilder({ page }).include('.agent-skill-preflight-panel').analyze()
  expect(accessibility.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([])
  await mkdir(evidenceDirectory, { recursive: true })
  await panel.screenshot({ path: resolve(evidenceDirectory, 'agent-skill-preflight-1440x900.png') })
  expect(documentPatches(state)).toHaveLength(patches)
  expect(state.generationCount).toBe(0)
  expect(state.quotas).toEqual(quotas)
  expect(state.requests.filter((request) => request.path.includes('/agent-skills')).map((request) => [request.method, request.path, request.body])).toEqual([
    ['GET', '/api/projects/project-resources/canvases/canvas-first/agent-skills', undefined],
    ['POST', '/api/projects/project-resources/canvases/canvas-first/agent-skills/preflight', {
      skill_id: 'revid.canvas-context', skill_version: 1, selected_node_ids: ['script-source'],
    }],
  ])
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
})

test('375px review-only Canvas cannot open Agent/Skill context preflight', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectScript(page)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Agent/Skill Canvas context preflight' })).toHaveCount(0)
  expect(state.requests.filter((request) => request.path.includes('/agent-skills'))).toEqual([])
})
