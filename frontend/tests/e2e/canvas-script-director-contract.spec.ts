import { expect, test } from '@playwright/test'
import * as scriptAuthoring from '../../src/modules/canvas/script-authoring'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import type { CanvasNode } from '../../src/types/canvas'

type ParseStoryDirectorCapabilities = (value: unknown) => {
  contractVersion: number
  models: Array<{ id: string; label: string }>
  director: {
    skillId: string
    skillVersion: number
    userSelectable: false
  }
}

function requireContractFunction<T extends (...args: never[]) => unknown>(
  source: object,
  name: string,
  fingerprint: string,
): T {
  const candidate = (source as Record<string, unknown>)[name]
  expect(typeof candidate, fingerprint).toBe('function')
  return candidate as T
}

test('script capabilities expose allowed models while the project-owned director stays automatic', () => {
  const parseStoryDirectorCapabilities = requireContractFunction<ParseStoryDirectorCapabilities>(
    scriptAuthoring,
    'parseStoryDirectorCapabilities',
    'T6-007 RED [built-in-story-director-capability-absent]: parseStoryDirectorCapabilities is not implemented',
  )

  const capabilities = parseStoryDirectorCapabilities({
    contract_version: 2,
    available: true,
    models: [
      { id: 'text-fast', label: 'Text Fast' },
      { id: 'text-quality', label: 'Text Quality' },
    ],
    director: {
      skill_id: 'revid.story-director',
      skill_version: 1,
      user_selectable: false,
    },
  })

  expect(capabilities).toEqual({
    contractVersion: 2,
    models: [
      { id: 'text-fast', label: 'Text Fast' },
      { id: 'text-quality', label: 'Text Quality' },
    ],
    director: {
      skillId: 'revid.story-director',
      skillVersion: 1,
      userSelectable: false,
    },
  })
})

test('script result handoff targets the same card with one built-in story-production document', async () => {
  const createStoryProductionResultCommand = requireContractFunction<(
    input: {
      source: CanvasNode
      sourceTextAtRequest: string
      generatedText: string
      storyProduction: Record<string, unknown>
      lineage: {
        contract_version: 1
        intent: 'script_draft'
        locale: 'zh-CN'
        source_node_id: string
        source_task_id: string
        source_model: string
        canvas_revision: number
      }
    },
  ) => Record<string, unknown>>(
    scriptAuthoring,
    'createStoryProductionResultCommand',
    'T6-012 RED [built-in-story-production-handoff-absent]: createStoryProductionResultCommand is not implemented',
  )
  const source: CanvasNode = {
    id: 'script-source',
    type: 'script',
    title: 'Story source',
    x: 10,
    y: 20,
    width: 320,
    height: 200,
    content: 'Original script.',
    contentData: { subtype: 'script', serialization_version: 1, text: 'Original script.' },
  }
  const storyProduction = {
    schema_id: 'revid.story-production',
    schema_version: 1,
    skill_id: 'revid.story-director',
    skill_version: 1,
    source_node_id: 'script-source',
    source_revision: 'b'.repeat(64),
    model_id: 'text-fast',
    assets: {
      roles: [],
      scenes: [],
      props: [],
    },
    shots: [{ shot_id: 'shot-1', video_prompt: 'A bounded current-shot prompt.' }],
  }
  const command = createStoryProductionResultCommand({
    source,
    sourceTextAtRequest: 'Original script.',
    generatedText: 'Generated editable script.',
    storyProduction,
    lineage: {
      contract_version: 1,
      intent: 'script_draft',
      locale: 'zh-CN',
      source_node_id: source.id,
      source_task_id: 'task-story-1',
      source_model: 'text-fast',
      canvas_revision: 7,
    },
  })

  expect(command).toMatchObject({
    type: 'apply-script-authoring-result',
    nodeId: 'script-source',
    storyProduction,
  })
  expect(JSON.stringify(command)).not.toContain('user_selected_skill')

  const nodes = [source]
  const executor = createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => [],
    createNode: async () => { throw new Error('not expected') },
    createConnection: async () => { throw new Error('not expected') },
    deleteNode: async () => undefined,
    deleteConnection: async () => undefined,
    updateConnection: async () => undefined,
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    updateNodeState: async (nodeId, update) => {
      Object.assign(nodes.find((node) => node.id === nodeId)!, structuredClone(update))
    },
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
  await executor.executeCommand({
    source: 'toolbar',
    command: command as never,
  })
  expect(nodes[0].id).toBe('script-source')
  expect(nodes[0].contentData?.story_production).toEqual(storyProduction)
})
