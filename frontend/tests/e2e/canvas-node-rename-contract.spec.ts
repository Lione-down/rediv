import { expect, test } from '@playwright/test'
import { reactive, toRaw } from 'vue'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import { createCanvasCommandHistory } from '../../src/modules/canvas/canvas-command-history'
import * as canvasCommands from '../../src/modules/canvas/canvas-commands'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

type RenameNodeCommand = {
  type: 'rename-node'
  nodeId: string
  title: string
}

type CreateRenameNodeCommand = (
  nodes: readonly CanvasNode[],
  nodeId: string,
  title: string,
) => RenameNodeCommand | null

function requireContractFunction<T extends (...args: never[]) => unknown>(
  source: object,
  name: string,
  fingerprint: string,
): T {
  const candidate = (source as Record<string, unknown>)[name]
  expect(typeof candidate, fingerprint).toBe('function')
  return candidate as T
}

function nodes(): CanvasNode[] {
  return [
    {
      id: 'image-source', type: 'asset', title: '人物参考', x: 0, y: 0, width: 320, height: 200,
      contentData: { subtype: 'image', serialization_version: 1, asset_id: 'asset-character' },
    },
    {
      id: 'video-target', type: 'generation', title: '视频卡片', x: 420, y: 0, width: 340, height: 220,
      contentData: {
        subtype: 'video', serialization_version: 1,
        generation_parameters: {
          schema_version: 1,
          video: {
            duration_seconds: 5,
            reference_bindings: [{
              node_id: 'image-source',
              asset_id: 'asset-character',
              source_revision: 'a'.repeat(64),
              role: 'character',
              instruction: '保持人物身份和服装',
              must_not_transfer: ['background'],
              order: 0,
            }],
          },
        },
      },
    },
  ]
}

test('rename-node command changes display title only and keeps stable graph/reference identities', () => {
  const fixture = nodes()
  const createRenameNodeCommand = requireContractFunction<CreateRenameNodeCommand>(
    canvasCommands,
    'createRenameNodeCommand',
    'T6-007 RED [node-rename-command-absent]: createRenameNodeCommand is not implemented',
  )

  const command = createRenameNodeCommand(fixture, 'image-source', '  主角定妆照  ')

  expect(command).toEqual({ type: 'rename-node', nodeId: 'image-source', title: '主角定妆照' })
  expect(createRenameNodeCommand(fixture, 'image-source', '人物参考')).toBeNull()
  fixture[0].isLocked = true
  expect(createRenameNodeCommand(fixture, 'image-source', '锁定节点不可改名')).toBeNull()
  fixture[0].isLocked = false
  expect(createRenameNodeCommand(fixture, 'image-source', '   ')).toBeNull()
  expect(fixture[0]).toMatchObject({ id: 'image-source', title: '人物参考' })
  expect(fixture[1].contentData?.generation_parameters).toEqual(expect.objectContaining({
    video: expect.objectContaining({
      reference_bindings: [expect.objectContaining({
        node_id: 'image-source',
        asset_id: 'asset-character',
      })],
    }),
  }))
})

test('rename-node accepts every supported visible card family through the same command', () => {
  const createRenameNodeCommand = requireContractFunction<CreateRenameNodeCommand>(
    canvasCommands,
    'createRenameNodeCommand',
    'T6-007 RED [node-rename-command-absent]: createRenameNodeCommand is not implemented',
  )
  const fixtures: CanvasNode[] = [
    { id: 'text', type: 'text', title: '文本', x: 0, y: 0, width: 240, height: 140 },
    {
      id: 'script', type: 'script', title: '脚本', x: 0, y: 0, width: 320, height: 200,
      contentData: { subtype: 'script', serialization_version: 1 },
    },
    { id: 'image', type: 'image', title: '图片', x: 0, y: 0, width: 240, height: 140 },
    { id: 'video', type: 'video', title: '视频', x: 0, y: 0, width: 240, height: 140 },
    {
      id: 'asset', type: 'asset', title: '素材', x: 0, y: 0, width: 320, height: 240,
      contentData: { subtype: 'image', serialization_version: 1 },
    },
    { id: 'legacy-result', type: 'result', title: '兼容结果', x: 0, y: 0, width: 240, height: 140 },
    { id: 'group', type: 'group', title: '组合', x: 0, y: 0, width: 480, height: 320 },
  ]

  expect(fixtures.map((node) => (
    createRenameNodeCommand(fixtures, node.id, `${node.title} 已重命名`)?.nodeId
  ))).toEqual(fixtures.map((node) => node.id))
})

test('rename-node has one undo/redo boundary and persists the same stable node after reload serialization', async () => {
  const fixture = reactive(nodes())
  const connections = reactive<CanvasConnection[]>([{
    id: 'reference-edge',
    from: 'image-source',
    to: 'video-target',
    sourcePort: 'out',
    targetPort: 'media',
    active: true,
  }])
  const executor = createCanvasCommandExecutor({
    getNodes: () => fixture,
    getConnections: () => connections,
    createNode: async () => { throw new Error('not expected') },
    createConnection: async () => { throw new Error('not expected') },
    deleteNode: async () => undefined,
    deleteConnection: async () => undefined,
    updateConnection: async () => undefined,
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    updateNodeState: async (nodeId, updates) => {
      Object.assign(fixture.find((node) => node.id === nodeId)!, structuredClone(updates))
    },
    insertNodeIntoConnection: async () => undefined,
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
  const history = createCanvasCommandHistory({
    getNodes: () => fixture,
    getConnections: () => connections,
    executeCommand: executor.executeCommand,
    applyGraph: (nextNodes, nextConnections) => {
      fixture.splice(0, fixture.length, ...structuredClone(nextNodes))
      connections.splice(0, connections.length, ...structuredClone(nextConnections))
    },
  })
  history.activate('project-a/canvas-a')

  await history.execute({
    source: 'keyboard',
    command: { type: 'rename-node', nodeId: 'image-source', title: '主角定妆照' } as never,
  })

  expect(
    fixture.find((node) => node.id === 'image-source')?.title,
    'T6-007 RED [node-rename-executor-absent]: rename-node is not dispatched through the command boundary',
  ).toBe('主角定妆照')
  await history.undo()
  expect(fixture.find((node) => node.id === 'image-source')?.title).toBe('人物参考')
  await history.redo()
  const reloaded = structuredClone(toRaw(fixture))
  expect(reloaded.find((node) => node.id === 'image-source')).toMatchObject({
    id: 'image-source',
    title: '主角定妆照',
  })
  expect(connections).toEqual([expect.objectContaining({
    from: 'image-source',
    to: 'video-target',
  })])
})

test('external title editor renames without drag and survives undo redo reload and Canvas switching', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(
    page,
    state,
    { width: 1440, height: 900 },
    { enableCanvasInspection: true },
  )
  const surface = page.locator('.canvas-node-surface[data-node-id="generation-cover"]')
  const titleEditor = page.locator('.canvas-node-title-editor[data-node-id="generation-cover"]')
  const titleButton = titleEditor.getByRole('button', { name: '重命名 封面生成' })
  const initialPosition = {
    x: state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')?.position_x,
    y: state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')?.position_y,
  }
  const cardRect = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: {
        getNodeScreenRect?: (nodeId: string) => { x: number; y: number; width: number; height: number } | null
      }
    }).__revidCanvasInspection?.getNodeScreenRect?.('generation-cover') ?? null
  ))

  await expect(titleButton).toBeVisible()
  const titleRect = await titleButton.boundingBox()
  expect(cardRect).not.toBeNull()
  expect(titleRect).not.toBeNull()
  expect(Math.abs(titleRect!.x - cardRect!.x)).toBeLessThanOrEqual(1)
  expect(titleRect!.y + titleRect!.height).toBeLessThanOrEqual(cardRect!.y + 1)

  await titleButton.click()
  const input = titleEditor.getByRole('textbox', { name: '节点标题' })
  await expect(input).toBeFocused()
  await input.fill('镜头脚本')
  await input.press('Enter')

  await expect(titleEditor.getByRole('button', { name: '重命名 镜头脚本' })).toBeVisible()
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(0)
  expect(state.documents['canvas-first'].nodes.find(
    (node) => node.id === 'generation-cover',
  )?.content.title).toBe('镜头脚本')
  expect({
    x: state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')?.position_x,
    y: state.documents['canvas-first'].nodes.find((node) => node.id === 'generation-cover')?.position_y,
  }).toEqual(initialPosition)

  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect(titleEditor.getByRole('button', { name: '重命名 封面生成' })).toBeVisible()
  await page.keyboard.press('Control+Shift+z')
  await expect(titleEditor.getByRole('button', { name: '重命名 镜头脚本' })).toBeVisible()

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-second$/)
  await page.getByRole('button', { name: '分镜', exact: true }).click()
  await page.getByRole('option', { name: /画布 1/ }).click()
  await expect(page).toHaveURL(/\/canvases\/canvas-first$/)
  await expect(
    page.locator('.canvas-node-title-editor[data-node-id="generation-cover"]')
      .getByRole('button', { name: '重命名 镜头脚本' }),
  ).toBeVisible()

  await page.reload()
  await expect(
    page.locator('.canvas-node-title-editor[data-node-id="generation-cover"]')
      .getByRole('button', { name: '重命名 镜头脚本' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('button', { name: '选择并定位 镜头脚本' })).toHaveCount(2)
})
