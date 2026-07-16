import { expect, test, type Page } from '@playwright/test'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import {
  FIRST_CANVAS_ID,
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

async function selectNodeFromGraphAccess(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

function viewportPatches(state: ResourceMockState) {
  return state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith(`/canvases/${FIRST_CANVAS_ID}`)
  ))
}

function generationPosts(state: ResourceMockState) {
  return state.requests.filter((request) => (
    request.method === 'POST' && ['/api/image-generate', '/api/video-generate'].includes(request.path)
  ))
}

test('switches one Canvas document into truthful Storyboard review lanes without persistence writes', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNodeFromGraphAccess(page, '合并四路上下文生成')
  await expect(page.getByRole('complementary', { name: '节点详情 合并四路上下文生成' })).toBeVisible()
  await page.waitForTimeout(500)

  const urlBefore = page.url()
  const documentBefore = JSON.stringify(state.documents[FIRST_CANVAS_ID])
  const documentPatchCount = documentPatches(state).length
  const viewportPatchCount = viewportPatches(state).length

  await page.getByRole('tab', { name: '故事板' }).click()

  await expect(page.getByRole('tab', { name: '故事板' })).toHaveAttribute('aria-selected', 'true')
  const storyboard = page.getByRole('region', { name: '故事板审阅' })
  await expect(storyboard).toBeVisible()
  await expect(storyboard.getByRole('region', { name: '文本镜头，共 2 项' })).toBeVisible()
  await expect(storyboard.getByRole('region', { name: '图片镜头，共 8 项' })).toBeVisible()
  await expect(storyboard.getByRole('region', { name: '视频镜头，共 1 项' })).toBeVisible()
  await expect(storyboard.getByRole('button', { name: '审阅 合并四路上下文生成' })).toContainText('生成中')
  await expect(storyboard.getByRole('button', { name: '审阅 上游返回空结果' })).toContainText('不可用')
  await expect(storyboard.getByRole('button', { name: '审阅 损坏媒体结果' })).toContainText('失败')
  await expect(page.locator('.canvas-layer')).not.toBeVisible()
  await expect(page.locator('.workspace-stage')).toHaveCount(1)
  await expect(page.getByRole('complementary', { name: '节点详情 合并四路上下文生成' })).toBeVisible()

  await page.waitForTimeout(700)
  expect(page.url()).toBe(urlBefore)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(documentBefore)
  expect(documentPatches(state)).toHaveLength(documentPatchCount)
  expect(viewportPatches(state)).toHaveLength(viewportPatchCount)
  expect(generationPosts(state)).toHaveLength(0)

  await page.getByRole('tab', { name: '工作流' }).click()
  await expect(page.locator('.canvas-layer')).toBeVisible()
  await expect(page.getByRole('complementary', { name: '节点详情 合并四路上下文生成' })).toBeVisible()
})

test('keeps safe detail editing but removes generation, retry, recipe, and branch execution in Storyboard', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await selectNodeFromGraphAccess(page, '封面生成')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toBeVisible()

  await page.getByRole('tab', { name: '故事板' }).click()
  const panel = page.getByRole('complementary', { name: '节点详情 封面生成' })
  await expect(panel.getByLabel('生成提示词')).toBeEditable()
  await expect(panel.getByRole('button', { name: '开始图片生成' })).toHaveCount(0)

  await panel.getByLabel('生成提示词').fill('故事板审阅中的安全文本修订')
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(0)
  expect(generationPosts(state)).toHaveLength(0)

  await page.getByRole('button', { name: '审阅 历史图片生成结果' }).click()
  const resultPanel = page.getByRole('complementary', { name: '节点详情 历史图片生成结果' })
  await expect(resultPanel.getByText('以此结果继续')).toHaveCount(0)
  await expect(resultPanel.getByRole('region', { name: '视觉资产快捷生成' })).toHaveCount(0)
  expect(generationPosts(state)).toHaveLength(0)

  await page.getByRole('tab', { name: '工作流' }).click()
  await selectNodeFromGraphAccess(page, '封面生成')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toBeVisible()
})

test('supports predictable keyboard review at the 375px read-only boundary without writes', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  const documentPatchCount = documentPatches(state).length
  const viewportPatchCount = viewportPatches(state).length

  const workflowTab = page.getByRole('tab', { name: '工作流' })
  await workflowTab.focus()
  await workflowTab.press('ArrowRight')
  await expect(page.getByRole('tab', { name: '故事板' })).toBeFocused()
  await expect(page.getByRole('tab', { name: '故事板' })).toHaveAttribute('aria-selected', 'true')

  const firstItem = page.getByRole('button', { name: '审阅 中文剧情约束' })
  const secondItem = page.getByRole('button', { name: '审阅 Cinematic direction with deliberately long English content' })
  await firstItem.focus()
  await firstItem.press('ArrowRight')
  await expect(secondItem).toBeFocused()
  await secondItem.press('Enter')
  await expect(page.getByRole('complementary', { name: '节点详情 Cinematic direction with deliberately long English content' })).toBeVisible()
  await expect(page.getByText('浏览审阅模式')).toBeVisible()
  await expect(page.getByRole('button', { name: /开始.*生成|重新生成|继续此节点/ })).toHaveCount(0)

  await page.waitForTimeout(700)
  expect(documentPatches(state)).toHaveLength(documentPatchCount)
  expect(viewportPatches(state)).toHaveLength(viewportPatchCount)
  expect(generationPosts(state)).toHaveLength(0)
})

test('hands compact Storyboard selection to the existing 920px context drawer without workflow actions', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  const documentPatchCount = documentPatches(state).length
  const viewportPatchCount = viewportPatches(state).length

  await page.getByRole('tab', { name: '故事板' }).click()
  await page.getByRole('button', { name: '审阅 封面生成' }).click()

  const drawer = page.getByRole('complementary', { name: '节点详情 封面生成' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByLabel('生成提示词')).toBeEditable()
  await expect(drawer.getByRole('button', { name: /开始.*生成|重新生成|继续此节点|整理完整生成链路/ })).toHaveCount(0)
  await expect(drawer.getByRole('button', { name: /上移提示词|下移提示词|上移参考图|下移参考图/ })).toHaveCount(0)

  await page.waitForTimeout(700)
  expect(documentPatches(state)).toHaveLength(documentPatchCount)
  expect(viewportPatches(state)).toHaveLength(viewportPatchCount)
  expect(generationPosts(state)).toHaveLength(0)
})
