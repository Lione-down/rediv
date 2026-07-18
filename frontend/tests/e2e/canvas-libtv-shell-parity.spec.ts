import { expect, test, type Page } from '@playwright/test'
import { createResourceMockState, openResourceWorkspace } from './canvas-resource-generation-fixture'

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
  await expect(page.getByText('双击画布或选择一个创作起点')).toBeVisible()
  await expect(page.getByRole('button', { name: /^使用.*工作流$/ })).toHaveCount(4)
  await expect(page.getByRole('button', { name: '使用故事脚本工作流' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '使用角色多视图工作流' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '使用首帧视频工作流' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '使用音频驱动视频工作流' })).toBeDisabled()
  await expect(page.locator('.minimap')).toHaveCount(0)

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => document.querySelector<HTMLElement>(selector)!.getBoundingClientRect()
    const identityRect = rect('.identity-cluster')
    const projectRect = rect('.project-name')
    const canvasRect = rect('.canvas-switcher')
    const railRect = rect('.canvas-action-rail')
    const zoomRect = rect('.zoom-controls')
    const stageRect = rect('.workspace-stage')
    const surfaceElement = document.querySelector<HTMLElement>('.canvas-surface')!
    const surfaceRect = surfaceElement.getBoundingClientRect()
    return {
      identity: { height: identityRect.height, left: identityRect.left, top: identityRect.top },
      identityCenterDelta: Math.abs((projectRect.top + projectRect.height / 2) - (canvasRect.top + canvasRect.height / 2)),
      rail: { left: railRect.left, top: railRect.top, width: railRect.width, height: railRect.height },
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
  expect(geometry.rail.left).toBeLessThanOrEqual(24)
  expect(geometry.rail.top).toBeGreaterThanOrEqual(76)
  expect(geometry.rail.width).toBeLessThanOrEqual(48)
  expect(geometry.rail.height).toBeGreaterThanOrEqual(160)
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
  await expect(menu.getByRole('menuitem')).toHaveCount(7)
  for (const name of ['添加文本节点', '添加图片节点', '添加视频节点', '添加音频节点', '添加脚本节点', '上传素材', '从素材库选择']) {
    await expect(menu.getByRole('menuitem', { name })).toBeVisible()
  }

  await menu.getByRole('menuitem', { name: '上传素材' }).click()
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await expect(resources).toBeVisible()
  await expect(resources.getByRole('button', { name: '上传项目资产' })).toBeVisible()
})

test('main creation composer exposes honest model Skill attachment and local Send boundaries', async ({ page }) => {
  const state = await openEmptyWorkspace(page, { width: 1440, height: 900 })
  const composer = page.getByRole('form', { name: 'Canvas 主创作输入' })
  await expect(composer).toBeVisible()
  await expect(composer.getByRole('button', { name: '添加附件' })).toBeVisible()
  await expect(composer.getByRole('combobox', { name: '模型' })).toBeDisabled()
  await expect(composer.getByRole('combobox', { name: '生成模式' })).toBeVisible()
  const skill = composer.getByRole('button', { name: '选择 Agent / Skill' })
  await skill.click()
  await expect(skill).toHaveAttribute('aria-pressed', 'true')
  await expect(composer).toContainText('revid.canvas-context · 节点创建后预检')

  await composer.getByRole('textbox', { name: '主创作提示词' }).fill('黄昏海岸，人物从远景走入近景。')
  await composer.getByRole('combobox', { name: '生成模式' }).selectOption('script')
  await composer.getByRole('button', { name: '将提示词写入本地工作流' }).click()
  await expect.poll(() => state.documents['canvas-first'].nodes.length).toBe(1)
  expect(state.documents['canvas-first'].nodes[0].content.text).toBe('黄昏海岸，人物从远景走入近景。')
  expect(state.generationCount).toBe(0)

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+Z')
  await expect.poll(() => state.documents['canvas-first'].nodes.length).toBe(0)
})
