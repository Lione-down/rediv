import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  addProjectImageNode,
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-082')

const GRID_ACTIONS = [
  { count: 4, label: '拆分为四宫格' },
  { count: 9, label: '拆分为九宫格' },
  { count: 16, label: '拆分为十六宫格' },
  { count: 25, label: '拆分为二十五宫格' },
] as const

function cropGeometry(outputCount: number, index: number) {
  const gridSize = Math.sqrt(outputCount)
  const row = Math.floor(index / gridSize)
  const column = index % gridSize
  const x = Math.floor(320 * column / gridSize)
  const y = Math.floor(180 * row / gridSize)
  const right = Math.floor(320 * (column + 1) / gridSize)
  const bottom = Math.floor(180 * (row + 1) / gridSize)
  return { row, column, x, y, width: right - x, height: bottom - y }
}

function pngDimensions(buffer: Buffer) {
  expect(buffer.subarray(1, 4).toString('ascii')).toBe('PNG')
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function splitNodes(state: ResourceMockState) {
  return state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    (node.content as Record<string, unknown>)?.source_asset_id === 'asset-reference'
  )).sort((left, right) => (
    Number((left.content as Record<string, unknown>).image_grid_split_index) -
    Number((right.content as Record<string, unknown>).image_grid_split_index)
  ))
}

async function sourceBaseline(state: ResourceMockState, sourceNodeId: string) {
  await expect.poll(() => (
    (state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === sourceNodeId)?.content as Record<string, unknown>)?.aspect_ratio
  )).toBe(16 / 9)
  return {
    patchCount: documentPatches(state).length,
    snapshot: JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === sourceNodeId)),
  }
}

async function runSplit(page: Page, actionLabel: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 项目参考图' }).click()
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  await palette.getByRole('option', { name: new RegExp(actionLabel) }).click()
}

for (const action of GRID_ACTIONS) {
  test(`${action.count} grid split uploads exact row-major crops and commits one graph mutation`, async ({ page }) => {
    const state = createResourceMockState()
    const sourceNode = addProjectImageNode(state)
    await openResourceWorkspace(page, state)
    const baseline = await sourceBaseline(state, String(sourceNode.id))
    await runSplit(page, action.label)

    await expect.poll(() => state.uploads.length).toBe(action.count)
    await expect.poll(() => documentPatches(state).length).toBe(baseline.patchCount + 1)
    await expect.poll(() => splitNodes(state).length).toBe(action.count)
    const outputs = splitNodes(state)
    expect(outputs).toHaveLength(action.count)
    expect(JSON.stringify(state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === sourceNode.id))).toBe(baseline.snapshot)

    for (let index = 0; index < outputs.length; index += 1) {
      const output = outputs[index]
      const content = output.content as Record<string, unknown>
      const expected = cropGeometry(action.count, index)
      expect(content).toMatchObject({
        subtype: 'image', serialization_version: 1,
        project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID,
        source_asset_id: 'asset-reference', image_grid_split_schema_version: 1,
        image_grid_split_count: action.count, image_grid_split_index: index + 1,
        image_grid_split_row: expected.row, image_grid_split_column: expected.column,
        image_grid_source_width: 320, image_grid_source_height: 180,
        image_grid_crop_x: expected.x, image_grid_crop_y: expected.y,
        image_grid_crop_width: expected.width, image_grid_crop_height: expected.height,
      })
      const asset = state.assets.find((candidate) => candidate.id === content.asset_id)
      expect(asset).toMatchObject({
        user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID,
        canvas_node_id: null, type: 'image', source: 'upload', status: 'active', url: content.url,
      })
      const pathname = new URL(String(content.url)).pathname
      expect(pngDimensions(state.capturedFrames[pathname])).toEqual({ width: expected.width, height: expected.height })
    }

    const mutation = documentPatches(state)[baseline.patchCount].body!
    expect(mutation.node_upserts).toHaveLength(action.count)
    expect(mutation.node_deletes).toEqual([])
    expect(mutation.connection_upserts).toEqual([])
    expect(mutation.connection_deletes).toEqual([])

    if (action.count === 4) {
      const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
      await stage.focus()
      await page.keyboard.press('Control+z')
      await expect.poll(() => splitNodes(state).length).toBe(0)
      await page.keyboard.press('Control+Shift+z')
      await expect.poll(() => splitNodes(state).length).toBe(4)
      expect(state.uploads).toHaveLength(4)
      await page.reload()
      await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
      expect(splitNodes(state)).toHaveLength(4)
    }
    if (action.count === 25) {
      const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
      await stage.focus()
      await page.keyboard.press('Control+0')
      await mkdir(evidenceDirectory, { recursive: true })
      await stage.screenshot({ path: resolve(evidenceDirectory, 'grid-split-25-fit-all.png') })
    }
  })
}

test('partial crop upload failure leaves the source graph unchanged and performs no document mutation', async ({ page }) => {
  const state = createResourceMockState()
  const sourceNode = addProjectImageNode(state)
  state.uploadFailureAt = 3
  await openResourceWorkspace(page, state)
  const baseline = await sourceBaseline(state, String(sourceNode.id))
  const graphSnapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])
  await runSplit(page, '拆分为四宫格')

  await expect.poll(() => state.uploads.length).toBe(3)
  await expect(page.getByRole('alert')).toContainText('mock image upload rejected')
  expect(documentPatches(state)).toHaveLength(baseline.patchCount)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(graphSnapshot)
})

test('selection change during upload aborts before graph mutation', async ({ page }) => {
  const state = createResourceMockState()
  const sourceNode = addProjectImageNode(state)
  let releaseUpload = () => undefined
  state.uploadGate = new Promise<void>((resolve) => { releaseUpload = resolve })
  await openResourceWorkspace(page, state)
  const baseline = await sourceBaseline(state, String(sourceNode.id))
  const graphSnapshot = JSON.stringify(state.documents[FIRST_CANVAS_ID])
  await runSplit(page, '拆分为四宫格')

  await expect.poll(() => state.uploads.length).toBe(1)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
  releaseUpload()
  await expect(page.getByRole('alert')).toContainText('所选项目图片已变化')
  expect(documentPatches(state)).toHaveLength(baseline.patchCount)
  expect(JSON.stringify(state.documents[FIRST_CANVAS_ID])).toBe(graphSnapshot)
})
