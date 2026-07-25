import { expect, test } from '@playwright/test'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'


test('explicit cinematic script action creates one atomic version-2 shot graph through text generation', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()
  if (await page.locator('.n-drawer:visible').isVisible()) {
    await page.getByRole('button', { name: '关闭节点详情' }).click()
  }
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  const action = palette.getByRole('option', { name: /Cinematic Script：优化并创建分镜/ })
  await expect(action).toContainText('revid.cinema-script.v1')
  await action.click()

  await expect.poll(() => state.requests.filter((item) => item.path.endsWith('/cinematic-preflight')).length).toBe(1)
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/text-generate').length).toBe(1)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const textRequest = state.requests.find((item) => item.path === '/api/text-generate')!.body!
  expect(textRequest.prompt).toContain('contract_version 2 JSON')
  expect(textRequest.cinematic_handoff).toEqual(expect.objectContaining({
    skill_id: 'revid.cinema-script', provider_id: 'agnes', model_id: 'agnes-2.0-flash',
    generation_parameters: { image_ids: [], requested_shot_count: 8, aspect_ratio: '16:9' },
  }))
  const created = state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    (node.content as Record<string, unknown>).shot_schema_version === 2 ||
    (node.content as Record<string, unknown>).source_script_node_id === 'script-source'
  ))
  expect(created.filter((node) => node.node_type === 'script')).toHaveLength(8)
  expect(created.filter((node) => node.node_type === 'generation')).toHaveLength(8)
  const group = created.find((node) => node.node_type === 'group')!
  expect(group.content).toEqual(expect.objectContaining({
    storyboard_kind: 'shot-plan', shot_schema_version: 2,
    source_script_node_id: 'script-source', source_script_text: '黄昏海岸，人物入画。',
    story_structure: '建立、发展与收束', character_consistency: '保持主角身份与服装',
  }))
  expect(state.requests.filter((item) => ['/api/image-generate', '/api/video-generate'].includes(item.path))).toHaveLength(0)

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()
  await page.locator('.canvas-node-surface[data-node-id="script-source"] .canvas-runtime-card__body').dblclick()
  const editor = page.getByRole('textbox', { name: '编辑镜头脚本内容' })
  await editor.fill('脚本已显式修改；旧分镜必须保留并标记 stale。')
  await editor.blur()
  await expect.poll(() => documentPatches(state).length).toBe(2)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 分镜资产组', exact: true }).click()
  await expect(page.getByRole('status', { name: '旧来源版本' })).toContainText('基于旧脚本版本')

  await stage.focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => documentPatches(state).length).toBe(3)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((node) => (
    (node.content as Record<string, unknown>).shot_schema_version === 2
  ))).toBeFalsy()
})
