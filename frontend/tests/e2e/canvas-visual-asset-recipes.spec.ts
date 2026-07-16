import { expect, test } from '@playwright/test'
import { requestCanvasGeneration } from '../../src/modules/canvas/generation-service'
import { createVisualAssetRecipeBranchCommand } from '../../src/modules/canvas/resource-commands'
import { resolveVisualAssetRecipe } from '../../src/modules/canvas/visual-asset-recipes'
import type { QuotaBalance } from '../../src/types/auth'
import type { CanvasNode } from '../../src/types/canvas'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState, documentPatches, FIRST_CANVAS_ID, openResourceWorkspace, PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-065-visual-asset-recipes')

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

function canonicalImageResult(): CanvasNode {
  return {
    id: 'result-reference', type: 'result', title: '角色参考', x: 120, y: 160, width: 320, height: 240,
    contentData: {
      subtype: 'image', serialization_version: 1, asset_id: 'asset-reference',
      source_task_id: 'task-origin', url: 'https://media.revid.test/reference.png',
    },
  }
}

function boxesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  return first.x < second.x + second.width && first.x + first.width > second.x &&
    first.y < second.y + second.height && first.y + first.height > second.y
}

function viewportPatches(state: ResourceMockState) {
  return state.requests.filter((item) => (
    item.method === 'PATCH' && item.path.endsWith(`/canvases/${FIRST_CANVAS_ID}/viewport`)
  ))
}

function configureDenseRecipeStack(state: ResourceMockState) {
  const document = state.documents[FIRST_CANVAS_ID]
  const upperResult = document.nodes.find((item) => item.id === 'result-existing')!
  upperResult.position_x = 560
  upperResult.position_y = 90
  upperResult.width = 320
  upperResult.height = 200
  document.nodes.push(
    {
      ...document.nodes.find((item) => item.id === 'generation-cover')!,
      id: 'generation-recipe-stack', position_x: 560, position_y: 302, width: 340, height: 220,
      content: {
        subtype: 'image', serialization_version: 1, title: '纵向角色设定图',
        generation_recipe_id: 'character-sheet', generation_recipe_version: 2,
      },
    },
    {
      ...upperResult,
      id: 'result-recipe-stack', position_y: 534,
      content: {
        ...(upperResult.content as Record<string, unknown>),
        title: '纵向角色设定结果', asset_id: 'asset-recipe-stack',
        url: 'https://media.revid.test/recipe-stack.png',
      },
    },
  )
  return document
}

test('visual asset recipe branch persists typed metadata and one ordered reference edge', () => {
  for (const [recipeId, title] of [
    ['character-sheet', '角色设定图'], ['scene-multiview', '场景多视图'],
  ] as const) {
    const command = createVisualAssetRecipeBranchCommand(canonicalImageResult(), recipeId)
    expect(command).not.toBeNull()
    expect(command!.nodes).toHaveLength(1)
    expect(command!.nodes[0]).toMatchObject({
      type: 'generation', title, content: undefined,
      contentData: {
        subtype: 'image', serialization_version: 1,
        generation_recipe_id: recipeId, generation_recipe_version: 2,
      },
    })
    expect(command!.connections).toEqual([expect.objectContaining({
      from: 'result-reference', to: command!.nodes[0].id,
      sourcePort: 'out', targetPort: 'media', metadata: { input_order: 1 },
    })])
  }
})

test('recipe generation transport sends identifier and reference without client prompt', async () => {
  const calls: Array<{ path: string; payload: Record<string, unknown> }> = []
  const quotas: QuotaBalance = { text: 3, image: 2, video: 1 }
  const quotaStore = {
    quotas, quotaRevision: 0,
    applyQuotaSnapshot(next: QuotaBalance, revision: number) { this.quotas = next; this.quotaRevision = revision; return true },
  }
  const transport = {
    async post(path: string, payload: unknown) {
      calls.push({ path, payload: payload as Record<string, unknown> })
      return { data: {
        asset: {
          id: 'asset-recipe', user_id: 'user-recipe', project_id: 'project-recipe', origin_canvas_id: 'canvas-recipe',
          canvas_node_id: 'node-recipe', type: 'image', url: 'https://media.revid.test/recipe.png', content_text: null,
          source: 'generation', source_model: 'mock-image-v1', source_task_id: 'task-recipe', status: 'active',
          created_at: '2026-07-15T12:00:00Z', updated_at: '2026-07-15T12:00:00Z',
        },
        generation_task: {
          id: 'task-recipe', user_id: 'user-recipe', project_id: 'project-recipe', origin_canvas_id: 'canvas-recipe',
          canvas_node_id: 'node-recipe', media_type: 'image', provider: 'mock', model: 'mock-image-v1',
          provider_request_id: 'request-recipe', status: 'succeeded', duration_ms: 10, result_asset_id: 'asset-recipe',
          request_parameters: {
            contract_version: 1, media_type: 'image', generation_recipe_id: 'character-sheet',
            generation_recipe_version: 2, aspect_ratio: '4:3', image_ids: ['asset-reference'],
          },
          error_code: null, error_message: null, created_at: '2026-07-15T12:00:00Z', updated_at: '2026-07-15T12:00:00Z',
        },
        quotas, quota_revision: 1,
      } }
    },
  }
  await requestCanvasGeneration({
    mediaType: 'image', projectId: 'project-recipe', originCanvasId: 'canvas-recipe', canvasNodeId: 'node-recipe',
    recipeId: 'character-sheet', recipeVersion: 2, imageIds: ['asset-reference'],
  }, quotaStore, transport)

  expect(calls).toEqual([{
    path: '/api/image-generate',
    payload: {
      project_id: 'project-recipe', origin_canvas_id: 'canvas-recipe', canvas_node_id: 'node-recipe',
      generation_recipe_id: 'character-sheet', generation_recipe_version: 2, image_ids: ['asset-reference'],
    },
  }])
  expect(calls[0].payload).not.toHaveProperty('prompt')
})

test('visual asset recipe resolver preserves exact persisted v1 and v2 definitions', () => {
  const v1Node = canonicalImageResult()
  v1Node.type = 'generation'
  v1Node.contentData = {
    subtype: 'image', serialization_version: 1,
    generation_recipe_id: 'character-sheet', generation_recipe_version: 1,
  }
  const v2Node = structuredClone(v1Node)
  v2Node.contentData!.generation_recipe_version = 2
  const unknownNode = structuredClone(v1Node)
  unknownNode.contentData!.generation_recipe_version = 99

  expect(resolveVisualAssetRecipe(v1Node)).toMatchObject({ id: 'character-sheet', version: 1 })
  expect(resolveVisualAssetRecipe(v2Node)).toMatchObject({ id: 'character-sheet', version: 2 })
  expect(resolveVisualAssetRecipe(unknownNode)).toBeNull()
})

test('recipe-flow toolbar isolates desktop results and compact drawer suppresses competing chrome', async ({ page }) => {
  const state = createResourceMockState()
  const document = configureDenseRecipeStack(state)

  await openResourceWorkspace(page, state)
  const documentBeforeSelection = JSON.stringify(document)
  const documentPatchesBeforeSelection = documentPatches(state).length
  const viewportPatchesBeforeSelection = viewportPatches(state).length
  await selectNode(page, '纵向角色设定图')

  const toolbar = await page.locator('.selection-toolbar').boundingBox()
  const mediaRects = (await page.locator('.canvas-node-surface.is-media').all()).map((item) => item.boundingBox())
  const resolvedMediaRects = (await Promise.all(mediaRects)).filter((item): item is NonNullable<typeof item> => item !== null)
  const stackedResults = resolvedMediaRects.filter((rect) => rect.x >= 500 && rect.x <= 700).sort((a, b) => a.y - b.y)
  expect(toolbar).not.toBeNull()
  expect(stackedResults).toHaveLength(2)
  expect(boxesOverlap(toolbar!, stackedResults[0])).toBe(false)
  expect(boxesOverlap(toolbar!, stackedResults[1])).toBe(false)
  expect(JSON.stringify(document)).toBe(documentBeforeSelection)
  expect(documentPatches(state)).toHaveLength(documentPatchesBeforeSelection)
  expect(viewportPatches(state)).toHaveLength(viewportPatchesBeforeSelection)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'recipe-flow-toolbar-isolation-1440x900.png'), fullPage: true })

  const compactState = createResourceMockState()
  const compactDocument = configureDenseRecipeStack(compactState)
  for (const nodeId of ['result-existing', 'generation-recipe-stack', 'result-recipe-stack']) {
    compactDocument.nodes.find((item) => item.id === nodeId)!.position_x = 170
  }
  await openResourceWorkspace(page, compactState, { width: 920, height: 900 })
  const compactDocumentBeforeSelection = JSON.stringify(compactDocument)
  const compactDocumentPatchCount = documentPatches(compactState).length
  const compactViewportPatchCount = viewportPatches(compactState).length
  await selectNode(page, '纵向角色设定图')
  const compactDrawer = page.locator('.n-drawer:visible')
  await expect(compactDrawer).toHaveCount(1)
  await expect.poll(async () => {
    const rect = await compactDrawer.boundingBox()
    return rect ? { right: Math.round(rect.x + rect.width), width: Math.round(rect.width) } : null
  }).toEqual({ right: 920, width: 360 })
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  const compactMediaRects = await Promise.all(
    (await page.locator('.canvas-node-surface.is-media').all()).map((item) => item.boundingBox()),
  )
  expect(compactMediaRects.filter((item) => item !== null)).toHaveLength(2)
  expect(JSON.stringify(compactDocument)).toBe(compactDocumentBeforeSelection)
  expect(documentPatches(compactState)).toHaveLength(compactDocumentPatchCount)
  const compactRevealPatches = viewportPatches(compactState).slice(compactViewportPatchCount)
  expect(compactRevealPatches.length).toBeLessThanOrEqual(1)
  if (compactRevealPatches.length) {
    expect(compactRevealPatches[0]).toEqual(expect.objectContaining({ body: { x: 120, y: 38, zoom: 1 } }))
  }
  await page.screenshot({ path: resolve(evidenceDirectory, 'recipe-flow-toolbar-isolation-920x900.png'), fullPage: true })
})

test('character recipe directly persists, executes, materializes, and reloads without prompt leakage', async ({ page }) => {
  const state = createResourceMockState()
  let releaseGeneration!: () => void
  state.generationGate = new Promise<void>((resolveGate) => { releaseGeneration = resolveGate })
  const initialQuota = state.quotas.image
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  const branch = page.locator('.result-branch')
  await branch.locator('summary').click()
  await expect(branch.getByRole('button', { name: /生成角色设定图/ })).toBeVisible()
  await expect(branch.getByRole('button', { name: /生成场景多视图/ })).toBeVisible()
  await branch.getByRole('button', { name: /生成角色设定图/ }).click()

  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  await expect(page.locator('.generation-editor')).toContainText('角色设定图生成中')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'character-sheet-running-1440x900.png'), fullPage: true })
  releaseGeneration()
  const request = state.requests.find((item) => item.path === '/api/image-generate')!
  expect(request.body).toEqual({
    project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: expect.any(String),
    generation_recipe_id: 'character-sheet', generation_recipe_version: 2, image_ids: ['asset-generated'],
  })
  expect(request.body).not.toHaveProperty('prompt')
  const generationNode = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    (item.content as Record<string, unknown>).generation_recipe_id === 'character-sheet'
  ))!
  expect(generationNode.content).toEqual(expect.objectContaining({
    title: '角色设定图', subtype: 'image', generation_recipe_id: 'character-sheet', generation_recipe_version: 2,
  }))
  const patchIndex = state.requests.findIndex((item) => item.method === 'PATCH' && item.path.endsWith('/document'))
  const requestIndex = state.requests.findIndex((item) => item.path === '/api/image-generate')
  expect(patchIndex).toBeGreaterThanOrEqual(0)
  expect(patchIndex).toBeLessThan(requestIndex)
  await expect.poll(() => state.quotas.image).toBe(initialQuota - 1)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)

  const editor = page.locator('.generation-editor')
  await expect(editor.getByRole('region', { name: '视觉资产配方' })).toContainText('角色设定图')
  await expect(editor.getByRole('textbox', { name: '生成提示词' })).toHaveCount(0)
  await expect(editor.getByText('检查最终生成请求')).toHaveCount(0)
  await expect(editor).toContainText('参考图 1 · 历史图片生成结果')
  await expect(editor.getByRole('button', { name: '重新生成角色设定图' })).toBeVisible()
  await page.screenshot({ path: resolve(evidenceDirectory, 'character-sheet-success-1440x900.png'), fullPage: true })

  await page.reload()
  await selectNode(page, '角色设定图')
  await expect(page.getByRole('region', { name: '视觉资产配方' })).toContainText('单参考图')
  await expect(page.getByRole('textbox', { name: '生成提示词' })).toHaveCount(0)
})

test('scene recipe stays bounded in compact and all recipe actions disappear in readonly', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '历史图片生成结果')
  const drawer = page.locator('.n-drawer:visible')
  await drawer.locator('.result-branch summary').click()
  await drawer.getByRole('button', { name: /生成场景多视图/ }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/image-generate')?.body).toEqual(expect.objectContaining({
    generation_recipe_id: 'scene-multiview', generation_recipe_version: 2, image_ids: ['asset-generated'],
  }))
  const recipeDrawer = page.locator('.n-drawer:visible')
  await expect(recipeDrawer.getByRole('region', { name: '视觉资产配方' })).toContainText('场景多视图')
  const drawerBox = await recipeDrawer.boundingBox()
  expect(drawerBox?.width).toBeLessThanOrEqual(360)
  expect(await recipeDrawer.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(Math.ceil(drawerBox!.width))
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'scene-multiview-compact-920x900.png'), fullPage: true })

  const readonlyState = createResourceMockState()
  await openResourceWorkspace(page, readonlyState, { width: 375, height: 812 })
  await selectNode(page, '历史图片生成结果')
  await expect(page.getByRole('button', { name: /生成角色设定图|生成场景多视图/ })).toHaveCount(0)
  expect(documentPatches(readonlyState)).toHaveLength(0)
  await page.screenshot({ path: resolve(evidenceDirectory, 'recipes-readonly-375x812.png'), fullPage: true })
})

test('failed recipe is uncharged and explicit retry settles exactly once', async ({ page }) => {
  const state = createResourceMockState()
  state.generationOutcome = 'failure'
  const initialQuota = state.quotas.image
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  await page.locator('.result-branch summary').click()
  await page.getByRole('button', { name: /生成角色设定图/ }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  expect(state.quotas.image).toBe(initialQuota)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    String((item.content as Record<string, unknown>).source_task_id ?? '').startsWith('task-success')
  ))).toHaveLength(0)
  const retry = page.getByRole('button', { name: '重新生成角色设定图' })
  await expect(retry).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'character-sheet-failure-1440x900.png'), fullPage: true })

  state.generationOutcome = 'success'
  await retry.click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(2)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    String((item.content as Record<string, unknown>).source_task_id ?? '').startsWith('task-success')
  )).length).toBe(1)
  expect(state.quotas.image).toBe(initialQuota - 1)
  expect(state.requests.filter((item) => item.path === '/api/image-generate').every((item) => !('prompt' in (item.body ?? {})))).toBe(true)
})
