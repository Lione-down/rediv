import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const EVIDENCE_DIRECTORY = resolve(process.cwd(), '..', 'output', 'playwright', 't6-004')

async function createAssetGroup(page: Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  await page.getByRole('dialog', { name: '专业操作' }).getByRole('option', { name: /从脚本创建分镜计划/ }).click()
}

test('script-created asset group continues after one failure, reports counts, and ungroup keeps card-local retry', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  state.quotas.image = 2
  state.generationFailureCalls = [2]
  await openResourceWorkspace(page, state)
  await createAssetGroup(page)

  await expect.poll(() => state.shotSchemaCount).toBe(1)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => (
    (node.content as Record<string, unknown>).storyboard_kind === 'shot-plan'
  ))).toBe(true)
  const group = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    (node.content as Record<string, unknown>).storyboard_kind === 'shot-plan'
  ))!
  const childIds = [...((group.content as Record<string, unknown>).ordered_child_ids as string[])]
  expect(group.content).toMatchObject({ storyboard_kind: 'shot-plan', ordered_child_ids: childIds })
  expect(group.content).toEqual(expect.objectContaining({ asset_group_generation: { concurrency: 1 } }))
  expect((group.content as Record<string, unknown>).title).toBe('分镜资产组')

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 分镜资产组', exact: true }).click()
  await page.getByRole('button', { name: '全部生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(2)
  await expect(page.getByRole('status', { name: '资产组生成结果' })).toContainText('完成 1 · 失败 1 · 跳过 0')
  for (const childId of childIds) {
    expect(state.requests.filter((item) => item.body?.canvas_node_id === childId)).toHaveLength(1)
  }
  const accessibility = await new AxeBuilder({ page }).include('.canvas-workspace').analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({ path: resolve(EVIDENCE_DIRECTORY, 'asset-group-mixed-outcome-1440x900.png'), fullPage: true })

  const failedChild = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    childIds.includes(String(node.id)) && (node.content as Record<string, unknown>).generation_status === 'failed'
  ))!
  expect(failedChild).toBeTruthy()
  const positions = new Map(childIds.map((id) => {
    const node = state.documents[FIRST_CANVAS_ID].nodes.find((candidate) => candidate.id === id)!
    return [id, [node.position_x, node.position_y]]
  }))

  await page.getByRole('button', { name: '取消组合' }).click()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === group.id)).toBe(false)
  for (const childId of childIds) {
    const child = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === childId)!
    expect(child.parent_node_id).toBeNull()
    expect([child.position_x, child.position_y]).toEqual(positions.get(childId))
  }

  state.generationFailureCalls = []
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${(failedChild.content as Record<string, unknown>).title}`, exact: true }).click()
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(3)
  expect(state.requests.filter((item) => item.body?.canvas_node_id === failedChild.id)).toHaveLength(2)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => childIds.includes(String(node.id)))).toHaveLength(2)
})
