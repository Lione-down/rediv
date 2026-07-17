import { expect, test } from '@playwright/test'
import {
  createWorkflowMockRunController,
  preflightWorkflowBatch,
  resolveWorkflowTemplate,
  type WorkflowMockStorage,
} from '../../src/modules/canvas/workflow-orchestration'
import { parseGenerationCapabilities } from '../../src/modules/canvas/generation-parameters'
import { GENERATION_CAPABILITIES } from './canvas-generation-parameters-fixture'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

const PROJECT_ID = 'project-workflow'
const CANVAS_ID = 'canvas-workflow'
const capabilities = parseGenerationCapabilities(GENERATION_CAPABILITIES)

function generationNode(id: string, mediaType: 'image' | 'video', overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id,
    type: 'generation',
    title: `${mediaType}-${id}`,
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    content: 'cinematic harbor at dusk',
    contentData: { subtype: mediaType, serialization_version: 1 },
    ...overrides,
  }
}

function resultNode(id: string, sourceGenerationNodeId: string): CanvasNode {
  return {
    id,
    type: 'result',
    title: `result-${id}`,
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: `asset-${id}`,
      source_generation_node_id: sourceGenerationNodeId,
    },
  }
}

function connection(id: string, from: string, to: string, targetPort = 'media'): CanvasConnection {
  return {
    id,
    from,
    to,
    sourcePort: 'out',
    targetPort,
    status: 'active',
    active: true,
  }
}

function preflight(overrides: Partial<Parameters<typeof preflightWorkflowBatch>[0]> = {}) {
  const image = generationNode('generation-image', 'image')
  const video = generationNode('generation-video', 'video')
  const output = resultNode('result-image', image.id)
  return preflightWorkflowBatch({
    capabilities,
    canvasId: CANVAS_ID,
    connections: [connection('image-result', image.id, output.id), connection('result-video', output.id, video.id)],
    nodes: [video, output, image],
    projectId: PROJECT_ID,
    quotas: { image: 2, text: 9, video: 1 },
    selectedNodeIds: [video.id, image.id],
    template: { id: 'canvas-generation-batch', version: 1 },
    ...overrides,
  })
}

class MemoryStorage implements WorkflowMockStorage {
  values = new Map<string, string>()

  getItem(key: string) { return this.values.get(key) ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

test('workflow template and preflight remain exact, deterministic, scoped, and mutation-free', () => {
  expect(resolveWorkflowTemplate('canvas-generation-batch', 1)).toMatchObject({
    contract_version: 1,
    id: 'canvas-generation-batch',
    execution_mode: 'mock',
  })
  expect(resolveWorkflowTemplate('canvas-generation-batch', 2)).toBeNull()
  expect(resolveWorkflowTemplate('foreign-template', 1)).toBeNull()

  const first = preflight()
  const second = preflight({ selectedNodeIds: ['generation-image', 'generation-video'] })
  expect(first).toEqual(second)
  expect(first).toMatchObject({
    contract_version: 1,
    canvas_id: CANVAS_ID,
    project_id: PROJECT_ID,
    executable: true,
    execution_mode: 'mock',
    estimate: { image: 1, video: 1, total: 2 },
  })
  expect(first.steps.map((step) => [step.node_id, step.order, step.depends_on])).toEqual([
    ['generation-image', 1, []],
    ['generation-video', 2, ['generation-image']],
  ])
  expect(first.errors).toEqual([])
})

test('preflight fails closed for capability/quota/scope/graph errors without creating a run', () => {
  const missingCapability = preflight({ capabilities: null })
  expect(missingCapability).toMatchObject({ executable: false, steps: [] })
  expect(missingCapability.errors.map((error) => error.code)).toEqual(['capability_unavailable'])

  const quota = preflight({ quotas: { image: 0, text: 9, video: 0 } })
  expect(quota).toMatchObject({ executable: false, steps: [] })
  expect(quota.errors.map((error) => error.code)).toEqual(['quota_insufficient'])

  const duplicate = preflight({ selectedNodeIds: ['generation-image', 'generation-image'] })
  expect(duplicate.errors.map((error) => error.code)).toEqual(['duplicate_selection'])

  const foreign = preflight({ connections: [connection('foreign-link', 'outside-this-canvas', 'generation-video')] })
  expect(foreign.errors.map((error) => error.code)).toEqual(['foreign_endpoint'])

  const image = generationNode('generation-image', 'image')
  const video = generationNode('generation-video', 'video')
  const cycle = preflight({
    nodes: [image, video],
    connections: [
      connection('image-video', image.id, video.id),
      connection('video-image', video.id, image.id),
    ],
  })
  expect(cycle.errors.map((error) => error.code)).toEqual(['dependency_cycle'])

  const selfCycle = preflight({
    nodes: [image],
    connections: [connection('image-self', image.id, image.id)],
    selectedNodeIds: [image.id],
  })
  expect(selfCycle.errors.map((error) => error.code)).toEqual(['dependency_cycle'])

  const controller = createWorkflowMockRunController(new MemoryStorage())
  expect(() => controller.start(quota)).toThrow('工作流预检未通过')
  expect(controller.current()).toBeNull()
})

test('mock execution is explicit, cancel-safe, and recovered work remains paused until explicitly resumed', () => {
  const storage = new MemoryStorage()
  const controller = createWorkflowMockRunController(storage)
  const plan = preflight()

  const started = controller.start(plan)
  expect(started).toMatchObject({ state: 'running', execution_mode: 'mock' })
  expect(started.steps.map((step) => step.state)).toEqual(['running', 'queued'])
  expect(controller.currentFor(preflight({ canvasId: 'canvas-other' }))).toBeNull()
  expect(controller.advance()?.steps.map((step) => step.state)).toEqual(['succeeded', 'running'])
  expect(controller.cancel()).toMatchObject({ state: 'cancelled' })
  expect(controller.current()?.steps.map((step) => step.state)).toEqual(['succeeded', 'cancelled'])

  const resumable = createWorkflowMockRunController(storage)
  resumable.start(plan)
  const recovered = createWorkflowMockRunController(storage)
  expect(recovered.recover(plan)).toMatchObject({ state: 'paused' })
  expect(recovered.current()?.steps.map((step) => step.state)).toEqual(['paused', 'queued'])
  expect(recovered.resume(plan)).toMatchObject({ state: 'running' })
  expect(recovered.advance()?.steps.map((step) => step.state)).toEqual(['succeeded', 'running'])
  expect(recovered.advance()).toMatchObject({ state: 'succeeded' })

  storage.setItem(
    `revid:workflow-orchestration:v1:${PROJECT_ID}:${CANVAS_ID}`,
    JSON.stringify({ contract_version: 1, execution_mode: 'mock', project_id: PROJECT_ID, canvas_id: CANVAS_ID }),
  )
  expect(createWorkflowMockRunController(storage).recover(plan)).toBeNull()
})
