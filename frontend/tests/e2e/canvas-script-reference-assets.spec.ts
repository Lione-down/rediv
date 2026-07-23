import { expect, test } from '@playwright/test'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import { createCanvasCommandHistory } from '../../src/modules/canvas/canvas-command-history'
import {
  createAddScriptReferenceAssetCommand,
  createUpdateScriptReferenceAssetsCommand,
  readScriptReferenceAssetIds,
} from '../../src/modules/canvas/script-reference-assets'
import type { CanvasNode } from '../../src/types/canvas'

function node(id: string, type: string, contentData: Record<string, unknown>, overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id, type, title: id, content: '', contentData,
    x: 0, y: 0, width: 320, height: 180, zIndex: 0, isLocked: false,
    ...overrides,
  }
}

function fixture() {
  return [
    node('script', 'script', { subtype: 'script', serialization_version: 1 }),
    node('role-a', 'asset', { subtype: 'image', serialization_version: 1, asset_id: 'asset-a' }),
    node('role-b', 'result', { subtype: 'image', serialization_version: 1, asset_id: 'asset-b' }),
    node('video', 'asset', { subtype: 'video', serialization_version: 1, asset_id: 'asset-video' }),
  ]
}

function executorFor(nodes: CanvasNode[]) {
  return createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => [],
    createNode: async () => { throw new Error('not expected') },
    createConnection: async () => { throw new Error('not expected') },
    deleteNode: async () => undefined,
    deleteConnection: async () => undefined,
    updateConnection: async () => undefined,
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    updateNodeState: async (nodeId, updates) => {
      Object.assign(nodes.find((candidate) => candidate.id === nodeId)!, structuredClone(updates))
    },
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
}

test('script role references accept exact canonical image assets and persist through one command', async () => {
  const nodes = fixture()
  const executor = executorFor(nodes)
  const first = createAddScriptReferenceAssetCommand(nodes, 'script', 'role-a')
  expect(first).toEqual({
    type: 'update-script-reference-assets', nodeId: 'script', referenceAssetIds: ['asset-a'],
  })
  await executor.executeCommand({ source: 'toolbar', command: first! })
  const second = createAddScriptReferenceAssetCommand(nodes, 'script', 'role-b')
  await executor.executeCommand({ source: 'keyboard', command: second! })
  expect(readScriptReferenceAssetIds(nodes[0])).toEqual(['asset-a', 'asset-b'])
  expect(nodes[0].contentData).toMatchObject({
    subtype: 'script', serialization_version: 1, reference_asset_ids: ['asset-a', 'asset-b'],
  })
})

test('script role reference validation fails closed for incompatible, duplicate, locked, grouped, and unowned IDs', () => {
  const nodes = fixture()
  expect(createAddScriptReferenceAssetCommand(nodes, 'script', 'video')).toBeNull()
  expect(createUpdateScriptReferenceAssetsCommand(nodes, 'script', ['missing'])).toBeNull()
  nodes[0].contentData!.reference_asset_ids = ['asset-a']
  expect(createAddScriptReferenceAssetCommand(nodes, 'script', 'role-a')).toBeNull()
  nodes[0].isLocked = true
  expect(createUpdateScriptReferenceAssetsCommand(nodes, 'script', ['asset-b'])).toBeNull()
  nodes[0].isLocked = false
  nodes[0].parentNodeId = 'group'
  expect(createUpdateScriptReferenceAssetsCommand(nodes, 'script', ['asset-b'])).toBeNull()
  nodes[0].parentNodeId = null
  expect(createUpdateScriptReferenceAssetsCommand(nodes, 'script', Array.from({ length: 9 }, (_, index) => `asset-${index}`))).toBeNull()
})

test('script role reference command has one exact undo and redo boundary', async () => {
  const nodes = fixture()
  const executor = executorFor(nodes)
  const history = createCanvasCommandHistory({
    getNodes: () => nodes,
    getConnections: () => [],
    executeCommand: executor.executeCommand,
    applyGraph: (nextNodes) => { nodes.splice(0, nodes.length, ...structuredClone(nextNodes)) },
  })
  history.activate('project/canvas')
  const command = createAddScriptReferenceAssetCommand(nodes, 'script', 'role-a')!
  await history.execute({ source: 'keyboard', command })
  expect(readScriptReferenceAssetIds(nodes[0])).toEqual(['asset-a'])
  await history.undo()
  expect(readScriptReferenceAssetIds(nodes[0])).toEqual([])
  await history.redo()
  expect(readScriptReferenceAssetIds(nodes[0])).toEqual(['asset-a'])
})
