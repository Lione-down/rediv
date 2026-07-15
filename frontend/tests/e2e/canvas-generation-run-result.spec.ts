import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-028-run-result')

async function selectGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()
  await page.getByText('运行记录').click()
}

test('verified succeeded run selects its canonical result without document mutation', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await selectGeneration(page)
  const patchBaseline = documentPatches(state).length

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'verified-run-action-1440x900.png'), fullPage: true })

  await page.getByRole('button', { name: '检查 Run 1 结果' }).click()
  await expect(page.getByRole('complementary', { name: '节点详情 历史图片生成结果' })).toBeVisible()
  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('封面生成')
  expect(documentPatches(state)).toHaveLength(patchBaseline)

  await page.screenshot({ path: resolve(evidenceDirectory, 'verified-result-1440x900.png'), fullPage: true })
})

test('missing and mismatched succeeded results remain honest status-only rows', async ({ page }) => {
  const missingState = createResourceMockState()
  missingState.documents[FIRST_CANVAS_ID].connections[0].status = 'deleted'
  await openResourceWorkspace(page, missingState)
  await selectGeneration(page)
  await expect(page.getByText('结果未写入当前画布')).toBeVisible()
  await expect(page.getByRole('button', { name: /检查 Run .* 结果/ })).toHaveCount(0)

  const mismatchState = createResourceMockState()
  mismatchState.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing')!.content = {
    ...(mismatchState.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing')!.content as Record<string, unknown>),
    source_task_id: 'task-from-another-run',
  }
  await openResourceWorkspace(page, mismatchState)
  await selectGeneration(page)
  await expect(page.getByText('结果未写入当前画布')).toBeVisible()
  await expect(page.getByRole('button', { name: /检查 Run .* 结果/ })).toHaveCount(0)
})

test('ambiguous duplicate results expose no arbitrary action and readonly inspection stays safe', async ({ page }) => {
  const ambiguousState = createResourceMockState()
  const document = ambiguousState.documents[FIRST_CANVAS_ID]
  const duplicate = structuredClone(document.nodes.find((node) => node.id === 'result-existing')!)
  duplicate.id = 'result-duplicate'
  duplicate.position_y = 430
  document.nodes.push(duplicate)
  document.connections.push({
    ...structuredClone(document.connections[0]),
    id: 'connection-duplicate-result',
    target_node_id: 'result-duplicate',
  })
  await openResourceWorkspace(page, ambiguousState)
  await selectGeneration(page)
  await expect(page.getByText('结果关联不明确')).toBeVisible()
  await expect(page.getByRole('button', { name: /检查 Run .* 结果/ })).toHaveCount(0)

  const readonlyState = createResourceMockState()
  await openResourceWorkspace(page, readonlyState, { width: 375, height: 812 })
  await selectGeneration(page)
  const patchBaseline = documentPatches(readonlyState).length
  await page.getByRole('button', { name: '检查 Run 1 结果' }).click()
  await expect(page.getByRole('complementary', { name: '节点详情 历史图片生成结果' })).toBeVisible()
  expect(documentPatches(readonlyState)).toHaveLength(patchBaseline)
})
