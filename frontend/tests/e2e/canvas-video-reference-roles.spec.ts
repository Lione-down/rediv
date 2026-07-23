import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
} from './canvas-resource-generation-fixture'

const NOW = '2026-07-14T08:00:00Z'
const EVIDENCE_DIRECTORY = resolve(process.cwd(), '..', 'output', 'playwright', 't6-004')

function addNineReferenceVideo(state: ReturnType<typeof createResourceMockState>) {
  const document = state.documents[FIRST_CANVAS_ID]
  const existing = document.nodes.find((node) => node.id === 'result-existing')!
  const sources = Array.from({ length: 9 }, (_, offset) => {
    const index = offset + 1
    const assetId = `asset-role-${index}`
    const nodeId = `result-role-${index}`
    state.assets.push({
      id: assetId, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: FIRST_CANVAS_ID,
      canvas_node_id: nodeId, type: 'image', url: `https://media.revid.test/role-${index}.png`, content_text: null,
      source: 'generation', source_model: 'mock-image-v1', source_task_id: `task-role-${index}`, status: 'active',
      created_at: NOW, updated_at: NOW,
    })
    const source = structuredClone(existing)
    source.id = nodeId
    source.position_x = 120 + (offset % 3) * 380
    source.position_y = 500 + Math.floor(offset / 3) * 240
    source.content = {
      ...(source.content as Record<string, unknown>), title: `参考图 ${index}`, asset_id: assetId,
      source_task_id: `task-role-${index}`, url: `https://media.revid.test/role-${index}.png`,
    }
    document.nodes.push(source)
    return source
  })
  const video = structuredClone(document.nodes.find((node) => node.id === 'generation-cover')!)
  video.id = 'generation-nine-reference-video'
  video.position_x = 1320
  video.position_y = 500
  video.content = {
    title: '九参考视频', subtype: 'video', serialization_version: 1, text: '按明确顺序使用九条视频参考。',
    generation_status: 'idle',
    generation_parameters: { schema_version: 1, video: { duration_seconds: 5, reference_bindings: [] } },
  }
  document.nodes.push(video)
  sources.forEach((source, offset) => document.connections.push({
    id: `connection-role-${offset + 1}`, project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID,
    source_node_id: source.id, source_port: 'out', target_node_id: video.id, target_port: 'media',
    status: 'active', metadata: { input_order: offset + 1 }, created_at: NOW, updated_at: NOW,
  }))
  return { sources, video }
}

test('video roles enforce one ordered nine-entry budget, persist reorder, and become readonly at 375px', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  const { sources, video } = addNineReferenceVideo(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 九参考视频', exact: true }).click()
  const controls = page.getByRole('region', { name: '生成参数' })
  for (let index = 1; index <= 9; index += 1) {
    await controls.getByRole('checkbox', { name: `参考图 ${index} 普通参考` }).check()
  }
  await expect(controls).toContainText('已用 9/9')
  await expect(controls.getByRole('checkbox', { name: '参考图 1 首帧' })).toBeDisabled()

  await controls.getByRole('button', { name: '前移 参考图 9 普通参考' }).click()
  const savedBindings = () => {
    const saved = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === video.id)!
    return (((saved.content as Record<string, unknown>).generation_parameters as { video: { reference_bindings: Array<Record<string, unknown>> } }).video.reference_bindings)
  }
  await expect.poll(() => savedBindings().map((binding) => binding.node_id)).toEqual([
    ...sources.slice(0, 7).map((source) => source.id), sources[8].id, sources[7].id,
  ])
  const bindings = savedBindings()
  expect(bindings.map((binding) => binding.node_id)).toEqual([
    ...sources.slice(0, 7).map((source) => source.id), sources[8].id, sources[7].id,
  ])
  expect(bindings.map((binding) => binding.order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])

  await page.reload()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 九参考视频', exact: true }).click()
  await expect(page.getByRole('region', { name: '生成参数' })).toContainText('已用 9/9')
  const accessibility = await new AxeBuilder({ page }).include('.canvas-workspace').analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({ path: resolve(EVIDENCE_DIRECTORY, 'video-nine-references-1440x900.png'), fullPage: true })
  await page.getByRole('button', { name: '开始视频生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/video-generate')?.body?.video_references).toEqual(bindings)

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toHaveAttribute('aria-description', '只读审阅模式')
  await expect(page.getByRole('region', { name: '生成参数' }).getByRole('checkbox')).toHaveCount(0)
  await expect(page.getByRole('region', { name: '生成参数' })).toContainText('已用 9/9')
  await page.screenshot({ path: resolve(EVIDENCE_DIRECTORY, 'video-nine-references-readonly-375x812.png'), fullPage: true })
})

test('v6 card generation preserves structured roles instead of writing a legacy reference mode', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  addNineReferenceVideo(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 九参考视频', exact: true }).click()
  const controls = page.getByRole('region', { name: '生成参数' })
  await controls.getByRole('checkbox', { name: '参考图 1 首帧' }).check()
  await controls.getByRole('checkbox', { name: '参考图 2 尾帧' }).check()
  await expect(controls).toContainText('已用 2/9')
  await expect.poll(() => ((((state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    node.id === 'generation-nine-reference-video'
  ))!.content as Record<string, unknown>).generation_parameters as {
    video: { reference_bindings: Array<Record<string, unknown>> }
  }).video.reference_bindings).length)).toBe(2)
  const before = structuredClone((((state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    node.id === 'generation-nine-reference-video'
  ))!.content as Record<string, unknown>).generation_parameters as {
    video: { reference_bindings: Array<Record<string, unknown>> }
  }).video.reference_bindings))

  const workSurface = page.getByRole('region', { name: /卡片工作区/ })
  await workSurface.getByRole('button', { name: '在当前卡片生成' }).evaluate((element: HTMLButtonElement) => element.click())
  await expect.poll(() => (((state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    node.id === 'generation-nine-reference-video'
  ))!.content as Record<string, unknown>).generation_parameters as { video: Record<string, unknown> }).video)).toEqual(
    expect.objectContaining({ reference_bindings: before }),
  )
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)

  const persistedVideo = (((state.documents[FIRST_CANVAS_ID].nodes.find((node) => (
    node.id === 'generation-nine-reference-video'
  ))!.content as Record<string, unknown>).generation_parameters as {
    video: Record<string, unknown>
  }).video)
  expect(persistedVideo.reference_bindings).toEqual(before)
  expect(persistedVideo).not.toHaveProperty('reference_mode')
  expect(state.requests.find((item) => item.path === '/api/video-generate')?.body?.video_references).toEqual(before)
})
