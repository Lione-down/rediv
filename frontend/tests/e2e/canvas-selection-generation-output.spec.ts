import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveSelectionGenerationIntent } from '../../src/modules/canvas/selection-generation'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-030-selection-output')
const now = '2026-07-15T10:00:00Z'

function sourceNode(id: string, type: 'script' | 'asset' | 'result', options: Record<string, unknown> = {}): CanvasNode {
  const isScript = type === 'script'
  return {
    id, type, title: String(options.title ?? id), x: Number(options.x ?? 0), y: Number(options.y ?? 0),
    width: 320, height: isScript ? 200 : 240,
    content: isScript ? String(options.text ?? `${id} prompt`) : undefined,
    contentData: isScript
      ? { subtype: 'script', serialization_version: 1 }
      : { subtype: 'image', serialization_version: 1, asset_id: options.assetId },
    parentNodeId: null,
  }
}

function persistedNode(node: CanvasNode) {
  return {
    id: node.id, project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID, node_type: node.type,
    content: { title: node.title, text: node.content, ...node.contentData },
    position_x: node.x, position_y: node.y, width: node.width, height: node.height,
    z_index: 0, parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
    created_at: now, updated_at: now,
  }
}

function generationPosts(state: ResourceMockState, mediaType: 'image' | 'video') {
  return state.requests.filter((item) => item.method === 'POST' && item.path === `/api/${mediaType}-generate`)
}

function resultNodes(state: ResourceMockState, taskId: string) {
  return state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === taskId
  ))
}

async function composeSelection(page: Page, mediaType: 'image' | 'video') {
  const surface = page.locator('.canvas-surface')
  await surface.click({ position: { x: 180, y: 200 } })
  await surface.click({ position: { x: 560, y: 180 }, modifiers: ['Control'] })
  await surface.click({ position: { x: 180, y: 490 }, modifiers: ['Control'] })
  await surface.click({ position: { x: 560, y: 460 }, modifiers: ['Control'] })
  const toolbar = page.locator('.selection-toolbar')
  await expect(toolbar).toBeVisible()
  await toolbar.locator('.compose-menu > button').click()
  const menu = toolbar.locator('.compose-panel')
  await expect(menu.locator('p')).toHaveText(/2.*2/)
  await expect(menu.getByRole('menuitem').nth(1).locator('small')).not.toBeEmpty()
  await menu.getByRole('menuitem').nth(mediaType === 'image' ? 0 : 1).click()
  await expect(page.locator('.generation-editor')).toBeVisible()
}

function configureSelectionState(state: ResourceMockState) {
  const sources = [
    sourceNode('script-scene', 'script', { title: 'Scene', text: 'Golden coast at dusk', x: 80, y: 100 }),
    sourceNode('asset-scene', 'asset', { title: 'Coast reference', assetId: 'asset-reference', x: 460, y: 80 }),
    sourceNode('script-camera', 'script', { title: 'Camera', text: 'Slow lateral tracking shot', x: 80, y: 390 }),
    sourceNode('asset-character', 'asset', { title: 'Character reference', assetId: 'asset-character', x: 460, y: 360 }),
  ]
  state.documents[FIRST_CANVAS_ID] = { nodes: sources.map(persistedNode), connections: [] }
  state.assets.push({ ...state.assets[0], id: 'asset-character', url: 'https://media.revid.test/character.png' })
  return sources
}

async function prepareAndCompose(page: Page, state: ResourceMockState, mediaType: 'image' | 'video') {
  configureSelectionState(state)
  await openResourceWorkspace(page, state)
  await composeSelection(page, mediaType)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const generationNode = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.node_type === 'generation')!
  await page.locator('.generation-editor .generate-button').click()
  await expect.poll(() => generationPosts(state, mediaType).length).toBe(1)
  return generationNode
}

test('selection intent reports exact counts and video semantics', () => {
  const scripts = [sourceNode('script-a', 'script'), sourceNode('script-b', 'script')]
  const images = [
    sourceNode('image-a', 'asset', { assetId: 'asset-a' }),
    sourceNode('image-b', 'asset', { assetId: 'asset-b' }),
  ]
  const results = [
    sourceNode('result-a', 'result', { assetId: 'result-asset-a' }),
    sourceNode('result-b', 'result', { assetId: 'result-asset-b' }),
  ]
  expect(resolveSelectionGenerationIntent(scripts)).toMatchObject({
    textCount: 2, imageCount: 0, assetImageCount: 0, resultCount: 0, videoMode: 'text-to-video',
    inputs: [
      { kind: 'text', nodeId: 'script-a', order: 1 },
      { kind: 'text', nodeId: 'script-b', order: 2 },
    ],
  })
  expect(resolveSelectionGenerationIntent([...scripts, images[0]])).toMatchObject({
    textCount: 2, imageCount: 1, assetImageCount: 1, resultCount: 0, videoMode: 'image-to-video',
  })
  expect(resolveSelectionGenerationIntent([...scripts, ...images])).toMatchObject({
    textCount: 2, imageCount: 2, assetImageCount: 2, resultCount: 0, videoMode: 'keyframes',
  })
  expect(resolveSelectionGenerationIntent([scripts[0], images[0], ...results])).toMatchObject({
    textCount: 1, imageCount: 3, assetImageCount: 1, resultCount: 2, videoMode: 'keyframes',
    inputs: [
      { kind: 'text', nodeId: 'script-a', order: 1 },
      { kind: 'reference', nodeId: 'image-a', order: 1 },
      { kind: 'reference', nodeId: 'result-a', order: 2 },
      { kind: 'reference', nodeId: 'result-b', order: 3 },
    ],
  })
})

test('composed image request materializes one durable linked result', async ({ page }) => {
  const state = createResourceMockState()
  const initialQuota = state.quotas.image
  const generationNode = await prepareAndCompose(page, state, 'image')
  const request = generationPosts(state, 'image')[0].body!
  expect(request).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: generationNode.id,
    prompt: '【Scene】\nGolden coast at dusk\n\n【Camera】\nSlow lateral tracking shot',
    image_ids: ['asset-reference', 'asset-character'],
    aspect_ratio: '4:3',
  })
  await expect.poll(() => resultNodes(state, 'task-success').length).toBe(1)
  const result = resultNodes(state, 'task-success')[0]
  expect(result.content).toEqual(expect.objectContaining({ subtype: 'image', asset_id: 'asset-success', url: 'https://media.revid.test/success.png' }))
  expect(state.documents[FIRST_CANVAS_ID].connections).toContainEqual(expect.objectContaining({
    source_node_id: generationNode.id, target_node_id: result.id, source_port: 'out', target_port: 'in',
  }))
  expect(state.quotas.image).toBe(initialQuota - 1)
  await page.reload()
  await expect.poll(() => resultNodes(state, 'task-success').length).toBe(1)
})

test('composed video request yields a playable MP4 with lineage and history', async ({ page }) => {
  const state = createResourceMockState()
  const initialQuota = state.quotas.video
  const generationNode = await prepareAndCompose(page, state, 'video')
  expect(generationPosts(state, 'video')[0].body).toEqual(expect.objectContaining({
    canvas_node_id: generationNode.id,
    image_ids: ['asset-reference', 'asset-character'],
  }))
  await expect.poll(() => resultNodes(state, 'task-success').length).toBe(1)
  const result = resultNodes(state, 'task-success')[0]
  expect(result.content).toEqual(expect.objectContaining({ subtype: 'video', asset_id: 'asset-success', url: 'https://media.revid.test/success.mp4' }))
  expect(state.tasks.find((item) => item.id === 'task-success')).toEqual(expect.objectContaining({
    canvas_node_id: generationNode.id, media_type: 'video', model: 'mock-video-v1', result_asset_id: 'asset-success',
  }))
  expect(state.quotas.video).toBe(initialQuota - 1)

  await page.locator('.run-history summary').click()
  await expect(page.locator('.run-history')).toContainText('mock-video-v1')
  await page.locator('.run-history__result').click()
  await expect(page.locator('.result-lineage-detail')).toContainText('task-success')
  await page.locator('.view-controls > button').first().click()
  const video = page.locator('.asset-card video[src$="success.mp4"]')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'composed-video-result-1440x900.png'), fullPage: true })
  await page.reload()
  await expect.poll(() => resultNodes(state, 'task-success').length).toBe(1)
})

test('failed composed generation binds the dynamic node without charge, result, or retry', async ({ page }) => {
  const state = createResourceMockState()
  state.generationOutcome = 'failure'
  const initialQuotas = { ...state.quotas }
  const initialRevision = state.quotaRevision
  const generationNode = await prepareAndCompose(page, state, 'video')
  await expect(page.locator('.generation-editor [role="alert"]')).toContainText('mock provider unavailable')
  await page.waitForTimeout(700)
  expect(generationPosts(state, 'video')).toHaveLength(1)
  expect(state.tasks.find((item) => item.id === 'task-failure')).toEqual(expect.objectContaining({
    canvas_node_id: generationNode.id, media_type: 'video', status: 'failed', result_asset_id: null,
  }))
  expect(resultNodes(state, 'task-failure')).toHaveLength(0)
  expect(state.quotas).toEqual(initialQuotas)
  expect(state.quotaRevision).toBe(initialRevision)
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === generationNode.id)?.content as Record<string, unknown>
  ).generation_status).toBe('failed')
  await page.reload()
  expect((state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === generationNode.id)?.content as Record<string, unknown>).generation_task_id).toBe('task-failure')
})
