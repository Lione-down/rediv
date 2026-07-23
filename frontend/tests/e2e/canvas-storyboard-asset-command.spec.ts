import { expect, test } from '@playwright/test'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import { createCanvasCommandHistory } from '../../src/modules/canvas/canvas-command-history'
import {
  createAddStoryboardAssetCommand,
  createEditStoryboardAssetCommand,
  createRemoveStoryboardAssetCommand,
} from '../../src/modules/canvas/storyboard-asset-commands'
import type { CanvasNode } from '../../src/types/canvas'

function node(id: string, type: string, contentData: Record<string, unknown>, overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id, type, title: id, content: '', contentData,
    x: 0, y: 0, width: 320, height: 180, zIndex: 0, isLocked: false,
    ...overrides,
  }
}

function fixture() {
  const group = node('group', 'group', {
    subtype: 'storyboard', storyboard_kind: 'shot-plan', ordered_child_ids: ['generation-1', 'generation-2'],
  })
  return [
    group,
    node('generation-1', 'generation', { subtype: 'image', shot_id: 'shot-01', shot_title: '镜头一' }, { parentNodeId: group.id }),
    node('generation-2', 'generation', { subtype: 'image', shot_id: 'shot-02', shot_title: '镜头二' }, { parentNodeId: group.id }),
    node('prompt-1', 'script', {
      subtype: 'prompt', shot_id: 'shot-01', shot_characters: ['主角', '搭档'], shot_scene: '旧车站', shot_props: ['手提箱'], text: '镜头一提示',
    }, { content: '镜头一提示' }),
    node('prompt-2', 'script', {
      subtype: 'prompt', shot_id: 'shot-02', shot_characters: ['主角'], shot_scene: '旧车站', text: '镜头二提示',
    }, { content: '镜头二提示' }),
  ]
}

function executorFor(nodes: CanvasNode[], updateNodeState?: (nodeId: string, updates: Partial<Omit<CanvasNode, 'id'>>) => Promise<void>) {
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
    updateNodeState: updateNodeState ?? (async (nodeId, updates) => {
      Object.assign(nodes.find((candidate) => candidate.id === nodeId)!, structuredClone(updates))
    }),
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
}

test('storyboard asset commands add, remove, and deep-edit canonical prompt metadata', async () => {
  const nodes = fixture()
  const executor = executorFor(nodes)

  const addRole = createAddStoryboardAssetCommand(nodes, 'group', 'prompt-2', 'role', '反派')
  const addProp = createAddStoryboardAssetCommand(nodes, 'group', 'prompt-2', 'prop', '旧地图')
  expect(addRole).not.toBeNull()
  expect(addProp).not.toBeNull()
  await executor.executeCommand({ source: 'toolbar', command: addRole! })
  await executor.executeCommand({ source: 'toolbar', command: addProp! })
  expect(nodes.find((candidate) => candidate.id === 'prompt-2')?.contentData).toMatchObject({
    shot_characters: ['主角', '反派'], shot_props: ['旧地图'],
  })

  const removeRole = createRemoveStoryboardAssetCommand(nodes, 'group', 'role', '主角')
  expect(removeRole).not.toBeNull()
  await executor.executeCommand({ source: 'toolbar', command: removeRole! })
  expect(nodes.find((candidate) => candidate.id === 'prompt-1')?.contentData?.shot_characters).toEqual(['搭档'])
  expect(nodes.find((candidate) => candidate.id === 'prompt-2')?.contentData?.shot_characters).toEqual(['反派'])

  const editScene = createEditStoryboardAssetCommand(
    nodes, 'group', 'prompt-1', 'scene', '旧车站', '雨夜车站', '雨夜逆光下的站台全景',
  )
  expect(editScene).not.toBeNull()
  await executor.executeCommand({ source: 'toolbar', command: editScene! })
  expect(nodes.find((candidate) => candidate.id === 'prompt-1')).toMatchObject({
    content: '雨夜逆光下的站台全景',
    contentData: { shot_scene: '雨夜车站', text: '雨夜逆光下的站台全景' },
  })
  expect(nodes.find((candidate) => candidate.id === 'prompt-2')?.contentData?.shot_scene).toBe('雨夜车站')
})

test('storyboard asset validation fails closed for unrelated, locked, duplicate, and malformed targets', () => {
  const nodes = fixture()
  expect(createAddStoryboardAssetCommand(nodes, 'group', 'missing', 'role', '反派')).toBeNull()
  expect(createAddStoryboardAssetCommand(nodes, 'group', 'prompt-1', 'role', '主角')).toBeNull()
  expect(createRemoveStoryboardAssetCommand(nodes, 'group', 'prop', '不存在')).toBeNull()
  expect(createEditStoryboardAssetCommand(nodes, 'group', 'prompt-1', 'scene', '旧车站', '', '提示')).toBeNull()
  nodes.find((candidate) => candidate.id === 'prompt-1')!.isLocked = true
  expect(createRemoveStoryboardAssetCommand(nodes, 'group', 'role', '搭档')).toBeNull()
})

test('storyboard asset mutation rolls back earlier prompt updates when a later write fails', async () => {
  const nodes = fixture()
  const before = structuredClone(nodes)
  let writes = 0
  const executor = executorFor(nodes, async (nodeId, updates) => {
    writes += 1
    if (writes === 2) throw new Error('simulated persistence failure')
    Object.assign(nodes.find((candidate) => candidate.id === nodeId)!, structuredClone(updates))
  })
  const command = createRemoveStoryboardAssetCommand(nodes, 'group', 'role', '主角')!
  await expect(executor.executeCommand({ source: 'toolbar', command })).rejects.toThrow('simulated persistence failure')
  expect(nodes).toEqual(before)
})

test('storyboard asset command is one exact undo and redo boundary', async () => {
  const nodes = fixture()
  const executor = executorFor(nodes)
  const history = createCanvasCommandHistory({
    getNodes: () => nodes,
    getConnections: () => [],
    executeCommand: executor.executeCommand,
    applyGraph: (nextNodes) => { nodes.splice(0, nodes.length, ...structuredClone(nextNodes)) },
  })
  history.activate('project/canvas')
  const command = createAddStoryboardAssetCommand(nodes, 'group', 'prompt-2', 'prop', '旧地图')!
  await history.execute({ source: 'keyboard', command })
  expect(nodes.find((candidate) => candidate.id === 'prompt-2')?.contentData?.shot_props).toEqual(['旧地图'])
  await history.undo()
  expect(nodes.find((candidate) => candidate.id === 'prompt-2')?.contentData?.shot_props).toBeUndefined()
  await history.redo()
  expect(nodes.find((candidate) => candidate.id === 'prompt-2')?.contentData?.shot_props).toEqual(['旧地图'])
})
