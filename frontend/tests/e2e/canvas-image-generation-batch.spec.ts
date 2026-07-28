import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { createImageGenerationBatchPlan } from '../../src/modules/canvas/image-generation-batch'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const EVIDENCE_DIRECTORY = resolve(process.cwd(), '..', 'output', 'playwright', 't6-004')
const T6_013_EVIDENCE_DIRECTORY = resolve(
  process.cwd(),
  '..',
  'output',
  'playwright',
  't6-013-ninth-candidate',
)

function generationNode(): CanvasNode {
  return {
    id: 'generation-source', type: 'generation', title: '批量图片', x: 120, y: 100, width: 340, height: 220,
    content: '四张海边分镜',
    contentData: {
      subtype: 'image', serialization_version: 1, text: '四张海边分镜',
      generation_parameters: { schema_version: 1, image: { aspect_ratio: '4:3', output_count: 4 } },
    },
  }
}

test('batch plan keeps slot one on the initiating card and prepares deterministic sibling cards atomically', () => {
  const source = generationNode()
  const prompt: CanvasNode = {
    id: 'script-source', type: 'script', title: '脚本', x: -320, y: 100, width: 320, height: 200,
    content: '海边脚本', contentData: { subtype: 'script', serialization_version: 1, text: '海边脚本' },
  }
  const connection: CanvasConnection = {
    id: 'prompt-edge', from: prompt.id, to: source.id, sourcePort: 'out', targetPort: 'prompt',
    status: 'active', active: true, metadata: { input_order: 1 },
  }
  const ids = ['slot-2', 'edge-2', 'slot-3', 'edge-3', 'slot-4', 'edge-4']
  const plan = createImageGenerationBatchPlan({
    sourceNode: source,
    existingNodes: [source, prompt],
    connections: [connection],
    slotCount: 4,
    batchId: '00000000-0000-4000-8000-000000000004',
    createId: () => ids.shift()!,
  })

  expect(plan.slots.map((slot) => ({ nodeId: slot.nodeId, batch: slot.batch }))).toEqual([
    { nodeId: source.id, batch: { batch_id: '00000000-0000-4000-8000-000000000004', slot_index: 1, slot_count: 4 } },
    { nodeId: 'slot-2', batch: { batch_id: '00000000-0000-4000-8000-000000000004', slot_index: 2, slot_count: 4 } },
    { nodeId: 'slot-3', batch: { batch_id: '00000000-0000-4000-8000-000000000004', slot_index: 3, slot_count: 4 } },
    { nodeId: 'slot-4', batch: { batch_id: '00000000-0000-4000-8000-000000000004', slot_index: 4, slot_count: 4 } },
  ])
  expect(plan.command.nodes.map((node) => node.id)).toEqual(['slot-2', 'slot-3', 'slot-4'])
  expect(plan.command.connections.map((edge) => ({ from: edge.from, to: edge.to, targetPort: edge.targetPort }))).toEqual([
    { from: prompt.id, to: 'slot-2', targetPort: 'prompt' },
    { from: prompt.id, to: 'slot-3', targetPort: 'prompt' },
    { from: prompt.id, to: 'slot-4', targetPort: 'prompt' },
  ])
  expect(plan.command.nodes.map((node) => node.contentData?.generation_parameters)).toEqual(
    plan.slots.slice(1).map((slot) => slot.parameters),
  )
  const rectangles = [source, ...plan.command.nodes]
  for (let index = 0; index < rectangles.length; index += 1) {
    for (let other = index + 1; other < rectangles.length; other += 1) {
      const left = rectangles[index]
      const right = rectangles[other]
      expect(left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y).toBe(false)
    }
  }
})

test('four-output image generation persists four slots and sends independent single-result requests', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  state.quotas.image = 4
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成', exact: true }).click()
  const controls = page.getByRole('region', { name: '生成参数' })
  await controls.getByRole('radio', { name: '4 张' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  await page.getByRole('button', { name: '开始图片生成' }).click()

  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(4)
  await expect.poll(() => state.tasks.filter((item) => String(item.id).startsWith('task-success')).length).toBe(4)
  const requests = state.requests.filter((item) => item.path === '/api/image-generate').map((item) => item.body!)
  expect(new Set(requests.map((body) => body.client_request_id)).size).toBe(4)
  expect(requests.map((body) => body.batch)).toEqual([
    expect.objectContaining({ slot_index: 1, slot_count: 4 }),
    expect.objectContaining({ slot_index: 2, slot_count: 4 }),
    expect.objectContaining({ slot_index: 3, slot_count: 4 }),
    expect.objectContaining({ slot_index: 4, slot_count: 4 }),
  ])
  expect(requests.map((body) => body.output_count)).toEqual([4, 4, 4, 4])
  expect(new Set(requests.map((body) => (body.batch as Record<string, unknown>).batch_id)).size).toBe(1)

  const batchNodes = state.documents[FIRST_CANVAS_ID].nodes.filter((node) => {
    const parameters = (node.content as Record<string, unknown>).generation_parameters as Record<string, unknown> | undefined
    return Boolean((parameters?.image as Record<string, unknown> | undefined)?.batch)
  })
  expect(batchNodes).toHaveLength(4)
  expect(batchNodes.find((node) => node.id === 'generation-cover')).toBeTruthy()
  expect(batchNodes.map((node) => ((node.content as Record<string, unknown>).generation_parameters as { image: { batch: { slot_index: number } } }).image.batch.slot_index).sort()).toEqual([1, 2, 3, 4])
  await mkdir(T6_013_EVIDENCE_DIRECTORY, { recursive: true })
  await writeFile(
    resolve(T6_013_EVIDENCE_DIRECTORY, 'multi-image-request-and-projection.json'),
    JSON.stringify({
      requests: requests.map((body) => ({
        canvas_node_id: body.canvas_node_id,
        output_count: body.output_count,
        batch: body.batch,
      })),
      projectedSlots: batchNodes.map((node) => ({
        nodeId: node.id,
        parameters: (node.content as Record<string, unknown>).generation_parameters,
      })),
    }, null, 2),
    'utf8',
  )

  const accessibility = await new AxeBuilder({ page }).include('.canvas-workspace').analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true })
  const closeDetails = page.getByRole('button', { name: '关闭节点详情' })
  if (await closeDetails.count()) await closeDetails.click()
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+0')
  await page.screenshot({ path: resolve(EVIDENCE_DIRECTORY, 'image-batch-four-cards-1440x900.png'), fullPage: true })
  await page.screenshot({
    path: resolve(T6_013_EVIDENCE_DIRECTORY, 'multi-image-four-card-projection-1440x900.png'),
    fullPage: true,
  })

  await page.reload()
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => {
    const parameters = (node.content as Record<string, unknown>).generation_parameters as Record<string, unknown> | undefined
    return Boolean((parameters?.image as Record<string, unknown> | undefined)?.batch)
  })).toHaveLength(4)
})

test('a failed batch slot retries only its own card with a new request id after reload', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  state.quotas.image = 4
  state.generationFailureSlots = [3]
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成', exact: true }).click()
  await page.getByRole('region', { name: '生成参数' }).getByRole('radio', { name: '4 张' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(4)

  const slotNode = (slotIndex: number) => state.documents[FIRST_CANVAS_ID].nodes.find((node) => {
    const parameters = (node.content as Record<string, unknown>).generation_parameters as { image?: { batch?: { slot_index?: number } } } | undefined
    return parameters?.image?.batch?.slot_index === slotIndex
  })!
  const successfulTaskIds = state.tasks.filter((task) => task.status === 'succeeded' && String(task.id).startsWith('task-success')).map((task) => task.id)
  expect(successfulTaskIds).toHaveLength(3)
  const firstRun = state.requests.filter((item) => item.path === '/api/image-generate').map((item) => item.body!)
  const failedNodeId = String(firstRun.find((body) => (body.batch as Record<string, unknown>).slot_index === 3)!.canvas_node_id)
  await expect.poll(() => (
    (slotNode(3).content as Record<string, unknown>).active_generation_job_id
  )).toBeTruthy()
  const firstFailedRequestId = firstRun.find((body) => body.canvas_node_id === failedNodeId)!.client_request_id
  const nodeCount = state.documents[FIRST_CANVAS_ID].nodes.length

  state.generationFailureSlots = []
  await page.reload()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  const failedTitle = (slotNode(3).content as Record<string, unknown>).title
  const failedTitleIndex = state.documents[FIRST_CANVAS_ID].nodes.filter((node) => (
    (node.content as Record<string, unknown>).title === failedTitle
  )).findIndex((node) => node.id === failedNodeId)
  expect(failedTitleIndex).toBeGreaterThanOrEqual(0)
  await page.getByRole('button', { name: `选择并定位 ${failedTitle}`, exact: true }).nth(failedTitleIndex).click()
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(5)
  const retry = state.requests.filter((item) => item.path === '/api/image-generate').at(-1)!.body!
  expect(retry.canvas_node_id).toBe(failedNodeId)
  expect(retry.batch).toEqual(expect.objectContaining({ slot_index: 3, slot_count: 4 }))
  expect(retry.output_count).toBe(4)
  expect(retry.client_request_id).not.toBe(firstFailedRequestId)
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(nodeCount)
  for (const slotIndex of [1, 2, 4]) {
    expect(state.requests.filter((item) => item.body?.canvas_node_id === slotNode(slotIndex).id)).toHaveLength(1)
  }
})

test('batch preflight disables submission when quota is below the selected output count', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  state.quotas.image = 3
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成', exact: true }).click()
  await page.getByRole('region', { name: '生成参数' }).getByRole('radio', { name: '4 张' }).click()
  await expect(page.getByRole('group', { name: '生成提交摘要' })).toContainText('输出4 个')
  await expect(page.getByRole('button', { name: '开始图片生成' })).toBeDisabled()
  expect(state.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(0)
})
