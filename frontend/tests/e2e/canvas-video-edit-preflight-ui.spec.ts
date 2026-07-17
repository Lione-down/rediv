import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, FIRST_CANVAS_ID, openResourceWorkspace, PROJECT_ID } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-088-video-edit-preflight')

async function selectVideo(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 动态镜头结果', exact: true }).click()
}

function prepareProjectOwnedVideo(state: ReturnType<typeof createMultiScenarioState>) {
  const node = state.documents[FIRST_CANVAS_ID].nodes.find((candidate) => candidate.id === 'result-video')!
  node.content = { ...node.content, asset_id: 'asset-video-edit', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID }
  state.assets.push({
    id: 'asset-video-edit', user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: 'generation-compose', type: 'video', url: 'https://media.revid.test/scenario.mp4', content_text: '动态镜头结果',
    source: 'generation', source_model: 'mock-video-v1', source_task_id: 'task-video-edit', status: 'active', created_at: '', updated_at: '',
  })
}

test('video edit preflight is accessible and preview-only without Canvas/provider/quota mutation', async ({ page }) => {
  const state = createMultiScenarioState()
  prepareProjectOwnedVideo(state)
  await openResourceWorkspace(page, state)
  const patches = documentPatches(state).length
  const quotas = { ...state.quotas }
  await selectVideo(page)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('combobox', { name: '搜索专业操作' }).fill('video trim')
  await palette.getByRole('option', { name: /视频裁剪与拼接预检/ }).click()
  const panel = page.getByRole('dialog', { name: '视频编辑预检' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: '关闭视频编辑预检' })).toBeFocused()
  await expect(panel).toContainText('Video Edit v1')
  await expect(panel.getByRole('status')).toContainText('导出已阻止')
  await expect(panel.locator('video[aria-label="视频编辑源预览"]')).toBeVisible()
  const accessibility = await new AxeBuilder({ page }).include('.video-edit-panel').analyze()
  expect(accessibility.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([])
  await mkdir(evidenceDirectory, { recursive: true })
  await panel.screenshot({ path: resolve(evidenceDirectory, 'video-edit-preflight-1440x900.png') })
  expect(documentPatches(state)).toHaveLength(patches)
  expect(state.generationCount).toBe(0)
  expect(state.quotas).toEqual(quotas)
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
})

test('375px review-only Canvas cannot open the video edit preflight', async ({ page }) => {
  const state = createMultiScenarioState()
  prepareProjectOwnedVideo(state)
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectVideo(page)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: '视频编辑预检' })).toHaveCount(0)
})
