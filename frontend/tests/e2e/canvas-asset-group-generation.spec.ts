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
const T6_005_EVIDENCE_DIRECTORY = resolve(process.cwd(), '..', 'output', 'playwright', 't6-005-yuque-workbench')

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
  const groupDetails = page.getByRole('region', { name: '分镜资产组详情' })
  if (!await groupDetails.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: '打开节点详情' }).click()
  }
  await expect(groupDetails).toBeVisible()
  await expect(groupDetails.getByRole('button', { name: '新增角色' })).toBeVisible()
  await expect(groupDetails.getByRole('button', { name: '新增场景' })).toBeVisible()
  await expect(groupDetails.getByRole('button', { name: '新增道具' })).toBeVisible()
  await expect(groupDetails.getByRole('region', { name: '有序镜头资产' }).getByRole('button')).toHaveCount(2)

  await groupDetails.getByRole('button', { name: '新增角色' }).click()
  await groupDetails.getByRole('textbox', { name: '角色名称' }).fill('主角')
  await groupDetails.getByRole('button', { name: '确认新增资产' }).click()
  const roleEditor = page.getByRole('region', { name: '编辑角色' })
  await expect(roleEditor).toBeVisible()
  await expect(roleEditor.getByRole('textbox', { name: '角色名称' })).toHaveValue('主角')
  await roleEditor.getByRole('textbox', { name: '角色名称' }).fill('女主角')
  await roleEditor.getByRole('textbox', { name: '角色描述' }).fill('雨夜站台上的女主角，保持统一服装与侧逆光。')
  await roleEditor.getByRole('button', { name: '保存角色' }).click()
  await expect(roleEditor.getByRole('status')).toContainText('角色已保存到画布')
  const editorAccessibility = await new AxeBuilder({ page }).include('.asset-editor').analyze()
  expect(editorAccessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await mkdir(T6_005_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({ path: resolve(T6_005_EVIDENCE_DIRECTORY, 'asset-role-editor-1440x900.png'), fullPage: true })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => {
    const content = node.content as Record<string, unknown>
    return Array.isArray(content.shot_characters) && content.shot_characters.includes('女主角') &&
      content.text === '雨夜站台上的女主角，保持统一服装与侧逆光。'
  })).toBe(true)

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 分镜资产组', exact: true }).click()
  const editedRoleCard = groupDetails.getByRole('button', { name: '编辑角色 女主角' })
  await expect(editedRoleCard).toBeVisible()
  await page.screenshot({ path: resolve(T6_005_EVIDENCE_DIRECTORY, 'asset-group-detail-1440x900.png'), fullPage: true })
  await editedRoleCard.focus()
  await page.keyboard.press('Enter')
  await expect(roleEditor).toBeVisible()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 分镜资产组', exact: true }).click()
  const removeRoleButton = groupDetails.getByRole('button', { name: '移除角色 女主角' })
  await removeRoleButton.focus()
  await page.keyboard.press('Enter')
  await expect(groupDetails.getByRole('button', { name: '编辑角色 女主角' })).toHaveCount(0)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.every((node) => {
    const content = node.content as Record<string, unknown>
    return !Array.isArray(content.shot_characters) || !content.shot_characters.includes('女主角')
  })).toBe(true)
  expect(state.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(0)
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await page.locator(`.canvas-node-surface[data-node-id="${group.id}"]`).getByLabel('移动 分镜资产组').click()
  const groupToolbar = page.getByRole('toolbar', { name: /1 个已选节点的操作/ })
  await expect(groupToolbar).toBeVisible()
  await groupToolbar.getByRole('button', { name: '全部生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(2)
  await expect(page.getByRole('status', { name: '资产组生成结果' })).toContainText('完成 1 · 失败 1 · 跳过 0')
  for (const childId of childIds) {
    expect(state.requests.filter((item) => item.body?.canvas_node_id === childId)).toHaveLength(1)
  }
  const accessibility = await new AxeBuilder({ page }).include('.canvas-workspace').analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({ path: resolve(EVIDENCE_DIRECTORY, 'asset-group-mixed-outcome-1440x900.png'), fullPage: true })

  const failedNodeId = String(state.tasks.find((task) => (
    task.status === 'failed' && childIds.includes(String(task.canvas_node_id))
  ))?.canvas_node_id ?? '')
  const failedChild = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === failedNodeId)!
  expect(failedChild).toBeTruthy()
  await expect.poll(() => (
    (failedChild.content as Record<string, unknown>).active_generation_job_id
  )).toBeTruthy()
  const positions = new Map(childIds.map((id) => {
    const node = state.documents[FIRST_CANVAS_ID].nodes.find((candidate) => candidate.id === id)!
    return [id, [node.position_x, node.position_y]]
  }))

  await groupToolbar.getByRole('button', { name: '取消组合' }).click()
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
