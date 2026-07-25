import { expect, test } from '@playwright/test'
import {
  addProjectImageNode,
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

test('Add menu exposes exactly the six Human-confirmed authoring workflows', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  await page.getByRole('button', { name: '添加节点' }).click()
  const authoringOptions = page.locator('[data-authoring-option]')
  await expect(authoringOptions).toHaveCount(6)
  await expect(authoringOptions).toHaveText([
    '文本',
    '脚本',
    '图片生成',
    '视频生成',
    '视频合成',
    '音频生成',
  ])
  await expect(page.getByRole('menuitem', { name: '添加音频生成卡片' })).toBeDisabled()
  await expect(page.locator('[data-authoring-option="asset"]')).toHaveCount(0)
  await expect(page.getByRole('menuitem', { name: /结果|Director|导演台/ })).toHaveCount(0)
})

test('Video Composition is distinct while disabled Audio Generation fails closed before document mutation', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  await page.getByRole('button', { name: '添加节点' }).click()
  await page.getByRole('menuitem', { name: '添加视频合成卡片' }).click()
  await expect.poll(() => (
    state.documents['canvas-first'].nodes
      .filter((node) => node.content.subtype === 'video-composition')
      .map((node) => node.id)
  )).toHaveLength(1)
  const compositionNode = state.documents['canvas-first'].nodes
    .find((node) => node.content.subtype === 'video-composition')
  if (!compositionNode) throw new Error('missing Video Composition card')
  const compositionCard = page.locator(`.canvas-runtime-card[data-node-id="${compositionNode.id}"]`)
  await expect(compositionCard).toContainText('视频合成')
  await compositionCard.locator('.canvas-runtime-card__drag-region').click()
  await expect(page.locator('[data-capability-workflow="video-composition"]')).toBeVisible()

  const nodeCount = state.documents['canvas-first'].nodes.length
  const patchCount = documentPatches(state).length
  await page.getByRole('button', { name: '添加节点' }).click()
  const audioOption = page.getByRole('menuitem', { name: '添加音频生成卡片' })
  await expect(audioOption).toBeDisabled()
  await audioOption.evaluate((element: HTMLButtonElement) => element.click())
  await page.waitForTimeout(100)
  expect(state.documents['canvas-first'].nodes).toHaveLength(nodeCount)
  expect(documentPatches(state)).toHaveLength(patchCount)
  expect(state.requests.filter((request) => (
    request.method === 'POST' && request.path.includes('/generation-tasks')
  ))).toHaveLength(0)
})

test('Script card keeps its content and drag region visible before and after selection', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="script-source"]')
  const dragRegion = card.locator('.canvas-runtime-card__drag-region')
  await expect(card).toHaveAttribute('data-card-state', 'idle')
  await expect(card.locator('.canvas-runtime-card__body')).toContainText('黄昏海岸，人物入画。')
  await expect(dragRegion).toBeVisible()

  await dragRegion.click()
  await expect(card).toHaveAttribute('data-card-state', 'selected')
  await expect(dragRegion).toBeVisible()
})

test('running state keeps the shared drag region available and commits one move', async ({ page }) => {
  const state = createResourceMockState()
  const script = state.documents['canvas-first'].nodes.find((node) => node.id === 'script-source')
  if (!script) throw new Error('missing script fixture')
  script.status = 'running'
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="script-source"]')
  const dragRegion = card.locator('.canvas-runtime-card__drag-region')
  await expect(card).toHaveAttribute('data-card-state', 'running')
  await expect(dragRegion).not.toHaveAttribute('aria-disabled', 'true')
  const before = await card.boundingBox()
  expect(before).not.toBeNull()
  const patchBaseline = documentPatches(state).length
  await dragRegion.hover()
  await page.mouse.down()
  await page.mouse.move(before!.x + before!.width / 2 + 96, before!.y + 48)
  await page.mouse.up()
  const after = await card.boundingBox()
  expect(after).not.toBeNull()
  expect(after!.x - before!.x).toBeGreaterThan(70)
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(patchBaseline)
})

test('Text card selection stays resting until body double-click enters direct editing', async ({ page }) => {
  const state = createResourceMockState()
  const script = state.documents['canvas-first'].nodes.find((node) => node.id === 'script-source')
  if (!script) throw new Error('missing script fixture')
  state.documents['canvas-first'].nodes.push({
    ...structuredClone(script),
    id: 'text-direct-edit',
    position_x: 980,
    position_y: 440,
    content: {
      ...structuredClone(script.content),
      title: '旁白',
      subtype: 'prompt',
      text: '黄昏海岸，人物入画。',
    },
  })
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="text-direct-edit"]')
  await card.locator('.canvas-runtime-card__drag-region').click({ force: true })
  await expect(card).toHaveAttribute('data-card-state', 'selected')
  await expect(card.getByRole('textbox', { name: '编辑旁白内容' })).toHaveCount(0)

  await card.locator('.canvas-runtime-card__body').dblclick()
  await expect(card).toHaveAttribute('data-card-state', 'editing')
  const editor = card.getByRole('textbox', { name: '编辑旁白内容' })
  await expect(editor).toBeFocused()
  const [beforeCard, editorBox] = await Promise.all([card.boundingBox(), editor.boundingBox()])
  if (!beforeCard || !editorBox) throw new Error('missing direct-edit geometry')
  await page.mouse.move(editorBox.x + editorBox.width / 2, editorBox.y + editorBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(editorBox.x + editorBox.width / 2 + 120, editorBox.y + editorBox.height / 2 + 40)
  await page.mouse.up()
  const afterCard = await card.boundingBox()
  expect(afterCard).not.toBeNull()
  expect(afterCard!.x).toBeCloseTo(beforeCard.x, 0)
  expect(afterCard!.y).toBeCloseTo(beforeCard.y, 0)
})

test('Script card opens its structured workflow only through an explicit action', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="script-source"]')
  await card.locator('.canvas-runtime-card__drag-region').click()
  await expect(page.locator('.canvas-script-card-work-surface')).toHaveCount(0)
  await card.getByRole('button', { name: '展开脚本工作流' }).click()
  await expect(page.locator('.canvas-script-card-work-surface')).toBeVisible()
})

test('Asset card projects truthful ownership and field editability', async ({ page }) => {
  const state = createResourceMockState()
  addProjectImageNode(state)
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="asset-reference-node"]')
  await expect(card).toHaveAttribute('data-ownership', 'project-asset')
  await expect(card).toHaveAttribute('data-title-editable', 'true')
  await expect(card).toHaveAttribute('data-body-editable', 'false')
  await expect(card).toHaveAttribute('data-configuration-editable', 'false')
  await expect(card.locator('.canvas-runtime-card__title')).toBeEnabled()
})

test('structured references render as inline thumbnail and name tokens without raw ids', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  const generation = state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')
  if (!generation) throw new Error('missing generation fixture')
  generation.content.subtype = 'video'
  generation.content.generation_parameters = {
    schema_version: 1,
    video: {
      duration_seconds: 5,
      reference_bindings: [
        { node_id: 'asset-reference-node', asset_id: 'asset-reference', role: 'first-frame', order: 0 },
      ],
    },
  }
  addProjectImageNode(state)
  state.documents['canvas-first'].connections.push({
    id: 'reference-edge',
    project_id: 'project-resource',
    canvas_id: 'canvas-first',
    source_node_id: 'asset-reference-node',
    source_port: 'out',
    target_node_id: 'generation-cover',
    target_port: 'media',
    status: 'active',
    metadata: { input_order: 1 },
  })
  generation.content.card_configuration = {
    schema_version: 1,
    generation_mode: 'image-to-video',
    model_id: 'mock-video-v1',
    prompt_document: {
      schema_version: 1,
      segments: [
        { kind: 'text', text: '人物奔跑 ' },
        { kind: 'reference', stable_id: 'asset-reference-node', asset_id: 'asset-reference' },
        { kind: 'text', text: ' 穿过海浪' },
      ],
    },
    references: [{
      stable_id: 'asset-reference-node',
      asset_id: 'asset-reference',
      display_name: '海边人物',
      thumbnail_url: 'https://media.revid.test/reference.png',
      source_revision: 7,
      role: 'first-frame',
      order: 0,
    }],
  }
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="generation-cover"]')
  await card.locator('.canvas-runtime-card__drag-region').click()
  const promptShell = page.locator('.canvas-card-work-surface__prompt-shell')
  const editor = promptShell.getByRole('textbox', { name: '卡片生成提示词' })
  const token = editor.locator('[data-structured-reference-token]')
  await expect(card).toHaveAttribute('data-generation-mode', 'image-to-video')
  await expect(card).toHaveAttribute('data-model-id', 'mock-video-v1')
  await expect(token).toHaveCount(1)
  await expect(token).toContainText('海边人物')
  await expect(token.locator('img')).toHaveAttribute('src', 'https://media.revid.test/reference.png')
  await expect(token).not.toContainText('asset-reference-node')
  await expect(editor).toHaveAttribute('contenteditable', 'true')
  await expect(editor).toHaveText('人物奔跑 海边人物 穿过海浪')
  await expect(editor).not.toContainText('@海边人物')
  await expect(editor.locator(':scope > *')).toHaveCount(1)
  const orderedChildren = await editor.evaluate((element) => Array.from(element.childNodes).map((child) => (
    child instanceof HTMLElement && child.hasAttribute('data-structured-reference-token')
      ? `reference:${child.dataset.referenceStableId}`
      : `text:${child.textContent}`
  )))
  expect(orderedChildren).toEqual([
    'text:人物奔跑 ',
    'reference:asset-reference-node',
    'text: 穿过海浪',
  ])

  await page.locator('.canvas-runtime-card[data-node-id="script-source"] .canvas-runtime-card__drag-region').click()
  await card.locator('.canvas-runtime-card__drag-region').click()
  await expect(token).toContainText('海边人物')
  await page.reload()
  await expect(card).toHaveAttribute('data-generation-mode', 'image-to-video')
  await expect(card).toHaveAttribute('data-model-id', 'mock-video-v1')
  await card.locator('.canvas-runtime-card__drag-region').click()
  await expect(token).toContainText('海边人物')
  await expect(editor).toHaveText('人物奔跑 海边人物 穿过海浪')

  const disconnectPatchBaseline = documentPatches(state).length
  await page.locator('.connection-hit[aria-label*="项目参考图 到 封面生成"]').press('Enter')
  await expect(page.locator('.connection-line.selected')).toHaveCount(1)
  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Delete')
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(disconnectPatchBaseline)
  await expect.poll(() => (
    state.documents['canvas-first'].connections.some((connection) => connection.id === 'reference-edge')
  )).toBe(false)
  await expect.poll(() => (
    state.documents['canvas-first'].nodes
      .find((node) => node.id === 'generation-cover')
      ?.content.card_configuration?.references
  )).toEqual([])
  await expect(token).toHaveCount(0)
})

test('mention insertion persists the token at the caret and restores the same sentence order', async ({ page }) => {
  const state = createResourceMockState()
  state.capabilityVersion = 6
  const generation = state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')
  if (!generation) throw new Error('missing generation fixture')
  generation.content.subtype = 'video'
  generation.content.generation_parameters = {
    schema_version: 1,
    video: {
      duration_seconds: 5,
      reference_bindings: [
        { node_id: 'asset-reference-node', asset_id: 'asset-reference', role: 'reference', order: 0 },
      ],
    },
  }
  addProjectImageNode(state)
  state.documents['canvas-first'].connections.push({
    id: 'reference-edge',
    project_id: 'project-resource',
    canvas_id: 'canvas-first',
    source_node_id: 'asset-reference-node',
    source_port: 'out',
    target_node_id: 'generation-cover',
    target_port: 'media',
    status: 'active',
    metadata: { input_order: 1 },
  })
  generation.content.card_configuration = {
    schema_version: 1,
    generation_mode: 'image-to-video',
    model_id: 'mock-video-v1',
    references: [{
      stable_id: 'asset-reference-node',
      asset_id: 'asset-reference',
      display_name: '海边人物',
      thumbnail_url: 'https://media.revid.test/reference.png',
      source_revision: 7,
      role: 'reference',
      order: 0,
    }],
  }
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="generation-cover"]')
  await card.locator('.canvas-runtime-card__drag-region').click()
  const editor = page.getByRole('textbox', { name: '卡片生成提示词' })
  await editor.fill('人物奔跑 @')
  await page.getByRole('option', { name: '引用 海边人物' }).click()
  await editor.pressSequentially('穿过海浪')

  const orderedChildren = async () => editor.evaluate((element) => Array.from(element.childNodes).flatMap((child) => {
    if (child instanceof HTMLElement && child.hasAttribute('data-structured-reference-token')) {
      return [`reference:${child.dataset.referenceStableId}`]
    }
    return child.textContent ? [`text:${child.textContent}`] : []
  }))
  await expect.poll(orderedChildren).toEqual([
    'text:人物奔跑 ',
    'reference:asset-reference-node',
    'text: 穿过海浪',
  ])
  await expect.poll(() => {
    const content = state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')?.content
    return {
      prompt: content.text,
      document: content.card_configuration?.prompt_document,
    }
  }).toEqual({
    prompt: '人物奔跑  穿过海浪',
    document: {
      schema_version: 1,
      segments: [
        { kind: 'text', text: '人物奔跑 ' },
        { kind: 'reference', stable_id: 'asset-reference-node', asset_id: 'asset-reference' },
        { kind: 'text', text: ' 穿过海浪' },
      ],
    },
  })

  await page.reload()
  await card.locator('.canvas-runtime-card__drag-region').click()
  await expect.poll(orderedChildren).toEqual([
    'text:人物奔跑 ',
    'reference:asset-reference-node',
    'text: 穿过海浪',
  ])
})

test('reference tokens reorder through typed persistence and survive reload', async ({ page }) => {
  test.setTimeout(60_000)
  const state = createResourceMockState()
  state.capabilityVersion = 6
  const generation = state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')
  if (!generation) throw new Error('missing generation fixture')
  generation.content.subtype = 'video'
  generation.content.generation_parameters = {
    schema_version: 1,
    video: {
      duration_seconds: 5,
      reference_bindings: [
        { node_id: 'first-frame-node', asset_id: 'asset-reference', role: 'first-frame', order: 0 },
        { node_id: 'last-frame-node', asset_id: 'asset-generated', role: 'last-frame', order: 1 },
      ],
    },
  }
  addProjectImageNode(state, 'asset-reference', 'first-frame-node')
  addProjectImageNode(state, 'asset-generated', 'last-frame-node')
  state.documents['canvas-first'].connections.push(
    {
      id: 'first-reference-edge', project_id: 'project-resource', canvas_id: 'canvas-first',
      source_node_id: 'first-frame-node', source_port: 'out', target_node_id: 'generation-cover',
      target_port: 'media', status: 'active', metadata: { input_order: 1 },
    },
    {
      id: 'last-reference-edge', project_id: 'project-resource', canvas_id: 'canvas-first',
      source_node_id: 'last-frame-node', source_port: 'out', target_node_id: 'generation-cover',
      target_port: 'media', status: 'active', metadata: { input_order: 2 },
    },
  )
  generation.content.card_configuration = {
    schema_version: 1,
    generation_mode: 'keyframes',
    model_id: 'mock-video-v1',
    references: [
      {
        stable_id: 'first-frame-node',
        asset_id: 'asset-reference',
        display_name: '首帧',
        thumbnail_url: 'https://media.revid.test/reference.png',
        source_revision: 3,
        role: 'first-frame',
        order: 0,
      },
      {
        stable_id: 'last-frame-node',
        asset_id: 'asset-generated',
        display_name: '尾帧',
        thumbnail_url: 'https://media.revid.test/generated.png',
        source_revision: 4,
        role: 'last-frame',
        order: 1,
      },
    ],
  }
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const card = page.locator('.canvas-runtime-card[data-node-id="generation-cover"]')
  await card.locator('.canvas-runtime-card__drag-region').click()
  const tokens = page.locator('.canvas-card-work-surface__reference-list [data-canonical-reference-control]')
  await expect(tokens).toHaveCount(2)
  await expect(tokens.locator('strong')).toHaveText(['首帧', '尾帧'])
  const patchBaseline = documentPatches(state).length
  await page.getByRole('button', { name: '后移 首帧' }).press('Enter')
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(patchBaseline)
  await expect(tokens.locator('strong')).toHaveText(['尾帧', '首帧'])
  await expect.poll(() => (
    state.documents['canvas-first'].nodes
      .find((node) => node.id === 'generation-cover')
      ?.content.card_configuration?.references
      ?.map((reference) => reference.stable_id)
  )).toEqual(['last-frame-node', 'first-frame-node'])

  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => (
    state.documents['canvas-first'].nodes
      .find((node) => node.id === 'generation-cover')
      ?.content.card_configuration?.references
      ?.map((reference) => reference.stable_id)
  )).toEqual(['first-frame-node', 'last-frame-node'])
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => (
    state.documents['canvas-first'].nodes
      .find((node) => node.id === 'generation-cover')
      ?.content.card_configuration?.references
      ?.map((reference) => reference.stable_id)
  )).toEqual(['last-frame-node', 'first-frame-node'])

  await page.reload()
  await card.locator('.canvas-runtime-card__drag-region').click()
  await expect(tokens.locator('strong')).toHaveText(['尾帧', '首帧'])
  await expect(card).toHaveAttribute('data-generation-mode', 'keyframes')

  await page.getByRole('button', { name: '画布 1', exact: true }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second(?:\?canvas_runtime=legacy)?$/)
  await page.getByRole('button', { name: '分镜', exact: true }).click()
  await page.getByRole('option', { name: /画布 1/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-first(?:\?canvas_runtime=legacy)?$/)
  await card.locator('.canvas-runtime-card__drag-region').click()
  await expect(tokens.locator('strong')).toHaveText(['尾帧', '首帧'])
  await expect(card).toHaveAttribute('data-generation-mode', 'keyframes')
  await expect(card).toHaveAttribute('data-model-id', 'mock-video-v1')
})

test('DOM runtime owns every visible card and its drag region', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  await expect(page.locator('.canvas-runtime-card')).toHaveCount(2)
  await expect(page.locator('.canvas-surface canvas')).toHaveAttribute('data-card-visual-authority', 'dom')

  const card = page.locator('.canvas-runtime-card[data-node-id="script-source"]')
  const dragRegion = card.locator('.canvas-runtime-card__drag-region')
  await expect(card).toBeVisible()
  await expect(dragRegion).toBeVisible()
  const before = await card.boundingBox()
  expect(before).not.toBeNull()
  const patchBaseline = documentPatches(state).length
  await dragRegion.hover()
  await page.mouse.down()
  await page.mouse.move(before!.x + before!.width / 2 + 96, before!.y + 48)
  await page.mouse.up()
  const after = await card.boundingBox()
  expect(after).not.toBeNull()
  expect(after!.x - before!.x).toBeGreaterThan(70)
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(patchBaseline)
})

test('DOM runtime exposes one control for every logical port and rendered endpoints meet it', async ({ page }) => {
  const state = createResourceMockState()
  state.documents['canvas-first'].connections.unshift({
    id: 'connection-script-generation',
    project_id: 'project-resource',
    canvas_id: 'canvas-first',
    source_node_id: 'script-source',
    source_port: 'out',
    target_node_id: 'generation-cover',
    target_port: 'prompt',
    status: 'active',
    metadata: {},
    created_at: '2026-07-21T08:00:00Z',
    updated_at: '2026-07-21T08:00:00Z',
  })
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  const generation = page.locator('.canvas-runtime-card[data-node-id="generation-cover"]')
  await expect(generation.locator('.canvas-runtime-port[data-port-direction="input"]')).toHaveCount(2)
  await expect(generation.locator('.canvas-runtime-port[data-port-direction="output"]')).toHaveCount(1)
  await expect(generation.locator('.canvas-runtime-port[data-port-id="prompt"]')).toHaveCount(1)
  await expect(generation.locator('.canvas-runtime-port[data-port-id="media"]')).toHaveCount(1)

  const edge = page.locator('.connection-line').first()
  const endpoint = await edge.evaluate((path: SVGPathElement) => {
    const matrix = path.getScreenCTM()
    const point = path.getPointAtLength(path.getTotalLength())
    if (!matrix) throw new Error('missing SVG screen matrix')
    return {
      x: matrix.a * point.x + matrix.c * point.y + matrix.e,
      y: matrix.b * point.x + matrix.d * point.y + matrix.f,
    }
  })
  const target = await generation.locator('.canvas-runtime-port[data-port-id="prompt"]').boundingBox()
  expect(target).not.toBeNull()
  expect(endpoint.x).toBeCloseTo(target!.x + target!.width / 2, 0)
  expect(endpoint.y).toBeCloseTo(target!.y + target!.height / 2, 0)
})

test('rendered edge endpoints stay on visible ports through selection hover drag and zoom', async ({ page }) => {
  test.setTimeout(60_000)
  const state = createResourceMockState()
  state.documents['canvas-first'].connections.unshift({
    id: 'connection-script-generation-zoom',
    project_id: 'project-resource',
    canvas_id: 'canvas-first',
    source_node_id: 'script-source',
    source_port: 'out',
    target_node_id: 'generation-cover',
    target_port: 'prompt',
    status: 'active',
    metadata: {},
    created_at: '2026-07-21T08:00:00Z',
    updated_at: '2026-07-21T08:00:00Z',
  })
  await openResourceWorkspace(page, state, { width: 2400, height: 1400 })

  const sourcePort = page.locator(
    '.canvas-runtime-card[data-node-id="script-source"] .canvas-runtime-port[data-port-direction="output"]',
  )
  const targetPort = page.locator(
    '.canvas-runtime-card[data-node-id="generation-cover"] .canvas-runtime-port[data-port-id="prompt"]',
  )
  const edge = page.locator('.connection-line').first()
  await page.locator(
    '.canvas-runtime-card[data-node-id="generation-cover"] .canvas-runtime-card__drag-region',
  ).click()

  async function expectRenderedEndpoints() {
    const [screenEndpoints, sourceBox, targetBox] = await Promise.all([
      edge.evaluate((path: SVGPathElement) => {
        const matrix = path.getScreenCTM()
        if (!matrix) throw new Error('missing SVG screen matrix')
        const project = (point: DOMPoint) => ({
          x: matrix.a * point.x + matrix.c * point.y + matrix.e,
          y: matrix.b * point.x + matrix.d * point.y + matrix.f,
        })
        return {
          source: project(path.getPointAtLength(0)),
          target: project(path.getPointAtLength(path.getTotalLength())),
        }
      }),
      sourcePort.boundingBox(),
      targetPort.boundingBox(),
    ])
    if (!sourceBox || !targetBox) throw new Error('missing visible port boxes')
    expect(screenEndpoints.source.x).toBeCloseTo(sourceBox.x + sourceBox.width / 2, 0)
    expect(screenEndpoints.source.y).toBeCloseTo(sourceBox.y + sourceBox.height / 2, 0)
    expect(screenEndpoints.target.x).toBeCloseTo(targetBox.x + targetBox.width / 2, 0)
    expect(screenEndpoints.target.y).toBeCloseTo(targetBox.y + targetBox.height / 2, 0)
  }

  for (const zoom of [50, 100, 200]) {
    const zoomEntry = page.getByRole('spinbutton', { name: '缩放百分比' })
    await zoomEntry.fill(String(zoom))
    await zoomEntry.press('Enter')
    await expect(zoomEntry).toHaveValue(String(zoom))
    if (zoom <= 100) await targetPort.hover()
    await expectRenderedEndpoints()
    if (zoom === 50) {
      const mediaPort = page.locator(
        '.canvas-runtime-card[data-node-id="generation-cover"] .canvas-runtime-port[data-port-id="media"]',
      )
      const [promptBox, mediaBox, acquisitionSize] = await Promise.all([
        targetPort.boundingBox(),
        mediaPort.boundingBox(),
        targetPort.evaluate((element) => Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--port-acquisition-size'),
        )),
      ])
      if (!promptBox || !mediaBox) throw new Error('missing multi-input port boxes')
      const centerDistance = Math.abs(
        mediaBox.y + mediaBox.height / 2 - (promptBox.y + promptBox.height / 2),
      )
      expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(mediaBox.y)
      expect(acquisitionSize).toBeLessThanOrEqual(centerDistance - 4)
    }
  }

  const zoomEntry = page.getByRole('spinbutton', { name: '缩放百分比' })
  await zoomEntry.fill('100')
  await zoomEntry.press('Enter')
  const edgeHit = page.locator('.connection-hit[aria-label*="镜头脚本 到 封面生成"]')
  await edgeHit.hover()
  await expectRenderedEndpoints()
  await edgeHit.press('Enter')
  await expect(edge).toHaveClass(/selected/)
  await expectRenderedEndpoints()
  const sourceBox = await sourcePort.boundingBox()
  if (!sourceBox) throw new Error('missing source port box')
  await sourcePort.hover()
  await page.mouse.down()
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 120, sourceBox.y + sourceBox.height / 2 + 40)
  const draftStart = await page.locator('.connection-layer .draft').evaluate((path: SVGPathElement) => {
    const matrix = path.getScreenCTM()
    const point = path.getPointAtLength(0)
    if (!matrix) throw new Error('missing draft SVG screen matrix')
    return {
      x: matrix.a * point.x + matrix.c * point.y + matrix.e,
      y: matrix.b * point.x + matrix.d * point.y + matrix.f,
    }
  })
  expect(draftStart.x).toBeCloseTo(sourceBox.x + sourceBox.width / 2, 0)
  expect(draftStart.y).toBeCloseTo(sourceBox.y + sourceBox.height / 2, 0)
  await page.mouse.up()
  await expect(page.locator('.connection-layer .draft')).toHaveCount(0)

  const targetBox = await targetPort.boundingBox()
  if (!targetBox) throw new Error('missing target port box')
  await targetPort.hover()
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2 - 120, targetBox.y + targetBox.height / 2 + 40)
  const draftTarget = await page.locator('.connection-layer .draft').evaluate((path: SVGPathElement) => {
    const matrix = path.getScreenCTM()
    const point = path.getPointAtLength(path.getTotalLength())
    if (!matrix) throw new Error('missing reverse draft SVG screen matrix')
    return {
      x: matrix.a * point.x + matrix.c * point.y + matrix.e,
      y: matrix.b * point.x + matrix.d * point.y + matrix.f,
    }
  })
  expect(draftTarget.x).toBeCloseTo(targetBox.x + targetBox.width / 2, 0)
  expect(draftTarget.y).toBeCloseTo(targetBox.y + targetBox.height / 2, 0)
  await page.mouse.up()
  await expect(page.locator('.connection-layer .draft')).toHaveCount(0)
})
