import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  getCanvasGridStyle,
} from '../../src/components/canvas/canvas-grid-presentation'
import {
  WORKFLOW_STARTERS,
  createWorkflowStarterCommand,
} from '../../src/components/canvas/canvas-workflow-starters'
import {
  createVisualState,
  installMockApi,
} from './authenticated-workflow-fixture'

async function captureEvidence(page: import('@playwright/test').Page, name: string) {
  const directory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-008-empty-grid')
  await mkdir(directory, { recursive: true })
  const path = resolve(directory, `${name}.png`)
  await page.screenshot({ path })
  return path
}

test('grid presentation tracks the 24-unit world grid across pan and accepted zoom', () => {
  expect(getCanvasGridStyle({ zoom: 0.1, x: -25.2, y: 7.1 })).toEqual({
    '--canvas-grid-size': '2.4px',
    '--canvas-grid-position-x': '0px',
    '--canvas-grid-position-y': '1.1px',
  })
  expect(getCanvasGridStyle({ zoom: 1, x: -13, y: 49 })).toEqual({
    '--canvas-grid-size': '24px',
    '--canvas-grid-position-x': '23px',
    '--canvas-grid-position-y': '13px',
  })
  expect(getCanvasGridStyle({ zoom: 8, x: -385, y: 390 })).toEqual({
    '--canvas-grid-size': '192px',
    '--canvas-grid-position-x': '95px',
    '--canvas-grid-position-y': '102px',
  })
})

test('workflow starters reuse canonical registry nodes and one insert-graph command', () => {
  expect(WORKFLOW_STARTERS.map((starter) => starter.id)).toEqual([
    'script', 'character', 'first-frame', 'audio-video',
  ])
  const command = createWorkflowStarterCommand('character', { x: 120, y: -80 })!
  expect(command.type).toBe('insert-graph')
  expect(command.nodes).toHaveLength(2)
  expect(command.nodes.map((node) => node.type)).toEqual(['script', 'generation'])
  expect(command.nodes[0]).toEqual(expect.objectContaining({
    x: -240,
    y: -180,
    contentData: { subtype: 'prompt', serialization_version: 1 },
  }))
  expect(command.nodes[1]).toEqual(expect.objectContaining({
    x: 120,
    y: -190,
    contentData: { subtype: 'image', serialization_version: 1 },
  }))
  expect(command.connections).toEqual([expect.objectContaining({
    from: command.nodes[0].id,
    to: command.nodes[1].id,
    sourcePort: 'out',
    targetPort: 'prompt',
  })])
  const firstFrame = createWorkflowStarterCommand('first-frame', { x: 0, y: 0 })!
  expect(firstFrame.nodes.map((node) => [node.type, node.contentData.subtype])).toEqual([
    ['script', 'prompt'], ['generation', 'image'], ['generation', 'video'],
  ])
  expect(firstFrame.connections).toHaveLength(2)
  expect(firstFrame.connections.every((connection) => connection.targetPort === 'prompt')).toBe(true)
  expect(createWorkflowStarterCommand('audio-video', { x: 0, y: 0 })).toBeNull()
})

test('editable empty Canvas offers starters and an explicit zero-mutation blank path', async ({ page }, testInfo) => {
  const state = createVisualState()
  state.canvasNodes = []
  state.canvasConnections = []
  await installMockApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'mock-session-token'))
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/app/projects/project-e2e/canvases/canvas-first')

  const guide = page.getByRole('region', { name: '空白画布起点' })
  await expect(guide).toBeVisible()
  await expect(guide.getByRole('button', { name: /^使用.+工作流$/ })).toHaveCount(4)
  const surface = page.locator('.canvas-surface')
  await expect.poll(() => surface.evaluate((element) => (
    getComputedStyle(element).getPropertyValue('--canvas-grid-size').trim()
  ))).toBe('24px')
  const zoomInput = page.getByLabel('缩放百分比')
  await zoomInput.fill('10')
  await zoomInput.press('Enter')
  await expect.poll(() => surface.evaluate((element) => (
    getComputedStyle(element).getPropertyValue('--canvas-grid-size').trim()
  ))).toBe('2.4px')
  await zoomInput.fill('800')
  await zoomInput.press('Enter')
  await expect.poll(() => surface.evaluate((element) => (
    getComputedStyle(element).getPropertyValue('--canvas-grid-size').trim()
  ))).toBe('192px')
  expect(await surface.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain('radial-gradient')
  await zoomInput.fill('100')
  await zoomInput.press('Enter')
  const desktopEvidence = await captureEvidence(page, 'desktop-empty-guide')
  await testInfo.attach('desktop-empty-guide', { path: desktopEvidence, contentType: 'image/png' })
  const documentWritesBefore = state.authenticatedRequests.filter((request) => request.endsWith('/document')).length
  const keepBlankButton = guide.getByRole('button', { name: '保持空白画布' })
  await keepBlankButton.focus()
  await page.keyboard.down('Space')
  await expect(surface).not.toHaveClass(/cursor-grab/)
  await page.keyboard.up('Space')
  await expect(guide).toHaveCount(0)
  expect(state.canvasNodes).toEqual([])
  expect(state.canvasConnections).toEqual([])
  expect(state.authenticatedRequests.filter((request) => request.endsWith('/document'))).toHaveLength(documentWritesBefore)

  await page.reload()
  await expect(guide).toBeVisible()
  const starterMutationsBefore = state.authenticatedRequests.filter((request) => (
    request.startsWith('PATCH ') && request.endsWith('/document')
  )).length
  const starterButton = guide.getByRole('button', { name: '使用角色多视图工作流' })
  await starterButton.focus()
  await page.keyboard.down('Space')
  await expect(surface).not.toHaveClass(/cursor-grab/)
  await page.keyboard.up('Space')
  await expect.poll(() => state.canvasNodes.map((node) => String(node.node_type)).sort()).toEqual([
    'generation', 'script',
  ])
  await expect.poll(() => state.canvasConnections).toHaveLength(1)
  await expect.poll(() => state.authenticatedRequests.filter((request) => (
    request.startsWith('PATCH ') && request.endsWith('/document')
  )).length).toBe(starterMutationsBefore + 1)
  await expect(guide).toHaveCount(0)
})

test('mobile review empty Canvas does not expose editing starters', async ({ page }, testInfo) => {
  const state = createVisualState()
  state.canvasNodes = []
  state.canvasConnections = []
  await installMockApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'mock-session-token'))
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/app/projects/project-e2e/canvases/canvas-first')

  const guide = page.getByRole('region', { name: '空白画布起点' })
  await expect(guide).toContainText('当前没有可审阅的节点。')
  await expect(guide.getByRole('button')).toHaveCount(0)
  const mobileEvidence = await captureEvidence(page, 'mobile-empty-review')
  await testInfo.attach('mobile-empty-review', { path: mobileEvidence, contentType: 'image/png' })
})
