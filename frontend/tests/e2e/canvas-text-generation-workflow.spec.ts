import { expect, test } from '@playwright/test'
import { reactive } from 'vue'
import { createCanvasCommandExecutor } from '../../src/modules/canvas/canvas-command-executor'
import * as canvasCommands from '../../src/modules/canvas/canvas-commands'
import { parseGenerationCapabilities } from '../../src/modules/canvas/generation-parameters'
import type { GenerationJobResult } from '../../src/modules/canvas/generation-job-api'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

type TextWorkflowMode = 'text-to-video' | 'image-to-prompt' | 'text-to-music'

type SetTextCardContentCommand = {
  type: 'set-text-card-content'
  nodeId: string
  expectedContent: string
  content: string
  expectedContentRevision: number
}

type BindTextGenerationJobCommand = {
  type: 'bind-text-generation-job'
  nodeId: string
  expectedContentRevision: number
  jobId: string
  mode: TextWorkflowMode
  modelId: string
}

type ApplyGenerationJobResultCommand = {
  type: 'apply-generation-job-result'
  nodeId: string
  expectedJobId: string
  expectedContentRevision: number
  content: string
  resultVersion: number
}

function requireCommand<T extends (...args: never[]) => unknown>(name: string): T {
  const candidate = (canvasCommands as Record<string, unknown>)[name]
  expect(typeof candidate, `T6-011 RED [${name}-absent]`).toBe('function')
  return candidate as T
}

function textNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'text-card',
    type: 'script',
    title: 'Text card',
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    content: '',
    contentData: { subtype: 'prompt', serialization_version: 1, content_revision: 0 },
    ...overrides,
  }
}

function executorFor(nodes: CanvasNode[]) {
  const connections = reactive<CanvasConnection[]>([])
  return createCanvasCommandExecutor({
    getNodes: () => nodes,
    getConnections: () => connections,
    createNode: async () => { throw new Error('not expected') },
    createConnection: async () => { throw new Error('not expected') },
    deleteNode: async () => undefined,
    deleteConnection: async () => undefined,
    updateConnection: async () => undefined,
    updateNodeParent: async () => undefined,
    updateNodeLocked: async () => undefined,
    updateNodeState: async (nodeId, updates) => {
      Object.assign(nodes.find((node) => node.id === nodeId)!, structuredClone(updates))
    },
    queueNodeMove: () => undefined,
    setSelection: () => undefined,
    selectConnection: () => undefined,
  })
}

test('text capability v2 exposes explicit allowed models and workflow modes', () => {
  const contract = structuredClone(GENERATION_CAPABILITIES_V6) as unknown as Record<string, unknown>
  contract.text = {
    contract_version: 2,
    available: true,
    models: [{
      id: 'agnes-2.0-flash',
      label: 'Agnes 2.0 Flash',
      workflow_modes: ['text-to-video'],
    }],
    intents: ['script_draft', 'script_refine'],
    locales: ['zh-CN', 'en-US'],
    default_locale: 'zh-CN',
    brief_max_length: 4000,
    source_max_length: 12000,
    output_max_length: 12000,
    creates_media: false,
    runs_cinematic_decomposition: false,
  }

  const parsed = parseGenerationCapabilities(contract)

  expect(parsed.text).toMatchObject({
    contractVersion: 2,
    model: 'agnes-2.0-flash',
    modelLabel: 'Agnes 2.0 Flash',
    models: [{
      id: 'agnes-2.0-flash',
      label: 'Agnes 2.0 Flash',
      workflowModes: ['text-to-video'],
    }],
  })
})

test('direct text editing and generation binding are typed revision-safe commands', async () => {
  const createSetTextCardContentCommand = requireCommand<(
    nodes: readonly CanvasNode[], nodeId: string, content: string,
  ) => SetTextCardContentCommand | null>('createSetTextCardContentCommand')
  const createBindTextGenerationJobCommand = requireCommand<(
    nodes: readonly CanvasNode[], nodeId: string, input: {
      expectedContentRevision: number
      jobId: string
      mode: TextWorkflowMode
      modelId: string
    },
  ) => BindTextGenerationJobCommand | null>('createBindTextGenerationJobCommand')
  const nodes = reactive([textNode()])
  const executor = executorFor(nodes)

  const edit = createSetTextCardContentCommand(nodes, 'text-card', 'A quiet train at night')
  expect(edit).toMatchObject({
    type: 'set-text-card-content',
    expectedContent: '',
    expectedContentRevision: 0,
  })
  await executor.executeCommand({ source: 'keyboard', command: edit! as never })
  expect(nodes[0]).toMatchObject({
    content: 'A quiet train at night',
    contentData: { text: 'A quiet train at night', content_revision: 1 },
  })

  const binding = createBindTextGenerationJobCommand(nodes, 'text-card', {
    expectedContentRevision: 1,
    jobId: 'job-text-1',
    mode: 'text-to-video',
    modelId: 'agnes-2.0-flash',
  })
  await executor.executeCommand({ source: 'toolbar', command: binding! as never })
  expect(nodes[0].contentData).toMatchObject({
    active_generation_job_id: 'job-text-1',
    active_generation_job_content_revision: 1,
    active_generation_media_type: 'text',
    active_generation_mode: 'text-to-video',
    active_generation_model_id: 'agnes-2.0-flash',
  })
})

test('same-card result application rejects stale content without losing the recoverable job binding', async () => {
  const createApplyGenerationJobResultCommand = requireCommand<(
    node: CanvasNode,
    expectedJobId: string,
    result: GenerationJobResult,
  ) => ApplyGenerationJobResultCommand | null>('createApplyGenerationJobResultCommand')
  const nodes = reactive([textNode({
    content: 'Original',
    contentData: {
      subtype: 'prompt',
      serialization_version: 1,
      text: 'Original',
      content_revision: 3,
      active_generation_job_id: 'job-text-1',
      active_generation_job_content_revision: 3,
      active_generation_mode: 'text-to-video',
      active_generation_model_id: 'agnes-2.0-flash',
    },
  })])
  const result: GenerationJobResult = {
    job_id: 'job-text-1',
    node_id: 'text-card',
    result: { media_type: 'text', content: 'Generated on the same card' },
    version: 4,
  }
  const executor = executorFor(nodes)

  const command = createApplyGenerationJobResultCommand(nodes[0], 'job-text-1', result)
  expect(command).toMatchObject({
    type: 'apply-generation-job-result',
    expectedContentRevision: 3,
    content: 'Generated on the same card',
  })

  nodes[0].content = 'User edited while generation ran'
  nodes[0].contentData = { ...nodes[0].contentData, text: nodes[0].content, content_revision: 4 }
  await executor.executeCommand({ source: 'toolbar', command: command! as never })
  expect(nodes[0].content).toBe('User edited while generation ran')
  expect(nodes[0].contentData?.active_generation_job_id).toBe('job-text-1')

  nodes[0].content = 'Original'
  nodes[0].contentData = { ...nodes[0].contentData, text: 'Original', content_revision: 3 }
  await executor.executeCommand({ source: 'toolbar', command: command! as never })
  expect(nodes[0]).toMatchObject({
    content: 'Generated on the same card',
    contentData: {
      text: 'Generated on the same card',
      content_revision: 4,
      last_generation_job_id: 'job-text-1',
      last_generation_result_version: 4,
    },
  })
  expect(nodes[0].contentData?.active_generation_job_id).toBeUndefined()
})
