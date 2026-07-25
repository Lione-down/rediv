import { expect, test } from '@playwright/test'
import {
  createVisualState,
  installMockApi,
} from './authenticated-workflow-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'

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
  await page.mouse.move(1180, 690)
  await page.mouse.down()
  await page.mouse.move(1228, 722, { steps: 4 })
  await expect(runtime).toHaveAttribute('data-interaction-state', 'canvas-pan')
  await page.mouse.up()
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
  await expect(workspace.getByRole('columnheader', { name: '场景' })).toBeVisible()
  await expect(workspace.getByRole('columnheader', { name: '画面' })).toBeVisible()
  await expect(workspace.getByRole('columnheader', { name: '旁白 / 对白' })).toBeVisible()
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

test('replacement text model selector exposes backend-authoritative Agnes 2.5 Flash', async ({
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
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-script-model"] [data-node-body]').click()
  const composer = runtime.locator('[data-node-composer]')
  await composer.getByRole('button', { name: '选择模型' }).click()

  await expect(
    composer.locator('[data-runtime-model-popover]').getByRole('button', {
      name: 'Agnes 2.5 Flash',
    }),
  ).toBeVisible()
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
  await expect(node.locator('[data-runtime-lifecycle]')).toContainText('运行中')

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
