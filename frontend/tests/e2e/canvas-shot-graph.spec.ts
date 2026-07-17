import { expect, test } from '@playwright/test'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createShotStoryboardGroupContent,
  readStoryboardGroupContent,
  resolveStoryboardGroup,
} from '../../src/modules/canvas/storyboard-group'
import { projectCanvasStoryboard } from '../../src/modules/canvas/storyboard-projection'
import { createShotGraphInsertCommand } from '../../src/modules/canvas/shot-graph'
import { parseShotSchemaDocument, type ShotSchemaDocument } from '../../src/modules/canvas/shot-schema'

function sourceScript(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'script-source', type: 'script', title: '故事脚本', x: 40, y: 80, width: 320, height: 200,
    content: '人物走入黄昏海岸。海浪在身后翻涌。',
    contentData: {
      subtype: 'script', serialization_version: 1,
      text: '人物走入黄昏海岸。海浪在身后翻涌。',
    },
    ...overrides,
  }
}

function schema(shotCount = 2): ShotSchemaDocument {
  return parseShotSchemaDocument({
    contract_version: 1,
    schema_id: 'revid.shot-sequence',
    provider: 'mock',
    model: 'revid-shot-mock-v1',
    project_id: 'project-a',
    canvas_id: 'canvas-a',
    source_script_node_id: 'script-source',
    aspect_ratio: '16:9',
    shot_count: shotCount,
    shots: Array.from({ length: shotCount }, (_, offset) => {
      const index = offset + 1
      return {
        shot_id: `shot-${String(index).padStart(2, '0')}`,
        index,
        title: `镜头 ${String(index).padStart(2, '0')}`,
        narrative: `叙事 ${index}`,
        image_prompt: `画面提示 ${index}`,
      }
    }),
  })
}

function generationChild(id: string, index: number, parentNodeId = 'group-shot-plan'): CanvasNode {
  return {
    id, type: 'generation', title: `镜头 ${index}`, x: 0, y: 0, width: 340, height: 220,
    parentNodeId,
    contentData: {
      subtype: 'image', serialization_version: 1,
      shot_schema_version: 1, shot_id: `shot-${String(index).padStart(2, '0')}`,
      shot_index: index, shot_title: `镜头 ${index}`,
    },
  }
}

test('Storyboard shot-plan v2 validates exact ordered image-generation children and rejects drift', () => {
  const children = [generationChild('generation-a', 1), generationChild('generation-b', 2)]
  const content = createShotStoryboardGroupContent(children.map((node) => node.id), {
    aspect_ratio: '16:9', columns: 2, show_numbers: true,
  })
  const group: CanvasNode = {
    id: 'group-shot-plan', type: 'group', title: '分镜计划', x: 0, y: 0, width: 760, height: 400,
    contentData: content,
  }

  expect(readStoryboardGroupContent(group, children)).toEqual(content)
  expect(content).toEqual({
    subtype: 'storyboard', serialization_version: 1, storyboard_schema_version: 2,
    storyboard_kind: 'shot-plan', shot_schema_version: 1,
    aspect_ratio: '16:9', columns: 2, show_numbers: true,
    ordered_child_ids: ['generation-a', 'generation-b'],
  })

  const invalid = [
    { group: { ...group, contentData: { ...content, storyboard_schema_version: 3 } }, children },
    { group, children: [{ ...children[0], contentData: { ...children[0].contentData, shot_index: 2 } }, children[1]] },
    { group, children: [{ ...children[0], contentData: { ...children[0].contentData, shot_id: 'shot-02' } }, children[1]] },
    { group, children: [{ ...children[0], type: 'asset' }, children[1]] },
    { group, children: [{ ...children[0], parentNodeId: null }, children[1]] },
  ]
  for (const candidate of invalid) {
    expect(readStoryboardGroupContent(candidate.group as CanvasNode, candidate.children as CanvasNode[])).toBeNull()
  }
})

test('shot graph command preserves source and builds exact prompt generation Storyboard topology', () => {
  const source = sourceScript()
  const sourceSnapshot = structuredClone(source)
  const command = createShotGraphInsertCommand({
    sourceNode: source,
    schema: schema(2),
    existingNodes: [source],
  })

  expect(command).not.toBeNull()
  expect(source).toEqual(sourceSnapshot)
  expect(command!.type).toBe('insert-graph')
  expect(command!.nodes).toHaveLength(5)
  expect(command!.connections).toHaveLength(4)
  expect(command!.nodes.some((node) => node.id === source.id)).toBe(false)

  const group = command!.nodes.find((node) => node.type === 'group')!
  const prompts = command!.nodes.filter((node) => node.type === 'script')
  const generations = command!.nodes.filter((node) => node.type === 'generation')
  expect(prompts).toHaveLength(2)
  expect(generations).toHaveLength(2)
  expect(command!.nodes.at(-1)).toBe(group)
  expect(group.contentData).toMatchObject({
    subtype: 'storyboard', storyboard_schema_version: 2, storyboard_kind: 'shot-plan',
    shot_schema_version: 1, ordered_child_ids: generations.map((node) => node.id),
  })
  expect(generations.map((node) => node.parentNodeId)).toEqual([group.id, group.id])
  expect(generations.map((node) => node.contentData)).toEqual([
    expect.objectContaining({
      subtype: 'image', shot_schema_version: 1, shot_id: 'shot-01', shot_index: 1,
      shot_title: '镜头 01', generation_parameters: { schema_version: 1, image: { aspect_ratio: '16:9' } },
    }),
    expect.objectContaining({
      subtype: 'image', shot_schema_version: 1, shot_id: 'shot-02', shot_index: 2,
      shot_title: '镜头 02', generation_parameters: { schema_version: 1, image: { aspect_ratio: '16:9' } },
    }),
  ])
  expect(prompts.map((node) => [node.content, node.contentData])).toEqual([
    ['画面提示 1', expect.objectContaining({ subtype: 'prompt', shot_schema_version: 1, shot_id: 'shot-01', shot_index: 1, shot_narrative: '叙事 1' })],
    ['画面提示 2', expect.objectContaining({ subtype: 'prompt', shot_schema_version: 1, shot_id: 'shot-02', shot_index: 2, shot_narrative: '叙事 2' })],
  ])

  generations.forEach((generation, offset) => {
    const incoming = command!.connections.filter((edge) => edge.to === generation.id)
    expect(incoming.map((edge) => [edge.from, edge.sourcePort, edge.targetPort, edge.metadata?.input_order])).toEqual([
      [source.id, 'out', 'prompt', 1],
      [prompts[offset].id, 'out', 'prompt', 2],
    ])
  })
  expect(JSON.stringify(command)).not.toContain('source_script_node_id')

  const graph = [source, ...command!.nodes]
  expect(resolveStoryboardGroup(graph, group.id)?.content).toEqual(group.contentData)
  expect(projectCanvasStoryboard({ nodes: graph, connections: command!.connections })
    .filter((item) => item.lane === 'image' && item.groupId === group.id)
    .map((item) => item.nodeId)).toEqual(generations.map((node) => node.id))
})

test('shot graph command supports 25 shots and fails closed for invalid source or scope', () => {
  const source = sourceScript()
  const maximum = createShotGraphInsertCommand({ sourceNode: source, schema: schema(25), existingNodes: [source] })

  expect(maximum?.nodes).toHaveLength(51)
  expect(maximum?.connections).toHaveLength(50)
  const group = maximum!.nodes.at(-1)!
  expect((group.contentData?.ordered_child_ids as string[])).toHaveLength(25)
  expect(resolveStoryboardGroup([source, ...maximum!.nodes], group.id)).not.toBeNull()

  const cases = [
    sourceScript({ isLocked: true }),
    sourceScript({ parentNodeId: 'group-a' }),
    sourceScript({ type: 'note' }),
    sourceScript({ content: '', contentData: { subtype: 'script', serialization_version: 1, text: '' } }),
    sourceScript({ contentData: { subtype: 'script', serialization_version: 2, text: '脚本' } }),
  ]
  for (const candidate of cases) {
    expect(createShotGraphInsertCommand({ sourceNode: candidate, schema: schema(2), existingNodes: [candidate] })).toBeNull()
  }
  const foreign = { ...schema(2), source_script_node_id: 'other-script' }
  expect(createShotGraphInsertCommand({ sourceNode: source, schema: foreign, existingNodes: [source] })).toBeNull()

  const whitespaceDrift = sourceScript({ content: `${source.content} ` })
  expect(createShotGraphInsertCommand({ sourceNode: source, schema: schema(2), existingNodes: [whitespaceDrift] })).toBeNull()
  const metadataDrift = sourceScript({ contentData: { ...source.contentData, review_state: 'changed' } })
  expect(createShotGraphInsertCommand({ sourceNode: source, schema: schema(2), existingNodes: [metadataDrift] })).toBeNull()
})
