import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createVisualState,
  installMockApi,
} from './authenticated-workflow-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'
const T6_013_EVIDENCE_DIRECTORY = resolve(
  process.cwd(),
  '..',
  'output',
  'playwright',
  't6-013-sixth-candidate',
)
const T6_013_EIGHTH_EVIDENCE_DIRECTORY = resolve(
  process.cwd(),
  '..',
  'output',
  'playwright',
  't6-013-eighth-candidate',
)
const T6_013_NINTH_EVIDENCE_DIRECTORY = resolve(
  process.cwd(),
  '..',
  'output',
  'playwright',
  't6-013-ninth-candidate',
)
const T6_013_TENTH_EVIDENCE_DIRECTORY = resolve(
  process.cwd(),
  '..',
  'output',
  'playwright',
  't6-013-tenth-candidate',
)
const T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY = resolve(
  T6_013_TENTH_EVIDENCE_DIRECTORY,
  'libtv-script-video-20260727',
)

async function svgPathScreenEndpoint(
  locator: import('@playwright/test').Locator,
  endpoint: 'start' | 'end',
) {
  return locator.evaluate((element, target) => {
    const path = element as SVGPathElement
    const length = path.getTotalLength()
    const point = path.getPointAtLength(target === 'start' ? 0 : length)
    const matrix = path.getScreenCTM()
    if (!matrix) throw new Error('SVG path has no screen transform')
    const projected = new DOMPoint(point.x, point.y).matrixTransform(matrix)
    return { x: projected.x, y: projected.y }
  }, endpoint)
}

test('replacement workbench owns the complete Canvas shell without the old visible runtime', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await expect(runtime).toHaveCount(1)
  await expect(runtime).toHaveAttribute('data-runtime-state', 'ready')

  const runtimeBox = await runtime.boundingBox()
  expect(runtimeBox).not.toBeNull()
  expect(runtimeBox?.x).toBeLessThanOrEqual(1)
  expect(runtimeBox?.y).toBeLessThanOrEqual(1)
  expect(runtimeBox?.width).toBeGreaterThanOrEqual(1438)
  expect(runtimeBox?.height).toBeGreaterThanOrEqual(898)

  await expect(runtime.getByRole('navigation', { name: '项目与画布' })).toBeVisible()
  await expect(runtime.getByRole('group', { name: '画布视图' })).toBeVisible()
  await expect(runtime.getByRole('group', { name: '画布协作与账户' })).toBeVisible()
  await expect(runtime.getByRole('toolbar', { name: '画布创作工具' })).toBeVisible()
  await expect(runtime.getByRole('group', { name: '资源与视图控制' })).toBeVisible()

  await expect(page.locator('.canvas-identity-bar')).toHaveCount(0)
  await expect(page.locator('.canvas-stage')).toHaveCount(0)
  await expect(page.locator('.context-panel-shell')).toHaveCount(0)
  await expect(page.locator('.canvas-runtime-card')).toHaveCount(0)
  await expect(page.locator('[role="complementary"]')).toHaveCount(0)

  expect(
    state.authenticatedRequests.filter((request) =>
      request.startsWith('PATCH ') || request.startsWith('POST ') || request.startsWith('DELETE '),
    ),
  ).toEqual([])
})

test('replacement Script workflow preserves an actionable structured backend 500 without raw Axios copy', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasNodes.push({
    id: 'node-script-error',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'script',
    content: {
      title: '脚本',
      subtype: 'script',
      serialization_version: 1,
      text: '保留当前已验证脚本',
    },
    position_x: 820,
    position_y: 120,
    width: 340,
    height: 220,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.route('**/api/text-generate', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          code: 'provider_result_invalid',
          message: '模型返回的脚本或分镜结构无效，请调整生成要求后重试。',
          retryable: false,
        },
      }),
    })
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-script-error"] [data-node-body]').click()
  const composer = runtime.locator('[data-node-composer][data-composer-kind="script"]')
  const modelSelector = composer.getByRole('combobox', { name: '选择脚本模型' })
  await expect(modelSelector).toHaveValue('agnes-2.0-flash')
  await expect(modelSelector.locator('option')).toHaveText(['Agnes 2.0 Flash', 'Agnes 2.5 Flash'])
  await expect(composer).toContainText('剩余 5 quota')

  await composer.getByRole('textbox').fill('根据当前脚本生成完整故事脚本')
  await composer.getByRole('button', { name: '生成分镜' }).click()
  await expect(composer.getByRole('alert')).toContainText('模型返回的脚本或分镜结构无效，请调整生成要求后重试。')
  await expect(composer).not.toContainText('Request failed with status code 500')
  await mkdir(T6_013_NINTH_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_NINTH_EVIDENCE_DIRECTORY, 'script-actionable-500-1440x900.png'),
  })
  expect(
    (state.canvasNodes.find((node) => node.id === 'node-script-error')?.content as Record<string, unknown>).text,
  ).toBe('保留当前已验证脚本')
})

test('terminal image result keeps loading through recovery and projects media before completion', async ({
  page,
}) => {
  const state = createVisualState()
  const imageNode = state.canvasNodes.find((node) => node.id === 'node-image')!
  imageNode.content = {
    ...(imageNode.content as Record<string, unknown>),
    active_generation_job_id: 'job-image-recovery',
    active_generation_media_type: 'image',
  }
  state.generationTasks.push({
    id: 'job-image-recovery',
    user_id: 'user-e2e',
    project_id: 'project-e2e',
    origin_canvas_id: 'canvas-first',
    canvas_node_id: 'node-image',
    media_type: 'image',
    provider: 'mock',
    model: 'agnes-image-2.1-flash',
    client_request_id: '00000000-0000-4000-8000-000000000888',
    request_fingerprint: '8'.repeat(64),
    status: 'succeeded',
    duration_ms: 10,
    result_asset_id: 'asset-image-recovery',
    error_code: null,
    error_message: null,
    request_parameters: {},
    created_at: '2026-07-26T08:00:00Z',
    updated_at: '2026-07-26T08:00:00Z',
  })
  const imageUrl =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%224%22%3E%3Crect width=%224%22 height=%224%22 fill=%22%23946cff%22/%3E%3C/svg%3E'
  let resultReads = 0
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.route('**/api/v2/generation-jobs/job-image-recovery/result', async (route) => {
    resultReads += 1
    if (resultReads === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'result persistence is still converging' }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        job_id: 'job-image-recovery',
        node_id: 'node-image',
        result: {
          asset_id: 'asset-image-recovery',
          media_type: 'image',
          url: imageUrl,
        },
        version: 1,
      }),
    })
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const card = runtime.locator('[data-runtime-node="node-image"]')
  await expect.poll(() => resultReads).toBeGreaterThanOrEqual(1)
  await expect(card).toHaveAttribute('data-boundary-loading', 'true')
  await expect(card.locator('[data-runtime-lifecycle]')).toHaveCount(0)
  await expect(card.locator('[data-media-state="placeholder"]')).toBeVisible()
  await mkdir(T6_013_EIGHTH_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_EIGHTH_EVIDENCE_DIRECTORY, 'image-result-recovery-loading-1440x900.png'),
  })

  await expect(card.locator('img')).toHaveAttribute('src', imageUrl, { timeout: 8_000 })
  await expect(card).not.toHaveAttribute('data-boundary-loading', 'true')
  await expect(card.locator('[data-node-body]')).toHaveAttribute('data-media-state', 'image')
  await page.screenshot({
    path: resolve(T6_013_EIGHTH_EVIDENCE_DIRECTORY, 'image-result-projected-1440x900.png'),
  })
  expect(resultReads).toBeGreaterThanOrEqual(2)
  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-image')?.content
  )).toEqual(expect.objectContaining({
    result_asset_id: 'asset-image-recovery',
    asset_url: imageUrl,
    last_generation_job_id: 'job-image-recovery',
  }))
})

test('replacement projects a legacy completed image result onto its initiating card', async ({
  page,
}) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  const result = state.canvasNodes.find((node) => node.id === 'node-result')!
  const imageUrl =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22284%22%3E%3Crect width=%22160%22 height=%22284%22 fill=%22%236f4cff%22/%3E%3C/svg%3E'
  source.status = 'succeeded'
  source.content = {
    ...(source.content as Record<string, unknown>),
    generation_status: 'succeeded',
    generation_task_id: 'task-legacy-complete',
    result_materialized_task_id: 'task-legacy-complete',
  }
  result.content = {
    ...(result.content as Record<string, unknown>),
    asset_id: 'asset-legacy-complete',
    source_task_id: 'task-legacy-complete',
    url: imageUrl,
    width: 160,
    height: 284,
    aspect_ratio: 9 / 16,
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const card = runtime.locator('[data-runtime-node="node-image"]')
  await expect(card).toHaveAttribute('data-runtime-phase', 'succeeded')
  await expect(card.locator('[data-media-state="placeholder"]')).toHaveCount(0)
  await expect(card.locator('[data-node-body]')).toHaveAttribute('data-media-state', 'image')
  await expect(card.locator('img')).toHaveAttribute('src', imageUrl)
  await expect(card.locator('img')).toHaveCSS('object-fit', 'contain')
  await expect(card.locator('[data-runtime-lifecycle]')).toHaveCount(0)
  await expect.poll(async () => {
    const box = await card.boundingBox()
    return box ? box.width / box.height : null
  }, {
    message: 'T6-013 RED [portrait-result-geometry-absent]',
  }).toBeCloseTo(9 / 16, 2)
  await mkdir(T6_013_TENTH_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_TENTH_EVIDENCE_DIRECTORY, 'portrait-image-success-1440x900.png'),
  })
})

test('replacement node layer uses external identity and media-first bodies without old card chrome', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await expect(runtime).toHaveAttribute('data-runtime-state', 'ready')
  await expect(runtime.locator('[data-runtime-node]')).toHaveCount(1)

  const imageNode = runtime.locator('[data-runtime-node="node-image"]')
  const imageIdentity = imageNode.locator('[data-node-identity]')
  const imageBody = imageNode.locator('[data-node-body]')
  await expect(imageIdentity).toContainText('生成封面')
  await expect(imageIdentity).toContainText('图片生成')
  await expect(imageBody).not.toContainText('图片生成图片生成')
  await expect(imageBody).toHaveAttribute('data-media-state', 'placeholder')

  const identityBox = await imageIdentity.boundingBox()
  const bodyBox = await imageBody.boundingBox()
  expect(identityBox).not.toBeNull()
  expect(bodyBox).not.toBeNull()
  expect(identityBox!.y + identityBox!.height).toBeLessThanOrEqual(bodyBox!.y)
  expect(bodyBox!.width).toBeGreaterThanOrEqual(330)
  expect(bodyBox!.height).toBeGreaterThanOrEqual(210)

  const legacyResult = runtime.locator('[data-runtime-node="node-result"]')
  await expect(legacyResult).toHaveCount(0)
  expect(state.canvasNodes.some((node) => node.id === 'node-result')).toBe(true)

  await expect(runtime.locator('[role="toolbar"][aria-label="画布创作工具"] [data-tool]')).toHaveCount(6)
  await expect(runtime.locator('[data-tool="audio-generation"]')).toBeDisabled()
  await expect(runtime.getByRole('button', { name: /导演|Director/i })).toHaveCount(0)
  await expect(runtime.getByRole('button', { name: /创建结果|Result/i })).toHaveCount(0)
})

test('selection owns one contextual toolbar and one collision-safe attached composer', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const imageNode = runtime.locator('[data-runtime-node="node-image"]')
  await imageNode.locator('[data-node-body]').click()

  await expect(imageNode).toHaveAttribute('data-selected', 'true')
  const toolbar = runtime.locator('[data-node-toolbar]')
  const composer = runtime.locator('[data-node-composer]')
  await expect(toolbar).toHaveCount(1)
  await expect(composer).toHaveCount(1)
  await expect(toolbar).toHaveAttribute('data-owner-node-id', 'node-image')
  await expect(composer).toHaveAttribute('data-owner-node-id', 'node-image')

  const bodyBox = await imageNode.locator('[data-node-body]').boundingBox()
  const toolbarBox = await toolbar.boundingBox()
  const composerBox = await composer.boundingBox()
  expect(bodyBox).not.toBeNull()
  expect(toolbarBox).not.toBeNull()
  expect(composerBox).not.toBeNull()
  expect(toolbarBox!.x).toBeGreaterThanOrEqual(bodyBox!.x + bodyBox!.width + 8)
  expect(composerBox!.y).toBeGreaterThanOrEqual(bodyBox!.y + bodyBox!.height + 8)
  expect(composerBox!.width).toBeGreaterThanOrEqual(500)

  await runtime.locator('[data-canvas-world]').click({ position: { x: 1100, y: 650 } })
  await expect(toolbar).toHaveCount(0)
  await expect(composer).toHaveCount(0)

  expect(
    state.authenticatedRequests.filter((request) => request.startsWith('PATCH ')),
  ).toEqual([])
})

test('direct text edit, card drag, and Canvas pan have separate pointer ownership', async ({
  page,
}) => {
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
      text: '海风吹过空旷的沙滩。',
    },
    position_x: 1030,
    position_y: 180,
    width: 300,
    height: 160,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const textNode = runtime.locator('[data-runtime-node="node-text"]')
  await textNode.locator('[data-node-body]').dblclick()
  const editor = textNode.locator('[data-direct-editor]')
  await expect(editor).toBeVisible()
  await expect(runtime).toHaveAttribute('data-interaction-state', 'direct-edit')

  const textBoxBefore = await textNode.boundingBox()
  await editor.fill('海风吹过空旷的沙滩，远处灯塔亮起。')
  await editor.press('Tab')
  await expect(runtime).toHaveAttribute('data-interaction-state', 'idle')
  const textBoxAfter = await textNode.boundingBox()
  expect(textBoxAfter).toEqual(textBoxBefore)

  const imageNode = runtime.locator('[data-runtime-node="node-image"]')
  const imageBoxBefore = await imageNode.boundingBox()
  const dragHandle = imageNode.locator('[data-node-drag-handle]')
  const dragHandleBox = await dragHandle.boundingBox()
  expect(imageBoxBefore).not.toBeNull()
  expect(dragHandleBox).not.toBeNull()
  await page.mouse.move(
    dragHandleBox!.x + dragHandleBox!.width / 2,
    dragHandleBox!.y + dragHandleBox!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    dragHandleBox!.x + dragHandleBox!.width / 2 + 72,
    dragHandleBox!.y + dragHandleBox!.height / 2 + 36,
    { steps: 4 },
  )
  await expect(runtime).toHaveAttribute('data-interaction-state', 'card-drag')
  await page.mouse.up()
  await expect(runtime).toHaveAttribute('data-interaction-state', 'idle')

  const imageBoxAfterDrag = await imageNode.boundingBox()
  expect(imageBoxAfterDrag).not.toBeNull()
  expect(Math.round(imageBoxAfterDrag!.x - imageBoxBefore!.x)).toBe(72)
  expect(Math.round(imageBoxAfterDrag!.y - imageBoxBefore!.y)).toBe(36)

  const imageBoxBeforePan = await imageNode.boundingBox()
  await page.keyboard.down('Space')
  await page.mouse.move(1180, 690)
  await page.mouse.down()
  await page.mouse.move(1228, 722, { steps: 4 })
  await expect(runtime).toHaveAttribute('data-interaction-state', 'canvas-pan')
  await page.mouse.up()
  await page.keyboard.up('Space')
  await expect(runtime).toHaveAttribute('data-interaction-state', 'idle')
  const imageBoxAfterPan = await imageNode.boundingBox()
  expect(Math.round(imageBoxAfterPan!.x - imageBoxBeforePan!.x)).toBe(48)
  expect(Math.round(imageBoxAfterPan!.y - imageBoxBeforePan!.y)).toBe(32)
})

test('compact Script node explicitly opens and closes a structured full-Canvas workspace', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasNodes.push({
    id: 'node-script',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'script',
    content: {
      title: '夏日短片脚本',
      subtype: 'script',
      serialization_version: 1,
      text: '海边相遇，随后踏上寻找灯塔的旅程。',
    },
    position_x: 280,
    position_y: 490,
    width: 360,
    height: 150,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const scriptNode = runtime.locator('[data-runtime-node="node-script"]')
  const nodeBoxBefore = await scriptNode.boundingBox()
  await scriptNode.getByRole('button', { name: '打开结构化脚本' }).click()

  const workspace = runtime.locator('[data-script-workspace]')
  await expect(workspace).toBeVisible()
  const workspaceBox = await workspace.boundingBox()
  expect(workspaceBox).not.toBeNull()
  expect(workspaceBox!.x).toBeLessThanOrEqual(1)
  expect(workspaceBox!.y).toBeLessThanOrEqual(1)
  expect(workspaceBox!.width).toBeGreaterThanOrEqual(1438)
  expect(workspaceBox!.height).toBeGreaterThanOrEqual(898)
  await expect(workspace.getByRole('columnheader', { name: '镜号' })).toBeVisible()
  await expect(workspace.getByRole('columnheader', { name: '画面描述' })).toBeVisible()
  await expect(workspace.getByRole('columnheader', { name: '对白/旁白' })).toBeVisible()
  await expect(workspace.getByRole('columnheader', { name: '时长' })).toBeVisible()

  await workspace.getByRole('button', { name: '返回画布' }).click()
  await expect(workspace).toHaveCount(0)
  await expect(scriptNode).toHaveAttribute('data-selected', 'true')
  expect(await scriptNode.boundingBox()).toEqual(nodeBoxBefore)
  expect(
    state.authenticatedRequests.filter((request) => request.startsWith('PATCH ')),
  ).toEqual([])
})

test('composer renders persistent inline references and explicit ordered Video modes', async ({
  page,
}) => {
  const state = createVisualState()
  const imageNode = state.canvasNodes.find((node) => node.id === 'node-image')!
  imageNode.content = {
    ...(imageNode.content as Record<string, unknown>),
    card_configuration: {
      schema_version: 1,
      generation_mode: 'text-to-image',
      model_id: 'mock-image-model',
      prompt_document: {
        schema_version: 1,
        segments: [
          { kind: 'text', text: '参考 ' },
          { kind: 'reference', stable_id: 'node-ref-a', asset_id: 'asset-ref-a' },
          { kind: 'text', text: ' 与 ' },
          { kind: 'reference', stable_id: 'node-ref-b', asset_id: 'asset-ref-b' },
        ],
      },
      references: [
        {
          stable_id: 'node-ref-a',
          asset_id: 'asset-ref-a',
          display_name: '日落海面',
          thumbnail_url: 'https://example.invalid/sunset.webp',
          source_revision: 3,
          role: 'reference',
          order: 0,
        },
        {
          stable_id: 'node-ref-b',
          asset_id: 'asset-ref-b',
          display_name: '人物背影',
          thumbnail_url: 'https://example.invalid/person.webp',
          source_revision: 5,
          role: 'reference',
          order: 1,
        },
      ],
    },
  }
  state.canvasNodes.push({
    id: 'node-video',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'generation',
    content: {
      title: '灯塔转场',
      subtype: 'video',
      serialization_version: 1,
      text: '镜头从海面缓慢推进到灯塔。',
      card_configuration: {
        schema_version: 1,
        generation_mode: 'keyframes',
        model_id: 'mock-video-model',
        prompt_document: { schema_version: 1, segments: [] },
        references: [
          {
            stable_id: 'node-first',
            asset_id: 'asset-first',
            display_name: '起始海面',
            thumbnail_url: 'https://example.invalid/first.webp',
            source_revision: 2,
            role: 'first-frame',
            order: 0,
          },
          {
            stable_id: 'node-last',
            asset_id: 'asset-last',
            display_name: '结束灯塔',
            thumbnail_url: 'https://example.invalid/last.webp',
            source_revision: 4,
            role: 'last-frame',
            order: 1,
          },
        ],
      },
    },
    position_x: 760,
    position_y: 470,
    width: 380,
    height: 214,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  const imageComposer = runtime.locator('[data-node-composer]')
  const imageTokens = imageComposer.locator('[data-reference-token]')
  await expect(imageTokens).toHaveCount(2)
  await expect(imageTokens.nth(0)).toContainText('1')
  await expect(imageTokens.nth(0)).toContainText('日落海面')
  await expect(imageTokens.nth(0)).toHaveAttribute('data-reference-role', 'reference')
  await expect(imageTokens.nth(1)).toContainText('2')
  await expect(imageTokens.nth(1)).toContainText('人物背影')

  await runtime.locator('[data-runtime-node="node-video"] [data-node-body]').click()
  const videoComposer = runtime.locator('[data-node-composer]')
  await expect(videoComposer.locator('[data-video-mode]')).toHaveCount(3)
  await expect(videoComposer.locator('[data-video-mode="keyframes"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(videoComposer.locator('[data-reference-role="first-frame"]')).toContainText('首帧')
  await expect(videoComposer.locator('[data-reference-role="last-frame"]')).toContainText('尾帧')

  await videoComposer.locator('[data-video-mode="text-to-video"]').click()
  await expect(videoComposer.locator('[data-video-mode="text-to-video"]')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-video')?.content as Record<string, unknown>
  )?.card_configuration).toMatchObject({ generation_mode: 'text-to-video' })
})

test('single visible ports acquire connections while persisted SVG edges stay on card boundaries', async ({
  page,
}) => {
  const state = createVisualState()
  const sourceDto = state.canvasNodes.find((node) => node.id === 'node-image')!
  state.canvasNodes.push({
    ...sourceDto,
    id: 'node-target',
    content: {
      title: 'Video Generation',
      subtype: 'video',
      serialization_version: 1,
      text: 'Target',
    },
    position_x: 720,
  })
  state.canvasConnections = [{
    ...state.canvasConnections[0],
    id: 'connection-source-target',
    source_node_id: 'node-image',
    source_port: 'out',
    target_node_id: 'node-target',
    target_port: 'prompt',
  }]
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const source = runtime.locator('[data-runtime-node="node-image"]')
  const target = runtime.locator('[data-runtime-node="node-target"]')
  const sourceOutput = source.locator('[data-visible-port="output"]')
  const sourceInput = source.locator('[data-visible-port="input"]')
  const targetInput = target.locator('[data-visible-port="input"]')
  const edge = runtime.locator('[data-runtime-edge="connection-source-target"]')

  await expect(sourceOutput).toHaveCount(1)
  await expect(sourceInput).toHaveCount(1)
  await expect(sourceInput).toHaveAttribute('data-logical-port-count', '2')
  await expect(sourceInput).toHaveAttribute('data-logical-port-ids', 'prompt,media')
  await expect(targetInput).toHaveCount(1)
  await expect(source.getByText('+', { exact: true })).toHaveCount(2)

  const assertRestEndpoints = async () => {
    const sourceBox = await source.boundingBox()
    const targetBox = await target.boundingBox()
    const start = await svgPathScreenEndpoint(edge, 'start')
    const end = await svgPathScreenEndpoint(edge, 'end')
    expect(sourceBox).not.toBeNull()
    expect(targetBox).not.toBeNull()
    expect(Math.abs(start.x - (sourceBox!.x + sourceBox!.width))).toBeLessThanOrEqual(1)
    expect(Math.abs(start.y - (sourceBox!.y + sourceBox!.height / 2))).toBeLessThanOrEqual(1)
    expect(Math.abs(end.x - targetBox!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(end.y - (targetBox!.y + targetBox!.height / 2))).toBeLessThanOrEqual(1)
  }

  await assertRestEndpoints()
  await source.locator('[data-node-body]').click()
  await expect(edge).toHaveAttribute('data-edge-state', 'selected')
  await assertRestEndpoints()

  const acquisitionBox = await source
    .locator('[data-port-acquisition="output"]')
    .boundingBox()
  expect(acquisitionBox).not.toBeNull()
  const outputCenter = {
    x: acquisitionBox!.x + acquisitionBox!.width / 2,
    y: acquisitionBox!.y + acquisitionBox!.height / 2,
  }
  await page.mouse.move(outputCenter.x, outputCenter.y)
  const acquiredOutputCenter = await sourceOutput.boundingBox()
  expect(acquiredOutputCenter).not.toBeNull()
  const draftAnchor = {
    x: acquiredOutputCenter!.x + acquiredOutputCenter!.width / 2,
    y: acquiredOutputCenter!.y + acquiredOutputCenter!.height / 2,
  }
  await page.mouse.down()
  await page.mouse.move(outputCenter.x + 120, outputCenter.y + 64, { steps: 3 })
  await expect(runtime).toHaveAttribute('data-interaction-state', 'port-drag')
  const draft = runtime.locator('[data-runtime-draft-edge]')
  await expect(draft).toHaveCount(1)
  const draftStart = await svgPathScreenEndpoint(draft, 'start')
  expect(Math.abs(draftStart.x - draftAnchor.x)).toBeLessThanOrEqual(1.5)
  expect(Math.abs(draftStart.y - draftAnchor.y)).toBeLessThanOrEqual(1.5)
  await page.mouse.up()
  await expect(runtime).toHaveAttribute('data-interaction-state', 'idle')
  await expect(draft).toHaveCount(0)

  await runtime.getByRole('button', { name: '放大画布' }).click()
  await expect(runtime.getByRole('status', { name: '当前缩放' })).toHaveText('110%')
  await assertRestEndpoints()
})

test('normal Canvas route cuts over to replacement runtime and creates only the six authoring types', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto('/app/projects/project-e2e/canvases/canvas-first')

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await expect(runtime).toHaveCount(1)
  await expect(page.locator('.canvas-stage')).toHaveCount(0)
  await expect(page.locator('.context-panel-shell')).toHaveCount(0)
  expect(state.authenticatedRequests).not.toContain('GET /api/generation-tasks')

  const originalNodeCount = state.canvasNodes.length
  const originalVisibleNodeCount = state.canvasNodes.filter((node) => node.node_type !== 'result').length
  await runtime.locator('[data-tool="text"]').click()
  await expect(runtime.locator('[data-runtime-node]')).toHaveCount(originalVisibleNodeCount + 1)
  await expect(runtime.locator('[data-runtime-node][data-node-kind="text"]')).toHaveCount(1)

  await runtime.locator('[data-tool="image-generation"]').click()
  await expect(runtime.locator('[data-runtime-node]')).toHaveCount(originalVisibleNodeCount + 2)
  await expect(runtime.locator('[data-runtime-node][data-node-kind="image"]')).toHaveCount(2)

  await expect(runtime.locator('[data-tool="audio-generation"]')).toBeDisabled()
  await expect(runtime.locator('[data-tool="director"]')).toHaveCount(0)
  await expect(runtime.locator('[data-tool="result"]')).toHaveCount(0)
  await expect.poll(() => state.canvasNodes.length).toBe(originalNodeCount + 2)
})

test('replacement shell switches Canvas views and opens utilities without a permanent panel', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto('/app/projects/project-e2e/canvases/canvas-first')

  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.getByRole('button', { name: '选择项目与画布' }).click()
  const canvasMenu = runtime.locator('[data-canvas-menu]')
  await expect(canvasMenu).toBeVisible()
  await expect(canvasMenu.getByRole('button', { name: '画布 1' })).toBeVisible()

  await runtime.getByRole('button', { name: '故事板' }).click()
  await expect(runtime.locator('[data-runtime-storyboard]')).toBeVisible()
  await expect(runtime.locator('[data-canvas-world]')).toBeHidden()
  await runtime.getByRole('button', { name: '工作流' }).click()
  await expect(runtime.locator('[data-canvas-world]')).toBeVisible()

  await runtime.getByRole('button', { name: '打开素材库' }).click()
  const library = runtime.locator('[data-asset-library]')
  await expect(library).toBeVisible()
  await expect(library).toContainText('夏日海边电影海报')
  await expect(page.locator('.context-panel-shell')).toHaveCount(0)
  await library.getByRole('button', { name: '关闭素材库' }).click()
  await expect(library).toHaveCount(0)
})

test('replacement shell uses the existing history and fits all content in the viewport', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const undo = runtime.getByRole('button', { name: '撤销' })
  const redo = runtime.getByRole('button', { name: '重做' })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()

  const originalNodeCount = state.canvasNodes.length
  await runtime.locator('[data-tool="text"]').click()
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect.poll(() => state.canvasNodes.length).toBe(originalNodeCount)
  await expect(redo).toBeEnabled()
  await redo.click()
  await expect.poll(() => state.canvasNodes.length).toBe(originalNodeCount + 1)

  await runtime.getByRole('button', { name: '放大画布' }).click()
  await runtime.getByRole('button', { name: '放大画布' }).click()
  await expect(runtime.getByRole('status', { name: '当前缩放' })).toHaveText('120%')
  await runtime.getByRole('button', { name: '适应全部内容' }).click()

  for (const node of await runtime.locator('[data-runtime-node]').all()) {
    const box = await node.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(16)
    expect(box!.y).toBeGreaterThanOrEqual(70)
    expect(box!.x + box!.width).toBeLessThanOrEqual(1424)
    expect(box!.y + box!.height).toBeLessThanOrEqual(830)
  }
})

test('replacement parameter and model popovers persist through the existing document authority', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  const composer = runtime.locator('[data-node-composer]')

  await composer.getByRole('button', { name: '打开参数' }).click()
  const parameters = composer.locator('[data-runtime-parameter-popover]')
  await expect(parameters).toBeVisible()
  await parameters.getByText('16:9', { exact: true }).click()
  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-image')?.content as Record<string, unknown>
  )?.generation_parameters).toMatchObject({
    schema_version: 1,
    image: { aspect_ratio: '16:9' },
  })

  await composer.getByRole('button', { name: '选择模型' }).click()
  const models = composer.locator('[data-runtime-model-popover]')
  await expect(models).toBeVisible()
  await models.getByRole('button', { name: 'agnes-image-2.1-flash' }).click()
  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-image')?.content as Record<string, unknown>
  )?.card_configuration).toMatchObject({ model_id: 'agnes-image-2.1-flash' })
})

test('replacement image ratio immediately reshapes one stable card through undo redo and reload', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const card = runtime.locator('[data-runtime-node="node-image"]')
  const stableNodeCount = state.canvasNodes.length
  await card.locator('[data-node-body]').click()
  const composer = runtime.locator('[data-node-composer]')
  await composer.getByRole('button', { name: '打开参数' }).click()
  await composer.locator('[data-runtime-parameter-popover]').getByText('9:16', { exact: true }).click()

  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-image')?.content as Record<string, unknown>
  )?.generation_parameters).toMatchObject({
    schema_version: 1,
    image: { aspect_ratio: '9:16' },
  })
  await expect.poll(async () => {
    const box = await card.boundingBox()
    return box ? box.width / box.height : null
  }, {
    message: 'T6-013 RED [replacement-selected-ratio-geometry-absent]',
  }).toBeCloseTo(9 / 16, 2)
  expect(state.canvasNodes).toHaveLength(stableNodeCount)
  expect(state.canvasNodes.filter((node) => node.id === 'node-image')).toHaveLength(1)

  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect.poll(() => {
    const content = state.canvasNodes.find((node) => node.id === 'node-image')
      ?.content as Record<string, unknown> | undefined
    const parameters = content?.generation_parameters as Record<string, unknown> | undefined
    const image = parameters?.image as Record<string, unknown> | undefined
    return image?.aspect_ratio ?? null
  }).not.toBe('9:16')
  await runtime.getByRole('button', { name: '重做' }).click()
  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-image')?.content as Record<string, unknown>
  )?.generation_parameters).toMatchObject({
    image: { aspect_ratio: '9:16' },
  })

  await page.reload()
  const reloaded = page.locator('[data-runtime-node="node-image"]')
  await expect.poll(async () => {
    const box = await reloaded.boundingBox()
    return box ? box.width / box.height : null
  }).toBeCloseTo(9 / 16, 2)
  await mkdir(T6_013_TENTH_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_TENTH_EVIDENCE_DIRECTORY, 'image-9x16-before-generation-1440x900.png'),
    fullPage: true,
  })
})

test('replacement video composer acquires connected references and persists ratio duration and roles', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasNodes = [
    {
      ...state.canvasNodes[0],
      id: 'node-video-reference',
      node_type: 'asset',
      content: {
        title: '人物参考图',
        subtype: 'image',
        serialization_version: 1,
        asset_id: 'asset-video-reference',
        asset_url: 'https://media.revid.test/reference.png',
        url: 'https://media.revid.test/reference.png',
      },
      position_x: 80,
      position_y: 180,
    },
    {
      ...state.canvasNodes[0],
      id: 'node-video-composer',
      content: {
        title: '视频生成',
        subtype: 'video',
        serialization_version: 1,
        text: '镜头缓慢推进。',
        active_generation_job_id: 'task-video-provider-unavailable',
        active_generation_media_type: 'video',
      },
      position_x: 680,
      position_y: 180,
    },
  ]
  state.canvasConnections = [{
    id: 'edge-video-reference',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    source_node_id: 'node-video-reference',
    source_port: 'out',
    target_node_id: 'node-video-composer',
    target_port: 'media',
    status: 'active',
    active: true,
    metadata: { input_order: 1 },
  }]
  state.generationTasks.push({
    id: 'task-video-provider-unavailable',
    user_id: 'user-e2e',
    project_id: 'project-e2e',
    origin_canvas_id: 'canvas-first',
    canvas_node_id: 'node-video-composer',
    media_type: 'video',
    provider: 'mock',
    model: 'agnes-video-1',
    provider_request_id: 'provider-video-failed',
    status: 'failed',
    duration_ms: 10,
    result_asset_id: null,
    error_code: 'provider_unavailable',
    error_message: 'video queue is full, please retry later',
    created_at: '2026-07-27T08:00:00Z',
    updated_at: '2026-07-27T08:00:01Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await expect(
    runtime.locator('[data-runtime-node="node-video-composer"]').getByRole('alert'),
  ).toContainText('video queue is full, please retry later')
  await mkdir(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'video-failure-visible-on-card.png'),
    fullPage: true,
  })
  await runtime.locator('[data-runtime-node="node-video-composer"] [data-node-body]').click()
  const composer = runtime.locator('[data-node-composer]')
  const editor = composer.getByRole('textbox', { name: '卡片生成提示词' })
  await expect(editor, 'T6-013 RED [replacement-video-inline-reference-editor-absent]').toBeVisible()
  await editor.pressSequentially('@')
  const picker = composer.getByRole('listbox', { name: '已连接的可引用素材' })
  await expect(picker).toBeVisible()
  await picker.getByRole('option', { name: '引用 人物参考图' }).click()
  await expect(editor.locator('[data-structured-reference-token]')).toHaveCount(1)

  await composer.getByRole('button', { name: '打开参数' }).click()
  const parameters = composer.locator('[data-runtime-parameter-popover]')
  await expect(parameters.getByText('9:16', { exact: true })).toBeVisible()
  await parameters.getByText('9:16', { exact: true }).click()
  const effectiveDimensions = parameters.getByText(/648×1152/)
  await expect(effectiveDimensions).toBeVisible()
  await parameters.getByText('10s', { exact: true }).click()
  await composer.getByRole('combobox', { name: '人物参考图 参考角色' }).selectOption('reference')
  await expect(
    composer.getByRole('combobox', { name: '人物参考图 参考角色' }),
  ).toHaveValue('reference')

  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-video-composer')?.content as Record<string, unknown>
  )?.generation_parameters).toMatchObject({
    schema_version: 1,
    video: {
      aspect_ratio: '9:16',
      duration_seconds: 10,
      reference_bindings: [{
        node_id: 'node-video-reference',
        asset_id: 'asset-video-reference',
        role: 'reference',
        order: 0,
      }],
    },
  })
  await effectiveDimensions.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'video-failure-and-9x16-parameters.png'),
    fullPage: true,
  })
})

test('replacement Script composer persists and submits a backend-authoritative Agnes 2.5 selection', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasNodes.push({
    ...state.canvasNodes[0],
    id: 'node-script-model',
    node_type: 'script',
    content: {
      title: '脚本模型',
      subtype: 'script',
      serialization_version: 1,
      text: '生成短片脚本',
    },
    position_x: 720,
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  let submittedBody: Record<string, unknown> | null = null
  await page.route('**/api/text-generate', async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: {
          code: 'provider_result_invalid',
          message: '模型返回的脚本或分镜结构无效，请调整生成要求后重试。',
          retryable: false,
        },
      }),
    })
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-script-model"] [data-node-body]').click()
  const composer = runtime.locator('[data-node-composer]')

  const selector = composer.getByRole('combobox', { name: '选择脚本模型' })
  await expect(selector).toHaveValue('agnes-2.0-flash')
  await selector.selectOption('agnes-2.5-flash')
  await expect(selector).toHaveValue('agnes-2.5-flash')
  await expect.poll(() => (
    (state.canvasNodes.find((node) => node.id === 'node-script-model')?.content as Record<string, unknown>)
      ?.card_configuration as Record<string, unknown> | undefined
  )?.model_id).toBe('agnes-2.5-flash')

  await composer.getByRole('textbox').fill('根据当前故事生成可拍摄的完整分镜')
  await composer.getByRole('button', { name: '生成分镜' }).click()
  await expect.poll(() => submittedBody).toEqual(expect.objectContaining({
    model_id: 'agnes-2.5-flash',
  }))
  await mkdir(T6_013_NINTH_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_NINTH_EVIDENCE_DIRECTORY, 'script-model-2-5-selected-1440x900.png'),
  })
})

test('replacement node projects the same-card generation lifecycle without losing drag ownership', async ({
  page,
}) => {
  const state = createVisualState()
  const imageNode = state.canvasNodes.find((node) => node.id === 'node-image')!
  imageNode.status = 'running'
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const node = runtime.locator('[data-runtime-node="node-image"]')
  await expect(node).toHaveAttribute('data-runtime-phase', 'running')
  await expect(
    node,
    'T6-013 RED [generation-card-boundary-loading-absent]',
  ).toHaveAttribute('data-boundary-loading', 'true')
  await expect(node.locator('[data-runtime-lifecycle]')).toHaveCount(0)
  const loadingStatus = node.locator('[data-runtime-loading-status]')
  await expect(loadingStatus).toContainText('运行中')
  await expect(loadingStatus).toHaveCSS('position', 'absolute')
  await expect(loadingStatus).toHaveCSS('width', '1px')
  await expect(loadingStatus).toHaveCSS('height', '1px')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const boundaryRail = node.locator('[data-boundary-loading-rail]')
  const boundaryHalo = node.locator('[data-boundary-loading-halo]')
  const boundaryTrack = node.locator('[data-boundary-loading-track]')
  await expect(boundaryRail).toBeVisible()
  await expect(
    boundaryHalo,
    'T6-013 RED [boundary-loading-visible-halo-absent]',
  ).toBeVisible()
  await expect(boundaryTrack).toBeVisible()
  const boundaryVisualStyle = await Promise.all(
    [boundaryRail, boundaryHalo, boundaryTrack].map((locator) => locator.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        stroke: style.stroke,
        strokeWidth: Number.parseFloat(style.strokeWidth),
      }
    })),
  )
  expect(boundaryVisualStyle[1].strokeWidth).toBeGreaterThanOrEqual(6)
  expect(boundaryVisualStyle[2].strokeWidth).toBeGreaterThanOrEqual(3)
  expect(boundaryVisualStyle[2].stroke).not.toBe(boundaryVisualStyle[0].stroke)
  const boundaryStyle = await boundaryTrack.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      animationDuration: style.animationDuration,
      animationIterationCount: style.animationIterationCount,
      animationName: style.animationName,
      strokeDasharray: style.strokeDasharray,
      strokeDashoffset: style.strokeDashoffset,
    }
  })
  expect(boundaryStyle.animationName).not.toBe('none')
  expect(boundaryStyle.animationDuration).toBe('1.6s')
  expect(boundaryStyle.animationIterationCount).toBe('infinite')
  await mkdir(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'boundary-loading-cycle-0-1440x900.png'),
    fullPage: true,
  })
  const sustainedSamples: Array<{
    offset: string
    point: { x: number; y: number }
    screenPoint: { x: number; y: number }
    side: 'top' | 'right' | 'bottom' | 'left'
  }> = []
  const capturedSides = new Set<string>()
  for (let sampleIndex = 0; sampleIndex < 40; sampleIndex += 1) {
    const sample = await boundaryTrack.evaluate((element) => {
      const track = element as SVGGeometryElement
      const style = getComputedStyle(track)
      const offset = Number.parseFloat(style.strokeDashoffset)
      const length = track.getTotalLength()
      const normalizedProgress = ((-offset % 100) + 100) % 100
      const point = track.getPointAtLength((normalizedProgress / 100) * length)
      const bounds = track.getBBox()
      const distances = {
        top: Math.abs(point.y - bounds.y),
        right: Math.abs(point.x - (bounds.x + bounds.width)),
        bottom: Math.abs(point.y - (bounds.y + bounds.height)),
        left: Math.abs(point.x - bounds.x),
      }
      const side = (Object.entries(distances).sort((left, right) => left[1] - right[1])[0]?.[0] ?? 'top') as
        'top' | 'right' | 'bottom' | 'left'
      const matrix = track.getScreenCTM()
      if (!matrix) throw new Error('boundary track has no screen transform')
      const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix)
      return {
        offset: style.strokeDashoffset,
        point: { x: point.x, y: point.y },
        screenPoint: { x: screenPoint.x, y: screenPoint.y },
        side,
      }
    })
    sustainedSamples.push(sample)
    if (!capturedSides.has(sample.side)) {
      capturedSides.add(sample.side)
      await page.screenshot({
        path: resolve(
          T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY,
          `boundary-loading-${sample.side}-1440x900.png`,
        ),
        fullPage: true,
      })
    }
    if (sampleIndex < 39) await page.waitForTimeout(120)
  }
  expect(new Set(sustainedSamples.map((sample) => sample.offset)).size).toBeGreaterThan(12)
  expect(new Set(sustainedSamples.map((sample) => sample.side))).toEqual(
    new Set(['top', 'right', 'bottom', 'left']),
  )
  const clockwiseSides = sustainedSamples
    .map((sample) => sample.side)
    .filter((side, index, sides) => index === 0 || side !== sides[index - 1])
  const clockwiseSideIndex = new Map([
    ['top', 0],
    ['right', 1],
    ['bottom', 2],
    ['left', 3],
  ])
  for (let index = 1; index < clockwiseSides.length; index += 1) {
    const previous = clockwiseSideIndex.get(clockwiseSides[index - 1])!
    const current = clockwiseSideIndex.get(clockwiseSides[index])!
    expect((current - previous + 4) % 4).toBe(1)
  }
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'boundary-loading-after-two-plus-cycles-1440x900.png'),
    fullPage: true,
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => boundaryTrack.evaluate((element) => (
    getComputedStyle(element).animationName
  ))).toBe('none')
  const reducedMotionStyle = await Promise.all(
    [boundaryHalo, boundaryTrack].map((locator) => locator.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        animationName: style.animationName,
        opacity: style.opacity,
        strokeDasharray: style.strokeDasharray,
      }
    })),
  )
  expect(reducedMotionStyle.every((style) => style.animationName === 'none')).toBe(true)
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'boundary-loading-reduced-motion-1440x900.png'),
    fullPage: true,
  })
  await writeFile(
    resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'boundary-loading-computed-samples.json'),
    JSON.stringify({
      noPreference: {
        initial: boundaryStyle,
        visual: boundaryVisualStyle,
        sustainedSamples,
        clockwiseSides,
      },
      reducedMotion: reducedMotionStyle,
    }, null, 2),
    'utf8',
  )

  const before = await node.boundingBox()
  const handle = await node.locator('[data-node-drag-handle]').boundingBox()
  expect(before).not.toBeNull()
  expect(handle).not.toBeNull()
  await page.mouse.move(handle!.x + 80, handle!.y + 10)
  await page.mouse.down()
  await page.mouse.move(handle!.x + 120, handle!.y + 30, { steps: 3 })
  await page.mouse.up()
  const after = await node.boundingBox()
  expect(Math.round(after!.x - before!.x)).toBe(40)
  expect(Math.round(after!.y - before!.y)).toBe(20)
})

test('replacement multi-image submit exposes its quota blocked reason instead of silently ignoring the click', async ({
  page,
}) => {
  const state = createVisualState()
  state.imageQuota = 3
  const imageNode = state.canvasNodes.find((node) => node.id === 'node-image')!
  imageNode.content = {
    ...(imageNode.content as Record<string, unknown>),
    generation_parameters: {
      schema_version: 1,
      image: { aspect_ratio: '4:3', output_count: 4 },
    },
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  const composer = runtime.locator('[data-node-composer][data-composer-kind="image"]')
  const submit = composer.getByRole('button', {
    name: '图片生成需要 4 quota，当前剩余 3',
  })

  await expect(composer.getByRole('status')).toHaveText('图片生成需要 4 quota，当前剩余 3')
  await expect(submit).toBeDisabled()
  await expect(submit).toHaveAttribute('title', '图片生成需要 4 quota，当前剩余 3')
  expect(state.authenticatedRequests.filter((entry) => entry === 'POST /api/image-generate')).toHaveLength(0)
  await mkdir(T6_013_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_EVIDENCE_DIRECTORY, 'multi-image-quota-blocked-reason-1440x900.png'),
    fullPage: true,
  })
})

test('replacement port drop commits a compatible connection through graph history and autosave', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasConnections = []
  state.canvasNodes.push({
    id: 'node-asset-source',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'asset',
    content: {
      title: 'Image Asset',
      subtype: 'image',
      serialization_version: 1,
      url: 'https://media.revid.test/reference.png',
    },
    position_x: 560,
    position_y: 440,
    width: 320,
    height: 240,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  state.canvasNodes.push({
    id: 'node-video-target',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'generation',
    content: {
      title: '海面推进',
      subtype: 'video',
      serialization_version: 1,
      text: '镜头缓慢推进。',
    },
    position_x: 940,
    position_y: 140,
    width: 340,
    height: 220,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  state.canvasNodes.push({
    id: 'node-text-source',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'script',
    content: {
      title: '镜头提示',
      subtype: 'prompt',
      serialization_version: 1,
      text: '暖色海面与远处灯塔。',
    },
    position_x: 20,
    position_y: 500,
    width: 300,
    height: 160,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const source = runtime.locator('[data-runtime-node="node-asset-source"] [data-visible-port="output"]')
  const target = runtime.locator('[data-runtime-node="node-video-target"] [data-visible-port="input"]')
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  expect(sourceBox).not.toBeNull()
  expect(targetBox).not.toBeNull()

  await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, {
    steps: 5,
  })
  await page.mouse.up()

  await expect(runtime).toHaveAttribute(
    'data-last-port-drop',
    'node-asset-source:output->node-video-target:input',
  )
  await expect.poll(() => state.canvasConnections.length).toBe(1)
  expect(state.canvasConnections.at(-1)).toMatchObject({
    source_node_id: 'node-asset-source',
    source_port: 'out',
    target_node_id: 'node-video-target',
    target_port: 'media',
  })

  const input = runtime.locator('[data-runtime-node="node-image"] [data-visible-port="input"]')
  const upstream = runtime.locator('[data-runtime-node="node-text-source"] [data-visible-port="output"]')
  const inputBox = await input.boundingBox()
  const upstreamBox = await upstream.boundingBox()
  expect(inputBox).not.toBeNull()
  expect(upstreamBox).not.toBeNull()
  await page.mouse.move(inputBox!.x + inputBox!.width / 2, inputBox!.y + inputBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(upstreamBox!.x + upstreamBox!.width / 2, upstreamBox!.y + upstreamBox!.height / 2, {
    steps: 5,
  })
  await page.mouse.up()
  await expect(runtime).toHaveAttribute(
    'data-last-port-drop',
    'node-image:input->node-text-source:output',
  )
  await expect.poll(() => state.canvasConnections.length).toBe(2)
  expect(state.canvasConnections.at(-1)).toMatchObject({
    source_node_id: 'node-text-source',
    source_port: 'out',
    target_node_id: 'node-image',
    target_port: 'prompt',
  })
})

test('replacement blank port drop opens a compatible continuation menu and inserts one graph', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasNodes.push({
    id: 'node-text-blank',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    node_type: 'script',
    content: {
      title: 'Prompt',
      subtype: 'prompt',
      serialization_version: 1,
      text: 'Continue',
    },
    position_x: 180,
    position_y: 500,
    width: 300,
    height: 160,
    status: 'idle',
    created_at: '2026-07-12T08:00:00Z',
    updated_at: '2026-07-12T08:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const source = runtime.locator('[data-runtime-node="node-text-blank"] [data-visible-port="output"]')
  const sourceBox = await source.boundingBox()
  expect(sourceBox).not.toBeNull()
  await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(1040, 610, { steps: 5 })
  await page.mouse.up()

  const menu = runtime.locator('[data-runtime-continuation-menu]')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('button', { name: /视频生成/ })).toBeVisible()
  await expect(menu.getByRole('button', { name: /Result|结果/ })).toHaveCount(0)
  await expect(menu.getByRole('button', { name: /Director|导演/ })).toHaveCount(0)
  await expect(menu.getByRole('button', { name: /素材/ })).toHaveCount(0)

  const originalNodeCount = state.canvasNodes.length
  const originalConnectionCount = state.canvasConnections.length
  await menu.getByRole('button', { name: /视频生成/ }).click()
  await expect.poll(() => state.canvasNodes.length).toBe(originalNodeCount + 1)
  await expect.poll(() => state.canvasConnections.length).toBe(originalConnectionCount + 1)
  await expect(menu).toHaveCount(0)
  expect(state.canvasConnections.at(-1)).toMatchObject({
    source_node_id: 'node-text-blank',
    target_port: 'prompt',
  })
})

test('replacement media toolbar opens the retained action authority without exposing Director', async ({
  page,
}) => {
  const state = createVisualState()
  const source = state.canvasNodes.find((node) => node.id === 'node-image')!
  source.content = {
    ...source.content,
    asset_id: 'asset-toolbar-authority',
    result_asset_id: 'asset-toolbar-authority',
    asset_url: 'https://media.revid.test/toolbar-authority.png',
    url: 'https://media.revid.test/toolbar-authority.png',
    last_generation_job_id: 'job-toolbar-authority',
  }
  state.assets.push({
    id: 'asset-toolbar-authority',
    user_id: 'user-e2e',
    project_id: 'project-e2e',
    origin_canvas_id: 'canvas-first',
    canvas_node_id: 'node-image',
    type: 'image',
    url: 'https://media.revid.test/toolbar-authority.png',
    content_text: null,
    source: 'generation',
    source_model: 'mock-image-model',
    source_task_id: 'job-toolbar-authority',
    status: 'active',
    created_at: '2026-07-25T13:00:00Z',
    updated_at: '2026-07-25T13:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-image"] [data-node-body]').click()
  await runtime.locator('[data-node-toolbar]').getByRole('button', { name: '更多操作' }).click()

  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  await expect(palette).not.toContainText(/Director|导演/i)
  await palette.getByRole('button', { name: '关闭专业操作' }).click()
  await expect(palette).toHaveCount(0)
})

test('replacement composer fails closed before mutation when no authoritative model is available', async ({
  page,
}) => {
  const state = createVisualState()
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-tool="video-composition"]').click()
  await expect.poll(() => state.canvasNodes.some((node) => (
    (node.content as Record<string, unknown>)?.subtype === 'video-composition'
  ))).toBe(true)

  const submit = runtime.locator('[data-node-composer] .runtime-node-composer__submit')
  await expect(submit).toBeDisabled()
  await expect(submit).toHaveAttribute('aria-label', /视频合成.*不可用/)

  const requestsBeforeClick = [...state.authenticatedRequests]
  await submit.click({ force: true })
  expect(state.authenticatedRequests).toEqual(requestsBeforeClick)
})

test('T6-013 Script composer submits through the existing authoring authority and updates the same card', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasNodes.push({
    ...state.canvasNodes[0],
    id: 'node-script-usable',
    node_type: 'script',
    content: {
      title: '可用脚本',
      subtype: 'script',
      serialization_version: 1,
      text: '雨夜车站，一名摄影师寻找失踪的胶卷。',
    },
    position_x: 720,
    position_y: 420,
    width: 360,
    height: 180,
  })
  state.canvasNodes.push({
    ...state.canvasNodes[0],
    id: 'node-script-brief',
    node_type: 'script',
    content: {
      title: '故事提示词',
      subtype: 'prompt',
      serialization_version: 1,
      text: '雨夜车站，一名摄影师寻找失踪的胶卷。',
    },
    position_x: 320,
    position_y: 420,
    width: 320,
    height: 180,
  })
  state.canvasConnections.push({
    id: 'connection-script-brief',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    source_node_id: 'node-script-brief',
    source_port: 'out',
    target_node_id: 'node-script-usable',
    target_port: 'in',
    status: 'active',
    metadata: {},
    created_at: '2026-07-25T13:00:00Z',
    updated_at: '2026-07-25T13:00:00Z',
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.route('http://localhost:8000/api/text-generate', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-headers': 'Authorization, Content-Type',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-origin': 'http://127.0.0.1:9099',
        },
      })
      return
    }
    const body = route.request().postDataJSON() as Record<string, unknown>
    const taskId = 'task-script-usable'
    const assetId = 'asset-script-usable'
    const model = String(body.model ?? 'agnes-2.0-flash')
    const storyProduction = {
      schema_id: 'revid.story-production',
      schema_version: 1,
      skill_id: 'revid.story-director',
      skill_version: 1,
      source_node_id: 'node-script-usable',
      source_revision: 'b'.repeat(64),
      model_id: model,
      assets: { roles: [], scenes: [], props: [] },
      shots: [{
        shot_id: 'shot-script-usable-1',
        shot_number: 1,
        visual_description: '摄影师穿过雨幕寻找胶卷。',
        dialogue: '',
        duration_seconds: 5,
        video_prompt: '摄影师穿过雨幕寻找胶卷，保持人物一致。',
      }],
    }
    await route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:9099',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content: '生成后的完整结构化脚本。',
        story_production: storyProduction,
        asset: {
          id: assetId,
          user_id: 'user-e2e',
          project_id: 'project-e2e',
          origin_canvas_id: 'canvas-first',
          canvas_node_id: 'node-script-usable',
          type: 'prompt',
          url: null,
          content_text: '生成后的完整结构化脚本。',
          source: 'generation',
          source_model: model,
          source_task_id: taskId,
          status: 'active',
          created_at: '2026-07-25T13:00:00Z',
          updated_at: '2026-07-25T13:00:00Z',
        },
        generation_task: {
          id: taskId,
          user_id: 'user-e2e',
          project_id: 'project-e2e',
          origin_canvas_id: 'canvas-first',
          canvas_node_id: 'node-script-usable',
          media_type: 'text',
          provider: 'mock',
          model,
          provider_request_id: 'request-task-script-usable',
          client_request_id: body.client_request_id,
          request_fingerprint: 'a'.repeat(64),
          status: 'succeeded',
          duration_ms: 10,
          result_asset_id: assetId,
          error_code: null,
          error_message: null,
          request_parameters: {
            script_authoring: {
              contract_version: 1,
              intent: body.intent,
              locale: body.locale,
              source_node_id: 'node-script-usable',
              canvas_revision: body.canvas_revision,
              reference_asset_ids: body.reference_asset_ids ?? [],
            },
            story_director: body.story_director,
          },
          created_at: '2026-07-25T13:00:00Z',
          updated_at: '2026-07-25T13:00:00Z',
        },
        quotas: { text: 9, image: 5, video: 3 },
        quota_revision: 2,
        script_authoring: {
          contract_version: 1,
          intent: body.intent,
          locale: body.locale,
          source_node_id: 'node-script-usable',
          source_task_id: taskId,
          source_model: model,
          canvas_revision: body.canvas_revision,
        },
      }),
    })
  })
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const card = runtime.locator('[data-runtime-node="node-script-usable"]')
  await card.locator('[data-node-body]').click()
  const composer = runtime.locator('[data-node-composer][data-composer-kind="script"]')
  const brief = composer.getByRole('textbox', { name: '分镜生成要求' })
  await expect(brief, 'T6-013 RED [replacement-script-authoring-unwired]').toBeVisible()
  await brief.fill('将现有故事整理成完整、可拍摄的结构化脚本。')
  await composer.getByRole('button', { name: '生成分镜' }).click()

  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-script-usable')
      ?.content as Record<string, unknown>
  )?.story_production).toMatchObject({
    schema_id: 'revid.story-production',
    shots: [{ shot_id: 'shot-script-usable-1' }],
  })
  await expect(card).toContainText('生成后的完整结构化脚本。')
  await page.screenshot({
    path: '../output/playwright/t6-013-script-same-card-success-1440x900.png',
    fullPage: true,
  })
})

test('T6-013 Script workspace renders persisted story-production shots instead of demo rows', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasNodes.push({
    ...state.canvasNodes[0],
    id: 'node-script-production',
    node_type: 'script',
    content: {
      title: '制作脚本',
      subtype: 'script',
      serialization_version: 1,
      text: '一场雨夜追逐。',
      story_production: {
        schema_id: 'revid.story-production',
        schema_version: 1,
        skill_id: 'revid.story-director',
        skill_version: 1,
        shots: [{
          shot_id: 'shot-persisted-1',
          shot_number: 1,
          visual_description: '唯一持久化镜头：摄影师穿过雨幕。',
          dialogue: '胶卷就在前方。',
          duration_seconds: 7,
          video_prompt: '摄影师穿过雨幕。',
        }],
      },
    },
    position_x: 720,
    position_y: 420,
    width: 360,
    height: 180,
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-script-production"]')
    .getByRole('button', { name: '打开结构化脚本' }).click()
  const workspace = runtime.locator('[data-script-workspace]')
  await expect(
    workspace.getByRole('textbox', { name: '画面描述' }),
    'T6-013 RED [script-workspace-demo-rows]',
  ).toHaveValue('唯一持久化镜头：摄影师穿过雨幕。')
  await expect(
    workspace.getByRole('textbox', { name: '镜头 1 画面描述' }),
    'generated storyboard fields remain editable through typed document commands',
  ).toBeEnabled()
  await expect(workspace.getByRole('button', { name: '添加镜头' })).toBeVisible()
  await expect(workspace.locator('tbody tr')).toHaveCount(1)
})

test('T6-013 empty-canvas drag marquee selects cards and exposes group then ungroup actions', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasConnections = []
  state.canvasNodes.push(
    {
      ...state.canvasNodes[0],
      id: 'node-marquee-a',
      node_type: 'script',
      content: { title: '框选 A', subtype: 'script', serialization_version: 1, text: 'A' },
      position_x: 620,
      position_y: 180,
      width: 260,
      height: 160,
    },
    {
      ...state.canvasNodes[0],
      id: 'node-marquee-b',
      node_type: 'script',
      content: { title: '框选 B', subtype: 'script', serialization_version: 1, text: 'B' },
      position_x: 940,
      position_y: 180,
      width: 260,
      height: 160,
    },
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await expect(runtime).toHaveAttribute('data-runtime-state', 'ready')
  await page.mouse.move(560, 390)
  await page.mouse.down()
  await expect(runtime).toHaveAttribute('data-interaction-state', 'marquee')
  await page.mouse.move(900, 140, { steps: 6 })
  await expect(
    runtime.locator('[data-runtime-marquee]'),
    'T6-013 RED [replacement-marquee-absent]',
  ).toBeVisible()
  await page.mouse.up()

  await expect(runtime.locator('[data-runtime-node="node-marquee-a"]')).toHaveAttribute('data-selected', 'true')
  await expect(runtime.locator('[data-runtime-node="node-marquee-b"]')).not.toHaveAttribute('data-selected')

  const marqueeB = await runtime.locator('[data-runtime-node="node-marquee-b"]').boundingBox()
  expect(marqueeB).not.toBeNull()
  await page.keyboard.down('Shift')
  await page.mouse.move(
    marqueeB!.x + marqueeB!.width + 30,
    marqueeB!.y + marqueeB!.height + 30,
  )
  await page.mouse.down()
  await page.mouse.move(marqueeB!.x - 30, marqueeB!.y - 30, { steps: 6 })
  await expect(runtime.locator('[data-runtime-marquee]')).toBeVisible()
  await page.screenshot({
    path: '../output/playwright/t6-013-additive-marquee-1440x900.png',
    fullPage: true,
  })
  await page.mouse.up()
  await page.keyboard.up('Shift')
  await expect(runtime.locator('[data-runtime-node="node-marquee-b"]')).toHaveAttribute('data-selected', 'true')
  const toolbar = runtime.locator('[data-runtime-selection-toolbar]')
  await page.screenshot({
    path: '../output/playwright/t6-013-group-toolbar-1440x900.png',
    fullPage: true,
  })
  await toolbar.getByRole('button', { name: '组合' }).click()
  await expect.poll(() => state.canvasNodes.filter((node) => node.node_type === 'group').length).toBe(1)
  await toolbar.getByRole('button', { name: '取消组合' }).click()
  await expect.poll(() => state.canvasNodes.filter((node) => node.node_type === 'group').length).toBe(0)

  await page.keyboard.press('Control+g')
  await expect.poll(() => state.canvasNodes.filter((node) => node.node_type === 'group').length).toBe(1)
  await page.keyboard.press('Control+Shift+g')
  await expect.poll(() => state.canvasNodes.filter((node) => node.node_type === 'group').length).toBe(0)
})

test('T6-013 connection drop acquires the whole compatible card with resolved-side feedback', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasConnections = []
  state.canvasNodes.push({
    ...state.canvasNodes[0],
    id: 'node-whole-card-source',
    node_type: 'asset',
    content: {
      title: '整卡连线来源',
      subtype: 'image',
      serialization_version: 1,
      url: 'https://media.revid.test/reference.png',
    },
    position_x: 100,
    position_y: 500,
    width: 280,
    height: 180,
  }, {
    ...state.canvasNodes[0],
    id: 'node-whole-card-target',
    node_type: 'generation',
    content: {
      title: '整卡连线目标',
      subtype: 'video',
      serialization_version: 1,
      text: '海面推进',
    },
    position_x: 840,
    position_y: 300,
    width: 360,
    height: 240,
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const source = runtime.locator('[data-runtime-node="node-whole-card-source"] [data-visible-port="output"]')
  const targetCard = runtime.locator('[data-runtime-node="node-whole-card-target"]')
  const sourceBox = await source.boundingBox()
  const targetBox = await targetCard.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('missing whole-card connection geometry')

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 6,
  })
  await expect(
    targetCard,
    'T6-013 RED [whole-card-connection-target-absent]',
  ).toHaveAttribute('data-connection-target', 'compatible')
  await expect(targetCard).toHaveAttribute('data-connection-side', 'input')
  await page.screenshot({
    path: '../output/playwright/t6-013-whole-card-target-input-1440x900.png',
    fullPage: true,
  })
  await page.mouse.up()

  await expect.poll(() => state.canvasConnections.length).toBe(1)
  expect(state.canvasConnections[0]).toMatchObject({
    source_node_id: 'node-whole-card-source',
    target_node_id: 'node-whole-card-target',
    target_port: 'media',
  })
  await expect(targetCard).not.toHaveAttribute('data-connection-target')

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 3,
  })
  await expect(targetCard).toHaveAttribute('data-connection-target', 'compatible')
  await source.dispatchEvent('pointercancel', {
    bubbles: true,
    clientX: targetBox.x + targetBox.width / 2,
    clientY: targetBox.y + targetBox.height / 2,
    pointerId: 1,
  })
  await expect(targetCard).not.toHaveAttribute('data-connection-target')
  expect(state.canvasConnections).toHaveLength(1)
})

test('T6-013 reverse connection gesture resolves the whole target card to its right output side', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasConnections = []
  state.canvasNodes.push({
    ...state.canvasNodes[0],
    id: 'node-whole-card-upstream',
    node_type: 'script',
    content: {
      title: '右侧输出目标',
      subtype: 'script',
      serialization_version: 1,
      text: '作为上游文本。',
    },
    position_x: 180,
    position_y: 500,
    width: 300,
    height: 180,
  }, {
    ...state.canvasNodes[0],
    id: 'node-whole-card-downstream',
    node_type: 'script',
    content: {
      title: '反向拖拽来源',
      subtype: 'script',
      serialization_version: 1,
      text: '从输入端开始拖拽。',
    },
    position_x: 720,
    position_y: 500,
    width: 320,
    height: 180,
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  for (let step = 0; step < 3; step += 1) {
    await runtime.getByRole('button', { name: '缩小画布' }).click()
  }
  await expect(runtime.getByRole('status', { name: '当前缩放' })).toContainText('70%')
  const sourceInput = runtime.locator(
    '[data-runtime-node="node-whole-card-downstream"] [data-visible-port="input"]',
  )
  const targetCard = runtime.locator('[data-runtime-node="node-whole-card-upstream"]')
  const sourceBox = await sourceInput.boundingBox()
  const targetBox = await targetCard.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('missing reverse whole-card connection geometry')

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 6,
  })
  await expect(targetCard).toHaveAttribute('data-connection-target', 'compatible')
  await expect(targetCard).toHaveAttribute('data-connection-side', 'output')
  await page.mouse.up()

  await expect.poll(() => state.canvasConnections.length).toBe(1)
  expect(state.canvasConnections[0]).toMatchObject({
    source_node_id: 'node-whole-card-upstream',
    target_node_id: 'node-whole-card-downstream',
    source_port: 'out',
  })
})

test('T6-013 whole-card acquisition marks incompatible cards and fails closed without a graph mutation', async ({
  page,
}) => {
  const state = createVisualState()
  state.canvasConnections = []
  state.canvasNodes.push({
    ...state.canvasNodes[0],
    id: 'node-incompatible-source',
    node_type: 'script',
    content: {
      title: '文本输出',
      subtype: 'script',
      serialization_version: 1,
      text: '文本连接来源。',
    },
    position_x: 180,
    position_y: 500,
    width: 300,
    height: 180,
  }, {
    ...state.canvasNodes[0],
    id: 'node-incompatible-target',
    node_type: 'asset',
    content: {
      title: '无输入素材',
      subtype: 'image',
      serialization_version: 1,
      url: 'https://media.revid.test/reference.png',
    },
    position_x: 760,
    position_y: 500,
    width: 320,
    height: 180,
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  const sourceOutput = runtime.locator(
    '[data-runtime-node="node-incompatible-source"] [data-visible-port="output"]',
  )
  const targetCard = runtime.locator('[data-runtime-node="node-incompatible-target"]')
  const sourceBox = await sourceOutput.boundingBox()
  const targetBox = await targetCard.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('missing incompatible whole-card geometry')

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 6,
  })
  await expect(targetCard).toHaveAttribute('data-connection-target', 'incompatible')
  await expect(targetCard).toHaveAttribute('data-connection-side', 'input')
  await page.mouse.up()

  expect(state.canvasConnections).toHaveLength(0)
  await expect(runtime).toHaveAttribute('data-last-port-drop', 'incompatible')
  await expect(targetCard).not.toHaveAttribute('data-connection-target')
})
