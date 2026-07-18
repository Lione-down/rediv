import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'
import {
  STORYBOARD_RECIPES,
  resolveStoryboardRecipe,
  resolveStoryboardRecipeSource,
} from '../../src/modules/canvas/storyboard-recipe-registry'
import { VISUAL_ASSET_RECIPES } from '../../src/modules/canvas/visual-asset-recipes'
import { resolveProfessionalCanvasActions } from '../../src/modules/canvas/professional-action-registry'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-084-storyboard-recipes')

function scriptNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'script-source', type: 'script', title: '剧情脚本', x: 40, y: 80, width: 320, height: 200,
    content: '角色进入车站，列车缓缓停下。',
    contentData: { subtype: 'script', serialization_version: 1, text: '角色进入车站，列车缓缓停下。' },
    ...overrides,
  }
}

function imageResult(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'result-source', type: 'result', title: '角色参考', x: 40, y: 80, width: 320, height: 240,
    contentData: {
      subtype: 'image', serialization_version: 1, asset_id: 'asset-source',
      project_id: 'project-a', url: 'https://media.revid.test/source.png',
    },
    ...overrides,
  }
}

function imageAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'asset-source', user_id: 'user-a', project_id: 'project-a', origin_canvas_id: 'canvas-a',
    canvas_node_id: 'result-source', type: 'image', url: 'https://media.revid.test/source.png',
    content_text: null, source: 'generation', source_model: 'mock-image-v1', source_task_id: 'task-a',
    status: 'active', created_at: '2026-07-17T00:00:00Z', updated_at: '2026-07-17T00:00:00Z',
    ...overrides,
  }
}

function context(selectedNodes: CanvasNode[], assets: Asset[] = []) {
  return { assets, projectId: 'project-a', selectedNodes, userId: 'user-a' }
}

function actionContext(selectedNodes: CanvasNode[], assets: Asset[] = []) {
  return {
    ...context(selectedNodes, assets),
    canvasId: 'canvas-a', canvasReady: true, isBusy: false, isReadOnly: false, isWorkflowView: true,
  }
}

function storyboardGraphNodes(state: ResourceMockState) {
  return state.documents[FIRST_CANVAS_ID].nodes.filter((node) => {
    const content = node.content as Record<string, unknown>
    return content?.shot_schema_version === 1 || content?.storyboard_schema_version === 2
  })
}

function generationPosts(state: ResourceMockState) {
  return state.requests.filter((request) => (
    request.method === 'POST' && ['/api/image-generate', '/api/video-generate'].includes(request.path)
  ))
}

async function selectNodeFromGraphAccess(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

async function runStoryboardRecipe(page: Page, actionName: string) {
  await selectNodeFromGraphAccess(page, '镜头脚本')
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  await palette.getByRole('option', { name: new RegExp(actionName) }).click()
}

async function runVisualStoryboardRecipe(page: Page, actionName: string) {
  await selectNodeFromGraphAccess(page, '历史图片生成结果')
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  await palette.getByRole('option', { name: new RegExp(actionName) }).click()
}

test('professional Storyboard registry defines exact versioned shot and visual presets', () => {
  expect(Object.keys(STORYBOARD_RECIPES)).toEqual([
    'plot-board-4',
    'shot-board-9',
    'shot-board-16',
    'shot-board-25',
    'character-turnaround',
    'scene-reference-views',
  ])
  expect([
    STORYBOARD_RECIPES['plot-board-4'].execution,
    STORYBOARD_RECIPES['shot-board-9'].execution,
    STORYBOARD_RECIPES['shot-board-16'].execution,
    STORYBOARD_RECIPES['shot-board-25'].execution,
  ]).toEqual([
    { type: 'shot-plan', requestedShotCount: 4 },
    { type: 'shot-plan', requestedShotCount: 9 },
    { type: 'shot-plan', requestedShotCount: 16 },
    { type: 'shot-plan', requestedShotCount: 25 },
  ])
  expect(STORYBOARD_RECIPES['character-turnaround'].execution).toEqual({
    type: 'visual-asset', recipeId: 'character-sheet',
  })
  expect(STORYBOARD_RECIPES['scene-reference-views'].execution).toEqual({
    type: 'visual-asset', recipeId: 'scene-multiview',
  })
  expect(Object.values(STORYBOARD_RECIPES).every((recipe) => recipe.version === 1)).toBe(true)
  expect(VISUAL_ASSET_RECIPES[STORYBOARD_RECIPES['character-turnaround'].execution.recipeId].version).toBe(2)
  expect(VISUAL_ASSET_RECIPES[STORYBOARD_RECIPES['scene-reference-views'].execution.recipeId].version).toBe(2)
  expect(resolveStoryboardRecipe('plot-board-4', 1)).toBe(STORYBOARD_RECIPES['plot-board-4'])
  expect(resolveStoryboardRecipe('plot-board-4', 2)).toBeNull()
  expect(resolveStoryboardRecipe('unknown-recipe', 1)).toBeNull()
})

test('script Storyboard presets require one exact canonical editable script', () => {
  const recipe = STORYBOARD_RECIPES['shot-board-9']
  expect(resolveStoryboardRecipeSource(recipe, context([scriptNode()]))).toEqual({
    type: 'script', node: scriptNode(),
  })

  const invalid = [
    [],
    [scriptNode(), scriptNode({ id: 'second-script' })],
    [scriptNode({ isLocked: true })],
    [scriptNode({ parentNodeId: 'group-a' })],
    [scriptNode({ type: 'note' })],
    [scriptNode({ content: '', contentData: { subtype: 'script', serialization_version: 1, text: '' } })],
    [scriptNode({ contentData: { subtype: 'script', serialization_version: 2, text: '未来脚本' } })],
  ]
  for (const selectedNodes of invalid) {
    expect(resolveStoryboardRecipeSource(recipe, context(selectedNodes))).toBeNull()
  }
})

test('visual Storyboard presets require one current project-owned active canonical image result', () => {
  const recipe = STORYBOARD_RECIPES['character-turnaround']
  const node = imageResult()
  const asset = imageAsset()
  expect(resolveStoryboardRecipeSource(recipe, context([node], [asset]))).toEqual({
    type: 'visual-asset', node, asset,
  })

  const invalid = [
    context([], [asset]),
    context([node, imageResult({ id: 'second-result' })], [asset]),
    context([imageResult({ isLocked: true })], [asset]),
    context([imageResult({ parentNodeId: 'group-a' })], [asset]),
    context([imageResult({ type: 'asset' })], [asset]),
    context([imageResult({ contentData: { ...node.contentData, subtype: 'video' } })], [asset]),
    context([node], []),
    context([node], [imageAsset({ user_id: 'other-user' })]),
    context([node], [imageAsset({ project_id: 'other-project' })]),
    context([node], [imageAsset({ type: 'video' })]),
    context([node], [imageAsset({ status: 'deleted' })]),
    context([node], [imageAsset({ url: 'https://media.revid.test/other.png' })]),
  ]
  for (const candidate of invalid) {
    expect(resolveStoryboardRecipeSource(recipe, candidate)).toBeNull()
  }
})

test('professional actions expose only source-compatible Storyboard presets and searchable metadata', () => {
  const storyboardIds = (selectedNodes: CanvasNode[], assets: Asset[] = [], query = '') => (
    resolveProfessionalCanvasActions(actionContext(selectedNodes, assets), query)
      .filter((action) => action.id.startsWith('storyboard.'))
      .filter((action) => action.eligibility.eligible)
      .map((action) => action.id)
  )

  expect(storyboardIds([scriptNode()])).toEqual([
    'storyboard.plot-board-4',
    'storyboard.shot-board-9',
    'storyboard.shot-board-16',
    'storyboard.shot-board-25',
  ])
  expect(storyboardIds([imageResult()], [imageAsset()])).toEqual([
    'storyboard.character-turnaround',
    'storyboard.scene-reference-views',
  ])
  expect(storyboardIds([scriptNode()], [], '二十五')).toEqual(['storyboard.shot-board-25'])
  expect(storyboardIds([imageResult()], [imageAsset()], '三视图')).toEqual(['storyboard.character-turnaround'])
  expect(storyboardIds([imageResult()], [])).toEqual([])
  expect(storyboardIds([scriptNode({ isLocked: true })])).toEqual([])
  expect(storyboardIds([scriptNode()], [], '',).length).toBe(4)
  expect(resolveProfessionalCanvasActions({ ...actionContext([scriptNode()]), isReadOnly: true })
    .filter((action) => action.id.startsWith('storyboard.') && action.eligibility.eligible)).toHaveLength(0)
  expect(resolveProfessionalCanvasActions({ ...actionContext([scriptNode()]), isWorkflowView: false })
    .filter((action) => action.id.startsWith('storyboard.') && action.eligibility.eligible)).toHaveLength(0)
})

test('script Storyboard recipe Palette stays bounded, reduced-motion safe, accessible, and focus-restoring at 920px', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNodeFromGraphAccess(page, '镜头脚本')
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  await expect(palette.getByRole('option')).toHaveCount(12)
  await expect(palette.getByRole('option').first()).toHaveCSS('transition-duration', '0s')
  const box = await palette.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(920)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(900)
  const accessibility = await new AxeBuilder({ page }).include('.professional-action-palette').analyze()
  expect(accessibility.violations.filter((violation) => (
    violation.impact === 'serious' || violation.impact === 'critical'
  ))).toEqual([])
  await mkdir(evidenceDirectory, { recursive: true })
  await palette.screenshot({ path: resolve(evidenceDirectory, 'script-recipes-palette-920x900.png') })
  await page.keyboard.press('Escape')
  await expect(palette).toHaveCount(0)
  await expect(stage).toBeFocused()
  expect(documentPatches(state)).toHaveLength(0)
})

for (const preset of [
  { actionName: '创建四格剧情板', count: 4, columns: 2 },
  { actionName: '创建九镜头故事板', count: 9, columns: 3 },
  { actionName: '创建十六镜头故事板', count: 16, columns: 4 },
  { actionName: '创建二十五镜头故事板', count: 25, columns: 5 },
] as const) {
  test(`${preset.count}-shot Storyboard preset creates one exact atomic planning graph`, async ({ page }) => {
    const state = createResourceMockState()
    const baselineNodeCount = state.documents[FIRST_CANVAS_ID].nodes.length
    const baselineEdgeCount = state.documents[FIRST_CANVAS_ID].connections.length
    const sourceSnapshot = JSON.stringify(
      state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'script-source'),
    )
    await openResourceWorkspace(page, state)

    await runStoryboardRecipe(page, preset.actionName)

    await expect.poll(() => state.shotSchemaCount).toBe(1)
    await expect.poll(() => documentPatches(state).length).toBe(1)
    const request = state.requests.find((candidate) => candidate.path.endsWith('/shot-schema'))
    expect(request).toMatchObject({
      method: 'POST',
      path: `/api/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}/shot-schema`,
      body: {
        contract_version: 1, provider: 'mock', source_script_node_id: 'script-source',
        script: '黄昏海岸，人物入画。', requested_shot_count: preset.count,
      },
    })
    expect(generationPosts(state)).toHaveLength(0)
    expect(JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'script-source')))
      .toBe(sourceSnapshot)

    const created = storyboardGraphNodes(state)
    expect(created).toHaveLength(preset.count * 2 + 1)
    expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(baselineNodeCount + preset.count * 2 + 1)
    expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(baselineEdgeCount + preset.count * 2)
    const group = created.find((node) => node.node_type === 'group')!
    expect(group.content).toMatchObject({
      subtype: 'storyboard', storyboard_schema_version: 2, storyboard_kind: 'shot-plan',
      columns: preset.columns, ordered_child_ids: expect.any(Array),
    })
    expect((group.content as Record<string, unknown[]>).ordered_child_ids).toHaveLength(preset.count)
    expect(documentPatches(state)[0].body).toMatchObject({
      node_upserts: expect.arrayContaining([expect.objectContaining({ id: group.id })]),
      node_deletes: [], connection_deletes: [],
    })
    expect((documentPatches(state)[0].body!.node_upserts as unknown[])).toHaveLength(preset.count * 2 + 1)
    expect((documentPatches(state)[0].body!.connection_upserts as unknown[])).toHaveLength(preset.count * 2)
  })
}

test('pending Storyboard preset aborts when the selected script changes', async ({ page }) => {
  const state = createResourceMockState()
  let release = () => undefined
  state.shotSchemaGate = new Promise<void>((resolve) => { release = resolve })
  await openResourceWorkspace(page, state)
  const snapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])

  await runStoryboardRecipe(page, '创建四格剧情板')
  await expect.poll(() => state.events.filter((event) => event.startsWith('shot-schema-requested:')).length).toBe(1)
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/shot-schema'))
  await selectNodeFromGraphAccess(page, '历史图片生成结果')
  release()
  await response
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

  expect(documentPatches(state)).toHaveLength(0)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(snapshot)
  expect(generationPosts(state)).toHaveLength(0)
})

test('failed visual Storyboard preset is uncharged and explicit retry settles once', async ({ page }) => {
  const state = createResourceMockState()
  state.generationOutcome = 'failure'
  const initialQuota = state.quotas.image
  await openResourceWorkspace(page, state)

  await runVisualStoryboardRecipe(page, '创建角色转面参考板')
  await expect.poll(() => generationPosts(state).length).toBe(1)
  expect(state.quotas.image).toBe(initialQuota)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    (node.content as Record<string, unknown>).source_task_id === 'task-failure'
  ))).toHaveLength(0)
  const retry = page.getByRole('button', { name: '重新生成角色设定图' })
  await expect(retry).toBeVisible()

  state.generationOutcome = 'success'
  await retry.click()
  await expect.poll(() => generationPosts(state).length).toBe(2)
  await expect.poll(() => state.quotas.image).toBe(initialQuota - 1)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    String((node.content as Record<string, unknown>).source_task_id ?? '').startsWith('task-success')
  )).length).toBe(1)
})

test('compact Workflow can run a preset after drawer handoff while 375px remains review-only', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNodeFromGraphAccess(page, '镜头脚本')
  await expect(page.locator('.n-drawer:visible')).toHaveCount(1)
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await expect(page.locator('.n-drawer:visible')).toHaveCount(0)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette.getByRole('option', { name: /创建九镜头故事板/ })).toBeVisible()
  await palette.getByRole('option', { name: /创建九镜头故事板/ }).click()
  await expect.poll(() => state.shotSchemaCount).toBe(1)
  expect(state.requests.find((candidate) => candidate.path.endsWith('/shot-schema'))?.body)
    .toMatchObject({ requested_shot_count: 9 })

  await page.setViewportSize({ width: 375, height: 812 })
  await stage.focus()
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  expect(state.shotSchemaCount).toBe(1)
})

test('visual Storyboard presets remain available while an unrelated generation is in flight', async ({ page }) => {
  const state = createResourceMockState()
  let releaseGeneration = () => undefined
  state.generationGate = new Promise<void>((resolve) => { releaseGeneration = resolve })
  await openResourceWorkspace(page, state)
  await selectNodeFromGraphAccess(page, '封面生成')
  const generationRequest = page.waitForRequest((request) => request.url().endsWith('/api/image-generate'))
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await generationRequest

  await selectNodeFromGraphAccess(page, '历史图片生成结果')
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  const recipeAction = palette.getByRole('option', { name: /创建角色转面参考板/ })
  await expect(recipeAction).toBeVisible()
  await recipeAction.click()
  await expect.poll(() => generationPosts(state).length).toBe(2)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((node) => (
    typeof (node.content as Record<string, unknown>).generation_recipe_id === 'string'
  ))).toBe(true)

  releaseGeneration()
  await expect.poll(() => state.generationCount).toBe(2)
})

for (const preset of [
  { actionName: '创建角色转面参考板', recipeId: 'character-sheet', recipeTitle: '角色设定图' },
  { actionName: '创建场景多视角参考板', recipeId: 'scene-multiview', recipeTitle: '场景多视图' },
] as const) {
  test(`${preset.recipeId} Storyboard preset reuses the existing mock visual recipe transaction`, async ({ page }) => {
    const state = createResourceMockState()
    const initialQuota = state.quotas.image
    await openResourceWorkspace(page, state)

    await runVisualStoryboardRecipe(page, preset.actionName)

    await expect.poll(() => generationPosts(state).length).toBe(1)
    const request = generationPosts(state)[0]
    expect(request.body).toEqual({
      project_id: PROJECT_ID,
      origin_canvas_id: FIRST_CANVAS_ID,
      client_request_id: expect.any(String),
      canvas_node_id: expect.any(String),
      generation_recipe_id: preset.recipeId,
      generation_recipe_version: 2,
      image_ids: ['asset-generated'],
    })
    expect(request.body).not.toHaveProperty('prompt')
    const recipeNode = state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
      (node.content as Record<string, unknown>).generation_recipe_id === preset.recipeId
    ))!
    expect(recipeNode.content).toMatchObject({
      title: preset.recipeTitle,
      subtype: 'image',
      generation_recipe_id: preset.recipeId,
      generation_recipe_version: 2,
    })
    const branchPatchIndex = state.requests.findIndex((candidate) => (
      candidate.method === 'PATCH' && candidate.path.endsWith('/document') &&
      (candidate.body?.node_upserts as Array<Record<string, unknown>> | undefined)?.some((node) => node.id === recipeNode.id)
    ))
    const requestIndex = state.requests.findIndex((candidate) => candidate.path === '/api/image-generate')
    expect(branchPatchIndex).toBeGreaterThanOrEqual(0)
    expect(branchPatchIndex).toBeLessThan(requestIndex)
    await expect.poll(() => state.quotas.image).toBe(initialQuota - 1)
    await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
      String((node.content as Record<string, unknown>).source_task_id ?? '').startsWith('task-success')
    )).length).toBe(1)

    await page.getByRole('tab', { name: '故事板' }).click()
    await expect(page.getByRole('region', { name: '故事板审阅' })
      .getByRole('button', { name: new RegExp(`审阅 ${preset.recipeTitle}`) })).toBeVisible()
  })
}
