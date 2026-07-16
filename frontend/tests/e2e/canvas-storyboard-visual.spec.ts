import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import {
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '../output/playwright/t5-081-storyboard')

interface VisualGeometry {
  bodyClientWidth: number
  bodyScrollWidth: number
  rootClientWidth: number
  rootScrollWidth: number
  viewportHeight: number
  viewportWidth: number
}

function installStoryboardGroup(state: ResourceMockState, childCount: number) {
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'asset-landscape')!
  const groupId = `storyboard-group-${childCount}`
  const childIds = Array.from({ length: childCount }, (_, index) => `storyboard-image-${childCount}-${index + 1}`)
  const columns = Math.min(5, childCount)
  const children = childIds.map((id, index) => ({
    ...structuredClone(source),
    id,
    content: {
      ...(structuredClone(source.content) as Record<string, unknown>),
      title: `分镜画面 ${String(index + 1).padStart(2, '0')}`,
    },
    position_x: 140 + (index % columns) * 340,
    position_y: 160 + Math.floor(index / columns) * 220,
    parent_node_id: groupId,
  }))
  const group = {
    ...structuredClone(source),
    id: groupId,
    node_type: 'group',
    content: {
      title: `${childCount} 镜头分镜组`,
      subtype: 'storyboard',
      serialization_version: 1,
      storyboard_schema_version: 1,
      aspect_ratio: '16:9',
      columns,
      show_numbers: true,
      ordered_child_ids: childIds,
    },
    position_x: 100,
    position_y: 100,
    width: columns * 340 + 40,
    height: Math.ceil(childCount / columns) * 220 + 100,
    parent_node_id: null,
  }
  state.documents[FIRST_CANVAS_ID] = { nodes: [group, ...children], connections: [] }
}

async function openStoryboard(page: Page, state: ResourceMockState, viewport: { width: number; height: number }) {
  await openResourceWorkspace(page, state, viewport)
  await page.getByRole('tab', { name: '故事板' }).click()
  await expect(page.getByRole('region', { name: '故事板审阅' })).toBeVisible()
}

async function captureEvidence(page: Page, name: string) {
  mkdirSync(evidenceDirectory, { recursive: true })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)
  const geometry = await page.evaluate<VisualGeometry>(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    rootClientWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
  }))
  expect(geometry.rootScrollWidth).toBeLessThanOrEqual(geometry.rootClientWidth)
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.bodyClientWidth)
  await page.screenshot({
    path: resolve(evidenceDirectory, `${name}.png`),
    animations: 'disabled',
  })
  writeFileSync(
    resolve(evidenceDirectory, `${name}.json`),
    `${JSON.stringify(geometry, null, 2)}\n`,
    'utf8',
  )
}

async function expectStoryboardComponentStyles(page: Page) {
  const laneHeaderStyle = await page.locator('.storyboard-lane__header').first().evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { display: style.display, position: style.position }
  })
  const itemStyle = await page.locator('.storyboard-item').first().evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { display: style.display, height: style.height, width: style.width }
  })
  const trackStyle = await page.locator('.storyboard-lane__track').first().evaluate((element) => {
    const style = window.getComputedStyle(element)
    return { display: style.display, overflowX: style.overflowX }
  })

  expect(laneHeaderStyle).toEqual({ display: 'flex', position: 'static' })
  expect(itemStyle).toEqual({ display: 'grid', height: '174px', width: '220px' })
  expect(trackStyle).toEqual({ display: 'flex', overflowX: 'auto' })
}

test('records the empty Storyboard state at 1440x900', async ({ page }) => {
  const state = createMultiScenarioState()
  state.documents[FIRST_CANVAS_ID] = { nodes: [], connections: [] }
  await openStoryboard(page, state, { width: 1440, height: 900 })

  await expect(page.locator('.storyboard-lane__empty')).toHaveCount(3)
  await expect(page.getByText('当前画布没有可审阅的图片镜头。')).toBeVisible()
  await captureEvidence(page, '1440x900-empty')
})

test('records mixed pending, failed, and unavailable Storyboard states at 1366x768', async ({ page }) => {
  const state = createMultiScenarioState()
  await openStoryboard(page, state, { width: 1366, height: 768 })

  await expect(page.getByRole('button', { name: '审阅 合并四路上下文生成' })).toContainText('生成中')
  await expect(page.getByRole('button', { name: '审阅 损坏媒体结果' })).toContainText('失败')
  await expect(page.getByRole('button', { name: '审阅 上游返回空结果' })).toContainText('不可用')
  await expectStoryboardComponentStyles(page)
  const accessibility = await new AxeBuilder({ page })
    .include('.canvas-storyboard')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(accessibility.violations.filter((violation) => (
    violation.impact === 'serious' || violation.impact === 'critical'
  ))).toEqual([])
  await captureEvidence(page, '1366x768-mixed-statuses')
})

test('records a two-image Workflow group and an invalid mixed selection at 1366x768', async ({ page }) => {
  const state = createMultiScenarioState()
  installStoryboardGroup(state, 2)
  const document = state.documents[FIRST_CANVAS_ID]
  const textNode = {
    ...structuredClone(document.nodes[1]),
    id: 'invalid-text-selection',
    node_type: 'note',
    content: { title: '不可成组的文字节点', subtype: 'annotation', serialization_version: 1, text: '仅用于 invalid selection 视觉证据。' },
    position_x: 900,
    position_y: 160,
    parent_node_id: null,
  }
  document.nodes.push(textNode)
  await openResourceWorkspace(page, state, { width: 1366, height: 768 })

  await expect(page.locator('.storyboard-frame-number')).toHaveText(['1', '2'])
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 不可成组的文字节点', exact: true }).click()
  await expect(page.getByRole('button', { name: '创建分镜组' })).toHaveCount(0)
  await captureEvidence(page, '1366x768-two-image-invalid-selection')
})

test('records a selected pending item in the 920x900 Context drawer', async ({ page }) => {
  const state = createMultiScenarioState()
  await openStoryboard(page, state, { width: 920, height: 900 })
  await page.getByRole('button', { name: '审阅 合并四路上下文生成' }).click()

  const drawer = page.getByRole('complementary', { name: '节点详情 合并四路上下文生成' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('button', { name: /开始.*生成|重新生成|继续此节点|整理完整生成链路/ })).toHaveCount(0)
  await captureEvidence(page, '920x900-pending-context-drawer')
})

test('records the 25-image Storyboard limit at 1440x900', async ({ page }) => {
  const state = createMultiScenarioState()
  installStoryboardGroup(state, 25)
  await openStoryboard(page, state, { width: 1440, height: 900 })

  await expect(page.getByRole('region', { name: '图片镜头，共 25 项' })).toBeVisible()
  await expect(page.locator('.storyboard-item__group')).toHaveCount(25)
  await captureEvidence(page, '1440x900-25-image-group')
})

test('records the 375x812 review-only Storyboard boundary', async ({ page }) => {
  const state = createMultiScenarioState()
  installStoryboardGroup(state, 2)
  await openStoryboard(page, state, { width: 375, height: 812 })

  await expect(page.getByText('浏览审阅模式')).toBeVisible()
  await expect(page.locator('.storyboard-item__order-actions')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /创建分镜组|前移分镜|后移分镜|开始.*生成|重新生成/ })).toHaveCount(0)
  await captureEvidence(page, '375x812-review-only-group')
})
