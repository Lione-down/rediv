import { expect, test, type Page } from '@playwright/test'
import {
  FIRST_CANVAS_ID,
  createResourceMockState,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

async function selectNode(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

test('distinct image and video nodes submit concurrently with node-local locks and unique request IDs', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  const sourceContent = source.content as Record<string, unknown>
  const variants = [
    ['generation-image-b', '图片生成 B', 'image', 560],
    ['generation-video-a', '视频生成 A', 'video', 940],
    ['generation-video-b', '视频生成 B', 'video', 1320],
  ] as const
  for (const [id, title, subtype, positionX] of variants) {
    state.documents[FIRST_CANVAS_ID].nodes.push({
      ...source,
      id,
      content: { ...sourceContent, title, subtype, text: `${title} prompt`, generation_status: 'idle', generation_task_id: null },
      position_x: positionX,
    })
  }
  let releaseGeneration!: () => void
  state.generationGate = new Promise<void>((resolve) => { releaseGeneration = resolve })
  await openResourceWorkspace(page, state)

  for (const title of ['封面生成', '图片生成 B', '视频生成 A', '视频生成 B'] as const) {
    await selectNode(page, title)
    const prompt = page.getByRole('textbox', { name: '卡片生成提示词' })
    await expect(prompt).toBeEnabled()
    await prompt.fill(`${title} concurrent prompt`)
    const button = page.getByRole('button', { name: '在当前卡片生成' })
    await expect(button).toBeEnabled()
    await button.click()
    await expect(button).toBeDisabled()
  }

  await expect.poll(() => state.requests.filter((request) => (
    request.method === 'POST' && ['/api/image-generate', '/api/video-generate'].includes(request.path)
  )).length).toBe(4)
  const requestIds = state.requests.filter((request) => (
    request.method === 'POST' && ['/api/image-generate', '/api/video-generate'].includes(request.path)
  )).map((request) => request.body?.client_request_id)
  expect(new Set(requestIds).size).toBe(4)
  for (const requestId of requestIds) expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

  releaseGeneration()
  await expect.poll(() => state.generationCount).toBe(4)
})
