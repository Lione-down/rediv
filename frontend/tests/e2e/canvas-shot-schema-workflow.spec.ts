import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-083')

function generationPosts(state: ResourceMockState) {
  return state.requests.filter((request) => (
    request.method === 'POST' && ['/api/image-generate', '/api/video-generate'].includes(request.path)
  ))
}

function shotSchemaPosts(state: ResourceMockState) {
  return state.requests.filter((request) => request.method === 'POST' && request.path.endsWith('/shot-schema'))
}

function shotGraphNodes(state: ResourceMockState) {
  return state.documents[FIRST_CANVAS_ID].nodes.filter((node) => {
    const content = node.content as Record<string, unknown>
    return content?.shot_schema_version === 1 || content?.storyboard_schema_version === 2
  })
}

async function selectNodeFromGraphAccess(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

async function runShotAction(page: Page) {
  await selectNodeFromGraphAccess(page, '镜头脚本')
  if (await page.locator('.n-drawer:visible').isVisible()) {
    await page.getByRole('button', { name: '关闭节点详情' }).click()
  }
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  await palette.getByRole('option', { name: /从脚本创建分镜计划/ }).click()
}

test('mock shot action creates one atomic ordered graph with no generation request and survives history reload', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const sourceSnapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'script-source'))
  const quotaSnapshot = structuredClone(state.quotas)
  const baselineNodeCount = state.documents[FIRST_CANVAS_ID].nodes.length
  const baselineEdgeCount = state.documents[FIRST_CANVAS_ID].connections.length

  await runShotAction(page)

  await expect.poll(() => state.shotSchemaCount).toBe(1)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  expect(shotSchemaPosts(state)).toEqual([expect.objectContaining({
    path: `/api/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}/shot-schema`,
    body: {
      contract_version: 1,
      provider: 'mock',
      source_script_node_id: 'script-source',
      script: '黄昏海岸，人物入画。',
    },
  })])
  expect(generationPosts(state)).toHaveLength(0)
  expect(state.generationCount).toBe(0)
  expect(state.quotas).toEqual(quotaSnapshot)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'script-source'))).toBe(sourceSnapshot)

  const created = shotGraphNodes(state)
  expect(created).toHaveLength(5)
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(baselineNodeCount + 5)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(baselineEdgeCount + 4)
  const prompts = created.filter((node) => node.node_type === 'script')
  const generations = created.filter((node) => node.node_type === 'generation')
  const orderedPrompts = [...prompts].sort((left, right) => Number((left.content as Record<string, unknown>).shot_index) - Number((right.content as Record<string, unknown>).shot_index))
  const orderedGenerations = [...generations].sort((left, right) => Number((left.content as Record<string, unknown>).shot_index) - Number((right.content as Record<string, unknown>).shot_index))
  const group = created.find((node) => node.node_type === 'group')!
  expect(prompts).toHaveLength(2)
  expect(generations).toHaveLength(2)
  expect(group.content).toMatchObject({
    subtype: 'storyboard', storyboard_schema_version: 2, storyboard_kind: 'shot-plan',
    shot_schema_version: 1, ordered_child_ids: orderedGenerations.map((node) => node.id),
  })
  expect(orderedGenerations.map((node) => node.parent_node_id)).toEqual([group.id, group.id])
  orderedGenerations.forEach((generation, offset) => {
    const incoming = state.documents[FIRST_CANVAS_ID].connections
      .filter((edge) => edge.target_node_id === generation.id)
      .sort((left, right) => Number((left.metadata as Record<string, unknown>).input_order) - Number((right.metadata as Record<string, unknown>).input_order))
    expect(incoming.map((edge) => [edge.source_node_id, edge.target_port, (edge.metadata as Record<string, unknown>).input_order])).toEqual([
      ['script-source', 'prompt', 1],
      [orderedPrompts[offset].id, 'prompt', 2],
    ])
  })
  const mutation = documentPatches(state)[0].body!
  expect(mutation.node_upserts).toHaveLength(5)
  expect(mutation.connection_upserts).toHaveLength(4)
  expect(mutation.node_deletes).toEqual([])
  expect(mutation.connection_deletes).toEqual([])

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+0')
  await mkdir(evidenceDirectory, { recursive: true })
  await stage.screenshot({ path: resolve(evidenceDirectory, 'script-shot-graph-1440x900.png') })

  await page.getByRole('tab', { name: '故事板' }).click()
  const storyboard = page.getByRole('region', { name: '故事板审阅' })
  await expect(storyboard.getByRole('button', { name: '审阅 镜头 01 · 图片生成' })).toBeVisible()
  await expect(storyboard.getByRole('button', { name: '审阅 镜头 02 · 图片生成' })).toBeVisible()
  await page.getByRole('tab', { name: '工作流' }).click()

  await stage.focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => shotGraphNodes(state).length).toBe(0)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => shotGraphNodes(state).length).toBe(5)
  expect(state.shotSchemaCount).toBe(1)
  await page.reload()
  await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
  expect(shotGraphNodes(state)).toHaveLength(5)
  expect(generationPosts(state)).toHaveLength(0)
})

for (const outcome of ['failure', 'malformed'] as const) {
  test(`${outcome} response leaves the graph unchanged at 920px`, async ({ page }) => {
    const state = createResourceMockState()
    state.shotSchemaOutcome = outcome
    await openResourceWorkspace(page, state, { width: 920, height: 900 })
    const snapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])
    const patchCount = documentPatches(state).length
    await runShotAction(page)

    await expect.poll(() => state.shotSchemaCount).toBe(1)
    await expect(page.getByRole('alert')).toBeVisible()
    expect(documentPatches(state)).toHaveLength(patchCount)
    expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(snapshot)
    expect(generationPosts(state)).toHaveLength(0)
  })
}

test('selection change while mock provider is pending aborts before graph mutation', async ({ page }) => {
  const state = createResourceMockState()
  let release = () => undefined
  state.shotSchemaGate = new Promise<void>((resolve) => { release = resolve })
  await openResourceWorkspace(page, state)
  const snapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])
  await runShotAction(page)

  await expect.poll(() => state.events.filter((event) => event.startsWith('shot-schema-requested:')).length).toBe(1)
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/shot-schema'))
  await selectNodeFromGraphAccess(page, '历史图片生成结果')
  release()
  await response
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(snapshot)
  expect(generationPosts(state)).toHaveLength(0)
})

test('view mode change while mock provider is pending aborts before graph mutation', async ({ page }) => {
  const state = createResourceMockState()
  let release = () => undefined
  state.shotSchemaGate = new Promise<void>((resolve) => { release = resolve })
  await openResourceWorkspace(page, state)
  const snapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])
  await runShotAction(page)

  await expect.poll(() => state.events.filter((event) => event.startsWith('shot-schema-requested:')).length).toBe(1)
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/shot-schema'))
  await page.getByRole('tab', { name: '故事板' }).click()
  release()
  await response
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(documentPatches(state)).toHaveLength(0)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(snapshot)
  expect(generationPosts(state)).toHaveLength(0)
})

test('review-only transition while mock provider is pending aborts before graph mutation', async ({ page }) => {
  const state = createResourceMockState()
  let release = () => undefined
  state.shotSchemaGate = new Promise<void>((resolve) => { release = resolve })
  await openResourceWorkspace(page, state)
  const snapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])
  await runShotAction(page)

  await expect.poll(() => state.events.filter((event) => event.startsWith('shot-schema-requested:')).length).toBe(1)
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/shot-schema'))
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toHaveAttribute('aria-description', '只读审阅模式')
  release()
  await response
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(documentPatches(state)).toHaveLength(0)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(snapshot)
  expect(generationPosts(state)).toHaveLength(0)
})

test('revision panel transition while mock provider is pending aborts before graph mutation', async ({ page }) => {
  const state = createResourceMockState()
  let release = () => undefined
  state.shotSchemaGate = new Promise<void>((resolve) => { release = resolve })
  await openResourceWorkspace(page, state)
  const snapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])
  await runShotAction(page)

  await expect.poll(() => state.events.filter((event) => event.startsWith('shot-schema-requested:')).length).toBe(1)
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/shot-schema'))
  await page.getByRole('button', { name: '打开修订历史' }).click()
  await expect(page.getByRole('dialog', { name: '修订历史与恢复' })).toBeVisible()
  release()
  await response
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(documentPatches(state)).toHaveLength(0)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(snapshot)
  expect(generationPosts(state)).toHaveLength(0)
})

test('375px review-only cannot open or execute the shot action', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')

  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  expect(state.shotSchemaCount).toBe(0)
  expect(documentPatches(state)).toHaveLength(0)
})
