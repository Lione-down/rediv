import { expect, test } from '@playwright/test'
import { reactive } from 'vue'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import { createCanvasCommandHistory } from '../../src/modules/canvas/canvas-command-history'
import * as canvasCommands from '../../src/modules/canvas/canvas-commands'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

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
  const reloaded = structuredClone(fixture)
  expect(reloaded.find((node) => node.id === 'image-source')).toMatchObject({
    id: 'image-source',
    title: '主角定妆照',
  })
  expect(connections).toEqual([expect.objectContaining({
    from: 'image-source',
    to: 'video-target',
  })])
})
