import { expect, test } from '@playwright/test'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import {
  resolveCanvasDragNodeIds,
} from '../../src/modules/canvas/canvas-commands'
import {
  createConvertStoryboardGroupCommand,
  createCreateStoryboardGroupCommand,
  createReorderStoryboardGroupCommand,
  createUpdateStoryboardGroupCommand,
} from '../../src/modules/canvas/storyboard-commands'
import {
  DEFAULT_STORYBOARD_GROUP_SETTINGS,
  readStoryboardGroupContent,
  resolveStoryboardGroupLayout,
} from '../../src/modules/canvas/storyboard-group'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

function imageNode(id: string, overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id,
    type: 'asset',
    title: `图片 ${id}`,
    x: 100,
    y: 100,
    width: 320,
    height: 180,
    contentData: { subtype: 'image', serialization_version: 1 },
    ...overrides,
  }
}

test('storyboard create validation accepts exactly 2-25 canonical editable ungrouped images and fails closed', () => {
  const valid = [imageNode('a'), imageNode('b', { type: 'result' })]
  expect(createCreateStoryboardGroupCommand(valid, ['b', 'a'])).toEqual({
    type: 'create-storyboard-group',
    nodeIds: ['b', 'a'],
    settings: DEFAULT_STORYBOARD_GROUP_SETTINGS,
  })
  expect(createCreateStoryboardGroupCommand(valid, ['a'])).toBeNull()
  expect(createCreateStoryboardGroupCommand(
    Array.from({ length: 26 }, (_, index) => imageNode(`image-${index}`)),
    Array.from({ length: 26 }, (_, index) => `image-${index}`),
  )).toBeNull()
  const maximum = Array.from({ length: 25 }, (_, index) => imageNode(`maximum-${index}`))
  expect(createCreateStoryboardGroupCommand(maximum, maximum.map((node) => node.id))).not.toBeNull()

  const invalidCases: CanvasNode[] = [
    imageNode('text', { type: 'script', contentData: { subtype: 'script', serialization_version: 1 } }),
    imageNode('video', { contentData: { subtype: 'video', serialization_version: 1 } }),
    imageNode('locked', { isLocked: true }),
    imageNode('grouped', { parentNodeId: 'group-a' }),
    imageNode('compatibility', { type: 'image', contentData: { subtype: 'image', serialization_version: 1 } }),
    imageNode('future', { contentData: { subtype: 'image', serialization_version: 2 } }),
  ]
  for (const invalid of invalidCases) {
    expect(createCreateStoryboardGroupCommand([valid[0], invalid], [valid[0].id, invalid.id])).toBeNull()
  }
})

test('storyboard grid layout is deterministic, ratio-aware, ordered, and encloses visible child bounds', () => {
  const children = [
    imageNode('a', { width: 320, height: 180 }),
    imageNode('b', { width: 360, height: 240 }),
    imageNode('c', { width: 240, height: 320 }),
  ]
  const content = {
    subtype: 'storyboard' as const,
    serialization_version: 1 as const,
    storyboard_schema_version: 1 as const,
    aspect_ratio: '16:9' as const,
    columns: 2 as const,
    show_numbers: true,
    ordered_child_ids: ['b', 'a', 'c'],
  }
  const layout = resolveStoryboardGroupLayout(children, content, { x: 76, y: 32 })
  expect(layout.group).toEqual({ x: 76, y: 32, width: 792, height: 676 })
  expect([...layout.childPositions.entries()]).toEqual([
    ['b', { x: 100, y: 100 }],
    ['a', { x: 504, y: 130 }],
    ['c', { x: 160, y: 364 }],
  ])
  expect(resolveStoryboardGroupLayout(children, content, { x: 76, y: 32 })).toEqual(layout)

  const portrait = resolveStoryboardGroupLayout(children.slice(0, 2), {
    ...content,
    aspect_ratio: '9:16',
    ordered_child_ids: ['a', 'b'],
  }, { x: 76, y: 32 })
  expect(portrait.group.height).toBeGreaterThan(layout.group.height)
})

test('typed storyboard commands atomically create, update, reorder, and convert without edge drift', async () => {
  const nodes = [
    imageNode('a', { x: 100, y: 100 }),
    imageNode('b', { type: 'result', x: 500, y: 120, width: 360, height: 240 }),
    imageNode('outside', { x: 1200, y: 80 }),
  ]
  const connections: CanvasConnection[] = [{ id: 'edge-a-b', from: 'a', to: 'b', sourcePort: 'out', targetPort: 'in' }]
  const selection: string[][] = []
  const executor = createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => connections,
    createNode: async (draft) => {
      const created = { id: 'storyboard-1', ...draft }
      nodes.push(created)
      return created
    },
    createConnection: async () => { throw new Error('not expected') },
    deleteNode: async (nodeId) => { nodes.splice(nodes.findIndex((node) => node.id === nodeId), 1) },
    deleteConnection: async () => undefined,
    updateConnection: async () => undefined,
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    updateNodeState: async (nodeId, updates) => {
      const node = nodes.find((candidate) => candidate.id === nodeId)
      if (node) Object.assign(node, structuredClone(updates))
    },
    queueNodeMove: () => undefined,
    setSelection: (nodeIds) => selection.push([...nodeIds]),
    selectConnection: () => undefined,
  })

  const create = createCreateStoryboardGroupCommand(nodes, ['b', 'a'])!
  await executor.executeCommand({ source: 'toolbar', command: create })
  const group = nodes.find((node) => node.id === 'storyboard-1')!
  expect(readStoryboardGroupContent(group, nodes.filter((node) => node.parentNodeId === group.id))).toEqual({
    subtype: 'storyboard',
    serialization_version: 1,
    storyboard_schema_version: 1,
    aspect_ratio: '16:9',
    columns: 2,
    show_numbers: true,
    ordered_child_ids: ['b', 'a'],
  })
  expect(selection.at(-1)).toEqual(['storyboard-1'])
  expect(connections).toEqual([{ id: 'edge-a-b', from: 'a', to: 'b', sourcePort: 'out', targetPort: 'in' }])
  expect(nodes.find((node) => node.id === 'outside')).toMatchObject({ x: 1200, y: 80 })
  expect(nodes.find((node) => node.id === 'outside')?.parentNodeId).toBeUndefined()
  expect(resolveCanvasDragNodeIds(nodes, ['storyboard-1'])).toEqual(['storyboard-1', 'a', 'b'])

  await executor.executeCommand({
    source: 'toolbar',
    command: createUpdateStoryboardGroupCommand(nodes, 'storyboard-1', {
      aspect_ratio: '1:1', columns: 1, show_numbers: false,
    })!,
  })
  expect(group.contentData).toMatchObject({ aspect_ratio: '1:1', columns: 1, show_numbers: false })

  await executor.executeCommand({
    source: 'toolbar',
    command: createReorderStoryboardGroupCommand(nodes, 'storyboard-1', 'a', -1)!,
  })
  expect(group.contentData?.ordered_child_ids).toEqual(['a', 'b'])
  expect(connections.map((connection) => connection.id)).toEqual(['edge-a-b'])

  const childPositions = nodes.filter((node) => node.parentNodeId === group.id).map((node) => [node.id, node.x, node.y])
  await executor.executeCommand({
    source: 'toolbar', command: createConvertStoryboardGroupCommand(nodes, 'storyboard-1')!,
  })
  expect(group.contentData).toEqual({ subtype: 'group', serialization_version: 1 })
  expect(nodes.filter((node) => node.parentNodeId === group.id).map((node) => [node.id, node.x, node.y])).toEqual(childPositions)
  expect(connections.map((connection) => connection.id)).toEqual(['edge-a-b'])
})
