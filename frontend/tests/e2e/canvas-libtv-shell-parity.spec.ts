import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { createResourceMockState, documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'

async function openEmptyWorkspace(page: Page, viewport: { width: number; height: number }) {
  const state = createResourceMockState()
  state.documents['canvas-first'].nodes = []
  state.documents['canvas-first'].connections = []
  await openResourceWorkspace(page, state, viewport)
  return state
}

test('empty desktop Canvas uses compact fixed chrome and progressive navigation', async ({ page }) => {
  await openEmptyWorkspace(page, { width: 1440, height: 900 })

  const identity = page.getByRole('region', { name: '项目与画布导航' })
  const actionRail = page.getByRole('toolbar', { name: '画布主要操作' })
  const zoom = page.getByRole('group', { name: '缩放' })
  await expect(identity).toBeVisible()
  await expect(actionRail).toBeVisible()
  await expect(zoom).toBeVisible()
  await expect(page.getByText('双击画布', { exact: true })).toBeVisible()
  await expect(page.getByText('自由生成节点', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^使用.*工作流$/ })).toHaveCount(4)
  await expect(page.getByRole('button', { name: '使用故事脚本生成工作流' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '使用角色三视图工作流' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '使用首帧图生视频工作流' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '使用音频生视频工作流' })).toBeDisabled()
  await expect(page.locator('.minimap')).toHaveCount(0)

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector<HTMLElement>(selector)!.getBoundingClientRect()
    const identityRect = rect('.identity-cluster')
    const projectRect = rect('.project-name')
    const canvasRect = rect('.canvas-switcher')
    const railRect = rect('.canvas-action-rail')
    const zoomRect = rect('.zoom-controls')
    const composerRect = rect('.creation-composer')
    const starters = Array.from(document.querySelectorAll<HTMLElement>('.workflow-starters > button')).map((button) => button.getBoundingClientRect())
    const startersLeft = Math.min(...starters.map((starter) => starter.left))
    const startersRight = Math.max(...starters.map((starter) => starter.right))
    const stageRect = rect('.workspace-stage')
    const surfaceElement = document.querySelector<HTMLElement>('.canvas-surface')!
    const surfaceRect = surfaceElement.getBoundingClientRect()
    return {
      identity: { height: identityRect.height, left: identityRect.left, top: identityRect.top },
      identityCenterDelta: Math.abs((projectRect.top + projectRect.height / 2) - (canvasRect.top + canvasRect.height / 2)),
      rail: { left: railRect.left, top: railRect.top, width: railRect.width, height: railRect.height, bottom: innerHeight - railRect.bottom, centerDelta: Math.abs(railRect.left + railRect.width / 2 - innerWidth / 2) },
      composer: { top: composerRect.top, bottom: composerRect.bottom },
      starters: { top: starters[0].top, bottom: starters[0].bottom, width: starters[0].width, height: starters[0].height, topSpread: Math.max(...starters.map((starter) => starter.top)) - Math.min(...starters.map((starter) => starter.top)), centerDelta: Math.abs((startersLeft + startersRight) / 2 - innerWidth / 2) },
      zoom: { left: zoomRect.left, bottom: innerHeight - zoomRect.bottom },
      surface: {
        heightDelta: Math.abs(stageRect.height - surfaceRect.height),
        widthDelta: Math.abs(stageRect.width - surfaceRect.width),
        gridSize: getComputedStyle(surfaceElement).backgroundSize.split(',')[0].trim(),
      },
    }
  })
  expect(geometry.identity.height).toBeLessThanOrEqual(52)
  expect(geometry.identity.left).toBeLessThanOrEqual(20)
  expect(geometry.identity.top).toBeLessThanOrEqual(20)
  expect(geometry.identityCenterDelta).toBeLessThanOrEqual(4)
  expect(geometry.rail.bottom).toBeLessThanOrEqual(24)
  expect(geometry.rail.centerDelta).toBeLessThanOrEqual(2)
  expect(geometry.rail.height).toBeLessThanOrEqual(48)
  expect(geometry.starters.top).toBeGreaterThanOrEqual(451)
  expect(geometry.starters.top).toBeLessThanOrEqual(455)
  expect(geometry.starters.width).toBe(214)
  expect(geometry.starters.height).toBe(56)
  expect(geometry.starters.topSpread).toBeLessThanOrEqual(2)
  expect(geometry.starters.centerDelta).toBeLessThanOrEqual(2)
  expect(geometry.composer.top).toBeGreaterThanOrEqual(geometry.starters.bottom + 100)
  expect(geometry.composer.bottom).toBeLessThanOrEqual(geometry.rail.top - 12)
  expect(geometry.zoom.left).toBeLessThanOrEqual(24)
  expect(geometry.zoom.bottom).toBeLessThanOrEqual(24)
  expect(geometry.surface.widthDelta).toBeLessThanOrEqual(1)
  expect(geometry.surface.heightDelta).toBeLessThanOrEqual(1)
  expect(geometry.surface.gridSize).toBe('24px 24px')

  await expect(actionRail.getByRole('button', { name: '添加节点' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '打开项目资源' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '打开专业创作指令' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '从画布操作打开修订历史' })).toBeVisible()
  await expect(actionRail.getByRole('button', { name: '打开画布内容与快捷键' })).toBeVisible()
  await expect(zoom.getByRole('button', { name: '画布协作暂不可用' })).toBeDisabled()
  await expect(zoom.getByRole('button', { name: '共享链接暂不可用' })).toBeDisabled()

  const revisionTrigger = actionRail.getByRole('button', { name: '从画布操作打开修订历史' })
  await revisionTrigger.click()
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toBeVisible()
  await page.getByRole('button', { name: '关闭修订历史' }).click()
  await expect(revisionTrigger).toBeFocused()

  await actionRail.getByLabel('打开视图选项').click()
  await page.getByRole('button', { name: '显示小地图' }).click()
  await expect(page.locator('.minimap')).toBeVisible()
})

test('compact editing preserves the rail and mobile remains review-only', async ({ page }) => {
  await openEmptyWorkspace(page, { width: 920, height: 900 })
  await expect(page.getByRole('toolbar', { name: '画布主要操作' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^使用.*工作流$/ })).toHaveCount(4)
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toHaveCSS('max-height', '52px')

  await openEmptyWorkspace(page, { width: 375, height: 812 })
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toHaveAttribute('aria-description', '只读审阅模式')
  await expect(page.getByRole('toolbar', { name: '画布主要操作' })).toBeVisible()
  await expect(page.getByRole('button', { name: '添加节点' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '打开专业创作指令' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^使用.*工作流$/ })).toHaveCount(0)
  await expect(page.getByText('这个画布还是空白的')).toBeVisible()
})

test('add menu exposes the observable media catalog and safe resource entries', async ({ page }) => {
  await openEmptyWorkspace(page, { width: 1440, height: 900 })
  await page.getByRole('button', { name: '添加节点' }).click()

  const menu = page.getByRole('menu', { name: '添加节点' })
  await expect(menu.getByRole('menuitem')).toHaveCount(9)
  for (const name of ['添加文本节点', '添加图片节点', '添加视频节点', '视频合成', '添加音频节点', '添加脚本节点', '从素材库选择', '上传素材', '从生成历史选择']) {
    await expect(menu.getByRole('menuitem', { name })).toBeVisible()
  }

  await menu.getByRole('menuitem', { name: '上传素材' }).click()
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await expect(resources).toBeVisible()
  await expect(resources.getByRole('button', { name: '上传项目资产' })).toBeVisible()
})

test('main creation composer stages attachments without mutating or dismissing the Canvas', async ({ page }) => {
  const state = await openEmptyWorkspace(page, { width: 1440, height: 900 })
  const composer = page.getByRole('form', { name: 'Canvas 主创作输入' })
  await expect(composer).toBeVisible()

  await composer.getByRole('button', { name: '添加附件' }).click()
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await expect(resources).toContainText('选择要附加到创作输入的素材')
  await resources.getByRole('button', { name: '将资产 海边参考图附加到创作输入' }).click()

  await expect(composer).toBeVisible()
  await expect(composer.getByRole('button', { name: '移除附件 海边参考图' })).toBeVisible()
  expect(state.documents['canvas-first'].nodes).toHaveLength(0)
  expect(documentPatches(state)).toHaveLength(0)
  const accessibility = await new AxeBuilder({ page }).include('.creation-composer').analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
})

test('main creation composer Send runs script authoring and keeps exact input recoverable', async ({ page }) => {
  const state = await openEmptyWorkspace(page, { width: 1440, height: 900 })
  const composer = page.getByRole('form', { name: 'Canvas 主创作输入' })
  await expect(composer.getByRole('combobox', { name: '模型' })).toHaveValue('agnes-2.0-flash')
  await expect(composer.getByRole('combobox', { name: '生成模式' })).toBeVisible()
  await composer.getByRole('button', { name: '添加附件' }).click()
  await page.getByRole('complementary', { name: '项目资源' })
    .getByRole('button', { name: '将资产 海边参考图附加到创作输入' }).click()

  await composer.getByRole('textbox', { name: '主创作提示词' }).fill('黄昏海岸，人物从远景走入近景。')
  await composer.getByRole('combobox', { name: '生成模式' }).selectOption('script')
  await composer.getByRole('button', { name: '使用 Agnes 2.0 Flash 生成脚本' }).click()

  await expect.poll(() => state.generationCount).toBe(1)
  await expect.poll(() => state.documents['canvas-first'].nodes.length).toBe(1)
  await expect.poll(() => (
    state.documents['canvas-first'].nodes[0]?.content as Record<string, unknown>
  ).source_task_id).toBe('task-authoring-1')
  const result = state.documents['canvas-first'].nodes.find((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-authoring-1'
  ))
  expect(result).toBeTruthy()
  expect((result!.content as Record<string, unknown>).text).toBe(
    '雨夜车站。摄影师穿过人群，寻找装着失踪胶卷的银色手提箱。',
  )
  expect((result!.content as Record<string, unknown>).reference_asset_ids).toEqual(['asset-reference'])
  expect(state.requests.find((item) => item.path === '/api/text-generate')?.body).toMatchObject({
    intent: 'script_draft', brief: '黄昏海岸，人物从远景走入近景。', canvas_node_id: result!.id,
    reference_asset_ids: ['asset-reference'],
  })

  await expect(page.getByRole('region', { name: 'AI 脚本写作' })).toContainText('当前脚本已替换，可撤销')
})

test('main composer retains the prompt and recovers capability loading without reload', async ({ page }) => {
  const state = createResourceMockState()
  state.documents['canvas-first'].nodes = []
  state.documents['canvas-first'].connections = []
  state.capabilitiesOutcome = 'failure'
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const composer = page.getByRole('form', { name: 'Canvas 主创作输入' })
  const prompt = composer.getByRole('textbox', { name: '主创作提示词' })
  await prompt.fill('保留这段创意，不要因为模型加载失败而清空。')
  await expect(composer).toContainText('模型服务暂不可用')
  await expect(composer.getByRole('button', { name: '重试加载模型' })).toBeVisible()
  await expect(composer.getByRole('button', { name: '生成脚本' })).toBeDisabled()

  state.capabilitiesOutcome = 'success'
  await composer.getByRole('button', { name: '重试加载模型' }).click()
  await expect(composer.getByRole('combobox', { name: '模型' })).toHaveValue('agnes-2.0-flash')
  await expect(prompt).toHaveValue('保留这段创意，不要因为模型加载失败而清空。')
  await expect(composer.getByRole('button', { name: '使用 Agnes 2.0 Flash 生成脚本' })).toBeEnabled()

  expect(state.requests.filter((item) => item.path === '/api/generation-capabilities')).toHaveLength(2)
})

test('main composer keeps a failed script brief ready for bounded manual retry', async ({ page }) => {
  const state = createResourceMockState()
  state.documents['canvas-first'].nodes = []
  state.documents['canvas-first'].connections = []
  state.generationOutcome = 'failure'
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const composer = page.getByRole('form', { name: 'Canvas 主创作输入' })
  await composer.getByRole('textbox', { name: '主创作提示词' }).fill('雨夜车站，摄影师寻找失踪胶卷。')
  await composer.getByRole('button', { name: '使用 Agnes 2.0 Flash 生成脚本' }).click()

  const authoring = page.getByRole('region', { name: 'AI 脚本写作' })
  await expect(authoring).toContainText('Agnes 当前不可用')
  await expect(authoring.getByRole('textbox', { name: '创意 Brief' })).toHaveValue('雨夜车站，摄影师寻找失踪胶卷。')
  expect(state.requests.filter((item) => item.path === '/api/text-generate')).toHaveLength(1)
  expect(state.documents['canvas-first'].nodes).toHaveLength(1)

  await page.waitForTimeout(50)
  expect(state.requests.filter((item) => item.path === '/api/text-generate')).toHaveLength(1)
  state.generationOutcome = 'success'
  await authoring.getByRole('button', { name: '生成新脚本' }).click()
  await expect.poll(() => state.generationCount).toBe(1)
  await expect(authoring).toContainText('当前脚本已替换，可撤销')
  expect(state.documents['canvas-first'].nodes).toHaveLength(1)
})
