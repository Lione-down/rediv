import { expect, test, type Page, type Route } from '@playwright/test'

const API_ORIGIN = 'http://localhost:8000'
const APP_ORIGIN = 'http://127.0.0.1:9099'
const NOW = '2026-07-14T12:00:00Z'

interface KeyboardState {
  canvas: Record<string, unknown>
  nodes: Array<Record<string, unknown>>
  connections: Array<Record<string, unknown>>
  documentPatches: Array<Record<string, unknown>>
  viewportPatches: Array<Record<string, unknown>>
}

const user = {
  id: 'user-keyboard', username: 'keyboard-owner', email: 'keyboard@example.com', nickname: '键盘创作者',
  avatar_url: '', role: 'user', status: 'active', generation_status: 'enabled',
  created_at: NOW, updated_at: NOW, last_login_at: NOW,
}

function createNode(id: string, title: string, x: number, type = 'text') {
  const canonicalContent = type === 'script'
    ? { title, text: `${title} 内容`, subtype: 'script', serialization_version: 1 }
    : type === 'note'
      ? { title, text: `${title} 内容`, subtype: 'annotation', serialization_version: 1 }
      : { title, text: `${title} 内容` }
  return {
    id, project_id: 'project-keyboard', canvas_id: 'canvas-keyboard', node_type: type,
    content: canonicalContent, position_x: x, position_y: 260, width: 240, height: 140,
    z_index: 0, parent_node_id: null, is_locked: false, is_collapsed: false, status: 'idle',
    created_at: NOW, updated_at: NOW,
  }
}

function createConnection(id: string, from: string, to: string) {
  return {
    id, project_id: 'project-keyboard', canvas_id: 'canvas-keyboard', source_node_id: from,
    source_port: 'out', target_node_id: to, target_port: 'in', status: 'active', metadata: {},
    created_at: NOW, updated_at: NOW,
  }
}

function createState(): KeyboardState {
  return {
    canvas: {
      id: 'canvas-keyboard', project_id: 'project-keyboard', name: '键盘画布', sort_order: 0,
      status: 'active', viewport_x: 0, viewport_y: 0, viewport_zoom: 1, graph_revision: 0,
      created_at: NOW, updated_at: NOW, deleted_at: null,
    },
    nodes: [
      createNode('node-a', '镜头 A', 180),
      createNode('node-b', '镜头 B', 520),
      createNode('node-c', '镜头 C', 860),
    ],
    connections: [
      createConnection('connection-ab', 'node-a', 'node-b'),
      createConnection('connection-bc', 'node-b', 'node-c'),
    ],
    documentPatches: [],
    viewportPatches: [],
  }
}

function corsHeaders() {
  return {
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-allow-methods': 'GET, PATCH, OPTIONS',
    'access-control-allow-origin': APP_ORIGIN,
    'content-type': 'application/json',
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, headers: corsHeaders(), body: JSON.stringify(body) })
}

async function installKeyboardApi(page: Page, state: KeyboardState) {
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    if (method === 'GET' && path === '/me') {
      return fulfillJson(route, { user, quotas: { text: 5, image: 3, video: 2 } })
    }
    if (method === 'GET' && path === '/projects') {
      return fulfillJson(route, {
        items: [{ id: 'project-keyboard', user_id: user.id, name: '键盘项目', created_at: NOW }], total: 1,
      })
    }
    if (method === 'GET' && path === '/api/projects/project-keyboard/canvases') {
      return fulfillJson(route, { items: [state.canvas], order_revision: 0 })
    }
    if (method === 'GET' && path.endsWith('/document')) {
      return fulfillJson(route, {
        canvas: state.canvas, nodes: state.nodes, connections: state.connections,
        revision: state.canvas.graph_revision,
      })
    }
    if (method === 'PATCH' && path.endsWith('/viewport')) {
      state.viewportPatches.push(request.postDataJSON() as Record<string, unknown>)
      return fulfillJson(route, state.canvas)
    }
    if (method === 'PATCH' && path.endsWith('/document')) {
      const body = request.postDataJSON() as Record<string, unknown>
      state.documentPatches.push(body)
      const nodeUpserts = body.node_upserts as Array<Record<string, unknown>>
      const nodeDeletes = body.node_deletes as string[]
      const connectionUpserts = body.connection_upserts as Array<Record<string, unknown>>
      const connectionDeletes = body.connection_deletes as string[]
      const nodesById = new Map(state.nodes.map((node) => [String(node.id), node]))
      const connectionsById = new Map(state.connections.map((connection) => [String(connection.id), connection]))
      for (const nodeId of nodeDeletes) nodesById.delete(nodeId)
      for (const node of nodeUpserts) nodesById.set(String(node.id), { ...node, created_at: NOW, updated_at: NOW })
      for (const connectionId of connectionDeletes) connectionsById.delete(connectionId)
      for (const connection of connectionUpserts) {
        connectionsById.set(String(connection.id), { ...connection, created_at: NOW, updated_at: NOW })
      }
      state.nodes = [...nodesById.values()]
      state.connections = [...connectionsById.values()]
      state.canvas.graph_revision = Number(state.canvas.graph_revision) + 1
      return fulfillJson(route, {
        revision: state.canvas.graph_revision,
        node_upserts: nodeUpserts.map((node) => nodesById.get(String(node.id))),
        node_deletes: nodeDeletes,
        connection_upserts: connectionUpserts.map((connection) => connectionsById.get(String(connection.id))),
        connection_deletes: connectionDeletes,
        server_timestamp: NOW,
        save_state: 'saved',
      })
    }
    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

async function openKeyboardCanvas(page: Page, state: KeyboardState) {
  await page.setViewportSize({ width: 1366, height: 768 })
  await installKeyboardApi(page, state)
  await page.addInitScript(() => window.localStorage.setItem('revid_token', 'keyboard-token'))
  await page.goto('/app/projects/project-keyboard/canvases/canvas-keyboard')
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
  const firstTitle = String((state.nodes[0].content as Record<string, unknown>).title)
  await expect(page.getByRole('button', { name: `定位到 ${firstTitle}` })).toBeVisible()
}

async function clickNode(page: Page, x: number, modifiers: Array<'Control' | 'Meta'> = []) {
  await page.locator('.canvas-surface').click({ position: { x: x + 80, y: 320 }, modifiers })
}

async function pressCanvasShortcut(page: Page, shortcut: string) {
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press(shortcut)
}

function boxesOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) {
  return left.x < right.x + right.width && left.x + left.width > right.x &&
    left.y < right.y + right.height && left.y + left.height > right.y
}

async function expectVisibleCommandFeedback(page: Page, message: string) {
  const feedback = page.getByRole('status').filter({ hasText: message })
  await expect(feedback).toBeVisible()
  const [feedbackBox, stageBox, selectionBox, dockBox] = await Promise.all([
    feedback.boundingBox(),
    page.getByRole('region', { name: 'Revid 无限画布工作区' }).boundingBox(),
    page.locator('.selection-toolbar').boundingBox(),
    page.locator('.canvas-tool-dock').boundingBox(),
  ])
  expect(feedbackBox).not.toBeNull()
  expect(stageBox).not.toBeNull()
  expect(selectionBox).not.toBeNull()
  expect(dockBox).not.toBeNull()
  expect(feedbackBox!.width).toBeGreaterThan(200)
  expect(feedbackBox!.height).toBeGreaterThanOrEqual(40)
  expect(Math.abs(
    feedbackBox!.x + feedbackBox!.width / 2 - (stageBox!.x + stageBox!.width / 2),
  )).toBeLessThan(2)
  expect(boxesOverlap(feedbackBox!, selectionBox!)).toBe(false)
  expect(boxesOverlap(feedbackBox!, dockBox!)).toBe(false)
  await expect(feedback).toHaveCSS('animation-name', 'none')
  await expect(feedback).toHaveCSS('transition-duration', '0s')
}

test('Ctrl+L connects one valid two-node selection through one command mutation', async ({ page }) => {
  const state = createState()
  await openKeyboardCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 860, ['Control'])

  await pressCanvasShortcut(page, 'Control+l')

  await expect.poll(() => state.connections.some((connection) => (
    connection.source_node_id === 'node-a' && connection.target_node_id === 'node-c'
  ))).toBe(true)
  expect(state.documentPatches).toHaveLength(1)
})

test('Ctrl+L reports an invalid selection in active voice without mutation', async ({ page }) => {
  const state = createState()
  await openKeyboardCanvas(page, state)
  await clickNode(page, 180)

  await pressCanvasShortcut(page, 'Control+l')

  await expectVisibleCommandFeedback(page, '请选择两个可连接的节点后重试。')
  expect(state.documentPatches).toHaveLength(0)
})

test('Ctrl+L reports an existing connection without mutation', async ({ page }) => {
  const state = createState()
  await openKeyboardCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])

  await pressCanvasShortcut(page, 'Control+l')

  await expectVisibleCommandFeedback(page, '这两个节点已经连接，请选择其他节点。')
  expect(state.documentPatches).toHaveLength(0)
})

test('Ctrl+L reports incompatible ports without mutation', async ({ page }) => {
  const state = createState()
  state.nodes = [
    createNode('node-a', '脚本 A', 180, 'script'),
    createNode('node-b', '笔记 B', 520, 'note'),
  ]
  state.connections = []
  await openKeyboardCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])

  await pressCanvasShortcut(page, 'Control+l')

  await expectVisibleCommandFeedback(page, '所选节点的端口不兼容，请选择端口兼容的节点。')
  expect(state.documentPatches).toHaveLength(0)
})

test('editable Canvas targets keep Delete and Backspace inside the editor', async ({ page }) => {
  const state = createState()
  await openKeyboardCanvas(page, state)
  await clickNode(page, 180)
  await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.workspace-stage')
    if (!stage) throw new Error('Canvas stage is unavailable')
    const targets = [
      { testId: 'contenteditable-empty', attribute: 'contenteditable', value: '' },
      { testId: 'contenteditable-plaintext', attribute: 'contenteditable', value: 'plaintext-only' },
      { testId: 'role-textbox', attribute: 'role', value: 'textbox' },
    ]
    for (const target of targets) {
      const editor = document.createElement('div')
      editor.dataset.testid = target.testId
      editor.setAttribute(target.attribute, target.value)
      editor.tabIndex = 0
      editor.textContent = '可编辑内容'
      stage.append(editor)
    }
  })

  for (const testId of ['contenteditable-empty', 'contenteditable-plaintext', 'role-textbox']) {
    await page.getByTestId(testId).focus()
    await page.keyboard.press('Delete')
    await page.keyboard.press('Backspace')
  }

  await page.waitForTimeout(650)
  expect(state.documentPatches).toHaveLength(0)
  expect(state.nodes).toHaveLength(3)
})

test('Space remains native for interactive Canvas descendants', async ({ page }) => {
  const state = createState()
  await openKeyboardCanvas(page, state)
  await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.workspace-stage')
    if (!stage) throw new Error('Canvas stage is unavailable')
    const targets = [
      { testId: 'native-button', tag: 'button' },
      { testId: 'native-link', tag: 'a', href: '#native-space' },
      { testId: 'role-button', tag: 'div', role: 'button' },
      { testId: 'role-option', tag: 'div', role: 'option' },
      { testId: 'role-menuitem', tag: 'div', role: 'menuitem' },
      { testId: 'editable-input', tag: 'input' },
      { testId: 'editable-content', tag: 'div', contenteditable: '' },
    ]
    for (const definition of targets) {
      const target = document.createElement(definition.tag)
      target.dataset.testid = definition.testId
      target.tabIndex = 0
      target.textContent = definition.testId
      target.style.cssText = 'position:absolute;top:120px;left:16px;width:8px;height:8px;opacity:.01'
      if (definition.href) target.setAttribute('href', definition.href)
      if (definition.role) target.setAttribute('role', definition.role)
      if ('contenteditable' in definition) target.setAttribute('contenteditable', definition.contenteditable ?? '')
      target.addEventListener('keydown', (event) => {
        if (event.key === ' ') target.dataset.spaceDefaultPrevented = String(event.defaultPrevented)
      })
      target.addEventListener('click', () => {
        target.dataset.clickCount = String(Number(target.dataset.clickCount ?? '0') + 1)
      })
      stage.append(target)
    }
  })
  const surface = page.locator('.canvas-surface')

  for (const testId of [
    'native-button', 'native-link', 'role-button', 'role-option', 'role-menuitem',
    'editable-input', 'editable-content',
  ]) {
    const target = page.getByTestId(testId)
    await target.focus()
    await page.keyboard.down('Space')
    await expect(surface).not.toHaveClass(/cursor-grab/)
    await expect(target).toHaveAttribute('data-space-default-prevented', 'false')
    await page.keyboard.up('Space')
  }

  await expect(page.getByTestId('native-button')).toHaveAttribute('data-click-count', '1')
  expect(state.documentPatches).toHaveLength(0)
})

test('non-dialog Canvas button focus owns Delete without graph mutation', async ({ page }) => {
  const state = createState()
  await openKeyboardCanvas(page, state)
  await clickNode(page, 180)
  const duplicateButton = page.getByRole('button', { name: '复制所选节点' })
  await duplicateButton.focus()

  await page.keyboard.press('Delete')
  await page.waitForTimeout(650)

  await expect(duplicateButton).toBeFocused()
  expect(state.documentPatches).toHaveLength(0)
  expect(state.nodes).toHaveLength(3)
})

test('Space on the focused Canvas owns pan without graph mutation', async ({ page }) => {
  const state = createState()
  await openKeyboardCanvas(page, state)
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  const surface = page.locator('.canvas-surface')
  const surfaceBox = await surface.boundingBox()
  if (!surfaceBox) throw new Error('Canvas surface is unavailable')

  await stage.focus()
  await page.keyboard.down('Space')
  await expect(surface).toHaveClass(/cursor-grab/)
  await page.mouse.move(surfaceBox.x + 40, surfaceBox.y + 140)
  await page.mouse.down()
  await page.mouse.move(surfaceBox.x + 120, surfaceBox.y + 180, { steps: 4 })
  await page.mouse.up()
  await page.keyboard.up('Space')

  await expect(surface).not.toHaveClass(/cursor-grab/)
  await expect.poll(() => state.viewportPatches.length).toBeGreaterThan(0)
  expect(state.documentPatches).toHaveLength(0)
})

for (const shortcut of ['Delete', 'Backspace']) {
  test(`graph dialog owns ${shortcut} while Escape still closes it`, async ({ page }) => {
    const state = createState()
    await openKeyboardCanvas(page, state)
    await clickNode(page, 180)
    await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
    const dialog = page.getByRole('dialog', { name: '画布内容与快捷键' })
    await dialog.getByRole('button', { name: '选择并定位 镜头 A' }).focus()

    await page.keyboard.press(shortcut)
    await page.waitForTimeout(650)

    expect(state.documentPatches).toHaveLength(0)
    expect(state.nodes).toHaveLength(3)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: '打开画布内容与快捷键' })).toBeFocused()
  })
}
