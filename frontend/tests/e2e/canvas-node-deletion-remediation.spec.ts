import { expect, test, type Page, type Request } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createVisualState,
  installMockApi,
  type MockState,
} from './authenticated-workflow-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'
const DOCUMENT_PATH = '/api/projects/project-e2e/canvases/canvas-first/document'
const EVIDENCE_DIRECTORY = resolve(
  process.cwd(),
  '..',
  'output',
  'playwright',
  't6-013-seventh-candidate',
)
const EIGHTH_EVIDENCE_DIRECTORY = resolve(
  process.cwd(),
  '..',
  'output',
  'playwright',
  't6-013-eighth-candidate',
)

async function retainEvidence(name: string, value: unknown) {
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true })
  await writeFile(
    resolve(EVIDENCE_DIRECTORY, `${name}.json`),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  )
}

async function openReplacementCanvas(page: Page, state: MockState) {
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await expect(runtime).toHaveAttribute('data-runtime-state', 'ready')
  return runtime
}

function collectDocumentPatches(page: Page) {
  const patches: Array<Record<string, unknown>> = []
  page.on('request', (request: Request) => {
    if (request.method() !== 'PATCH' || new URL(request.url()).pathname !== DOCUMENT_PATH) return
    patches.push(request.postDataJSON() as Record<string, unknown>)
  })
  return patches
}

test('selected replacement node Delete uses the typed graph mutation and remains undoable', async ({
  page,
}) => {
  const state = createVisualState()
  const patches = collectDocumentPatches(page)
  const runtime = await openReplacementCanvas(page, state)
  const imageNode = runtime.locator('[data-runtime-node="node-image"]')

  await imageNode.locator('[data-node-body]').click()
  await expect(imageNode).toHaveAttribute('data-selected', 'true')
  await page.keyboard.press('Delete')

  await expect.poll(() => state.canvasNodes.map((node) => node.id)).toEqual(['node-result'])
  await expect.poll(() => patches).toHaveLength(1)
  expect(patches[0]).toEqual(expect.objectContaining({
    node_deletes: ['node-image'],
    connection_deletes: ['connection-e2e'],
  }))
  await retainEvidence('keyboard-delete-document-mutation', patches[0])
  await page.screenshot({
    path: resolve(EVIDENCE_DIRECTORY, 'keyboard-delete-after-1440x900.png'),
  })

  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect.poll(() => state.canvasNodes.map((node) => String(node.id)).sort()).toEqual([
    'node-image',
    'node-result',
  ])
  await expect.poll(() => state.canvasConnections.map((connection) => connection.id)).toEqual([
    'connection-e2e',
  ])
})

test('selected replacement node right-click exposes 删除 and uses the same graph mutation', async ({
  page,
}) => {
  const state = createVisualState()
  const patches = collectDocumentPatches(page)
  const runtime = await openReplacementCanvas(page, state)
  const imageNode = runtime.locator('[data-runtime-node="node-image"]')

  await imageNode.locator('[data-node-body]').click()
  await expect(imageNode).toHaveAttribute('data-selected', 'true')
  await imageNode.click({ button: 'right' })
  await page.screenshot({
    path: resolve(EVIDENCE_DIRECTORY, 'context-menu-delete-visible-1440x900.png'),
  })
  await runtime.getByRole('menuitem', { name: '删除' }).click()

  await expect.poll(() => state.canvasNodes.map((node) => node.id)).toEqual(['node-result'])
  await expect.poll(() => patches).toHaveLength(1)
  expect(patches[0]).toEqual(expect.objectContaining({
    node_deletes: ['node-image'],
    connection_deletes: ['connection-e2e'],
  }))
  await retainEvidence('context-menu-delete-document-mutation', patches[0])
})

test('replacement deletion does not intercept an active text input', async ({ page }) => {
  const state = createVisualState()
  state.canvasNodes.push({
    id: 'node-text',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'script',
    content: {
      title: '旁白',
      subtype: 'prompt',
      serialization_version: 1,
      text: '保留输入焦点',
    },
    position_x: 840,
    position_y: 140,
    width: 300,
    height: 160,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  const patches = collectDocumentPatches(page)
  const runtime = await openReplacementCanvas(page, state)
  const textNode = runtime.locator('[data-runtime-node="node-text"]')

  await textNode.locator('[data-node-body]').dblclick()
  const editor = textNode.locator('[data-direct-editor]')
  await expect(editor).toBeVisible()
  await editor.focus()
  await page.keyboard.press('Delete')
  await page.waitForTimeout(650)

  expect(state.canvasNodes.map((node) => node.id)).toEqual([
    'node-image',
    'node-result',
    'node-text',
  ])
  expect(patches).toEqual([])
})

test('replacement context menu closes after an outside pointer interaction', async ({ page }) => {
  const state = createVisualState()
  const runtime = await openReplacementCanvas(page, state)
  const imageNode = runtime.locator('[data-runtime-node="node-image"]')

  await imageNode.click({ button: 'right' })
  const menu = runtime.getByRole('menu')
  await expect(menu).toBeVisible()
  await mkdir(EIGHTH_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(EIGHTH_EVIDENCE_DIRECTORY, 'context-menu-before-outside-click-1440x900.png'),
  })
  await page.mouse.click(20, 20)

  await expect(
    menu,
    'T6-013 RED [context-menu-outside-dismissal-missing]',
  ).toHaveCount(0)
})

test('right-clicking an unselected node targets and deletes that exact node', async ({ page }) => {
  const state = createVisualState()
  state.canvasNodes.push({
    id: 'node-context-target',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'script',
    content: {
      title: '右键目标',
      subtype: 'prompt',
      serialization_version: 1,
      text: '应删除这个未预选节点',
    },
    position_x: 840,
    position_y: 140,
    width: 300,
    height: 160,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  const patches = collectDocumentPatches(page)
  const runtime = await openReplacementCanvas(page, state)
  const previousSelection = runtime.locator('[data-runtime-node="node-image"]')
  const contextTarget = runtime.locator('[data-runtime-node="node-context-target"]')

  await previousSelection.locator('[data-node-body]').click()
  await expect(previousSelection).toHaveAttribute('data-selected', 'true')
  await contextTarget.click({ button: 'right' })

  await expect(
    contextTarget,
    'T6-013 RED [right-click-node-does-not-become-context-target]',
  ).toHaveAttribute('data-selected', 'true')
  await expect(previousSelection).not.toHaveAttribute('data-selected', 'true')
  await mkdir(EIGHTH_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(EIGHTH_EVIDENCE_DIRECTORY, 'unselected-node-right-click-target-1440x900.png'),
  })
  await runtime.getByRole('menuitem', { name: '删除' }).click()

  await expect.poll(() => state.canvasNodes.map((node) => node.id).sort()).toEqual([
    'node-image',
    'node-result',
  ])
  await expect.poll(() => patches).toHaveLength(1)
  expect(patches[0]).toEqual(expect.objectContaining({
    node_deletes: ['node-context-target'],
    connection_deletes: [],
  }))
})
