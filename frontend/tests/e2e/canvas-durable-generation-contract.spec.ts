import { expect, test } from '@playwright/test'
import * as canvasCommands from '../../src/modules/canvas/canvas-commands'
import * as generationRuntime from '../../src/modules/canvas/generation-runtime-presentation'
import * as generationService from '../../src/modules/canvas/generation-service'
import type { GenerationJobResult } from '../../src/modules/canvas/generation-job-api'
import { applyGenerationNodeState } from '../../src/modules/canvas/generation-node-state'
import { createImageGenerationBatchPlan } from '../../src/modules/canvas/image-generation-batch'
import type { CanvasNode } from '../../src/types/canvas'

type SubmitGenerationJob = (
  input: {
    clientRequestId: string
    projectId: string
    canvasId: string
    nodeId: string
    mediaType: 'text' | 'script' | 'image' | 'video'
    modelId: string
    input: Record<string, unknown>
  },
  transport: {
    post: (path: string, payload: unknown) => Promise<{ data: Record<string, unknown> }>
  },
) => Promise<Record<string, unknown>>

type RestoreGenerationJobRuntime = (input: {
  projectId: string
  canvasId: string
  nodes: readonly CanvasNode[]
  statuses: Array<Record<string, unknown>>
}) => Map<string, Record<string, unknown>>

type CreateApplyGenerationJobResultCommand = (
  node: CanvasNode,
  expectedJobId: string,
  result: GenerationJobResult,
) => Record<string, unknown> | null

function requireContractFunction<T extends (...args: never[]) => unknown>(
  source: object,
  name: string,
  fingerprint: string,
): T {
  const candidate = (source as Record<string, unknown>)[name]
  expect(typeof candidate, fingerprint).toBe('function')
  return candidate as T
}

function generationCard(
  id: string,
  mediaType: 'text' | 'script' | 'image' | 'video',
  activeJobId: string,
): CanvasNode {
  return {
    id,
    type: mediaType === 'script' || mediaType === 'text' ? 'script' : 'generation',
    title: `${mediaType} card`,
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    content: 'Original',
    contentData: {
      subtype: mediaType === 'text' ? 'prompt' : mediaType,
      serialization_version: 1,
      text: 'Original',
      content_revision: 0,
      active_generation_job_id: activeJobId,
      active_generation_job_content_revision: 0,
      active_generation_media_type: mediaType,
    },
  }
}

test('text, script, image, and video submit through one compact durable v2 endpoint', async () => {
  const submitGenerationJob = requireContractFunction<SubmitGenerationJob>(
    generationService,
    'submitGenerationJob',
    'T6-007 RED [durable-generation-submit-client-absent]: submitGenerationJob is not implemented',
  )
  const calls: Array<{ path: string; payload: Record<string, unknown> }> = []
  const transport = {
    async post(path: string, payload: unknown) {
      const body = payload as Record<string, unknown>
      calls.push({ path, payload: body })
      return {
        data: {
          job_id: `job-${body.media_type}`,
          project_id: body.project_id,
          canvas_id: body.canvas_id,
          node_id: body.node_id,
          media_type: body.media_type,
          status: 'queued',
          model_id: body.model_id,
          version: 1,
        },
      }
    },
  }

  for (const [index, mediaType] of (['text', 'script', 'image', 'video'] as const).entries()) {
    const receipt = await submitGenerationJob({
      clientRequestId: `00000000-0000-4000-8000-00000000000${index + 1}`,
      projectId: 'project-a',
      canvasId: 'canvas-a',
      nodeId: `${mediaType}-card`,
      mediaType,
      modelId: 'allowed-model',
      input: { prompt: `${mediaType} prompt` },
    }, transport)
    expect(receipt).toMatchObject({
      job_id: `job-${mediaType}`,
      node_id: `${mediaType}-card`,
      status: 'queued',
      version: 1,
    })
    expect(receipt).not.toHaveProperty('generation_task')
    expect(receipt).not.toHaveProperty('request_parameters')
  }

  expect(calls.map((call) => call.path)).toEqual(Array(4).fill('/api/v2/generation-jobs'))
})

test('ambiguous legacy submit persists client binding before a job id and upgrades it on recovery', () => {
  const pending = applyGenerationNodeState(generationCard('image-node', 'image', ''), 'running', '', false, {
    clientRequestId: '00000000-0000-4000-8000-000000000001',
    mediaType: 'image',
  })
  expect(pending.contentData).toMatchObject({
    active_generation_client_request_id: '00000000-0000-4000-8000-000000000001',
    active_generation_media_type: 'image',
  })
  expect(pending.contentData?.active_generation_job_id).toBeUndefined()

  const recovered = applyGenerationNodeState(pending, 'running', '', false, {
    clientRequestId: '00000000-0000-4000-8000-000000000001',
    jobId: 'job-recovered',
    mediaType: 'image',
  })
  expect(recovered.contentData?.active_generation_job_id).toBe('job-recovered')

  const terminal = applyGenerationNodeState(recovered, 'failed')
  expect(terminal.contentData?.active_generation_job_id).toBeUndefined()
  expect(terminal.contentData?.active_generation_client_request_id).toBeUndefined()
})

test('refresh restoration is keyed by persisted project Canvas node and job identity for every media kind', () => {
  const restoreGenerationJobRuntime = requireContractFunction<RestoreGenerationJobRuntime>(
    generationRuntime,
    'restoreGenerationJobRuntime',
    'T6-007 RED [durable-generation-refresh-restore-absent]: restoreGenerationJobRuntime is not implemented',
  )
  const mediaTypes = ['text', 'script', 'image', 'video'] as const
  const nodes = mediaTypes.map((mediaType) => generationCard(
    `${mediaType}-card`,
    mediaType,
    `${mediaType}-job`,
  ))
  const statuses = mediaTypes.map((mediaType, index) => ({
    job_id: `${mediaType}-job`,
    node_id: `${mediaType}-card`,
    media_type: mediaType,
    status: 'running',
    stage: 'provider',
    progress: 20 + index,
    result_asset_id: null,
    error: null,
    version: index + 1,
    updated_at: '2026-07-23T12:00:00Z',
  }))

  const restored = restoreGenerationJobRuntime({
    projectId: 'project-a',
    canvasId: 'canvas-a',
    nodes,
    statuses,
  })

  expect([...restored.keys()]).toEqual(mediaTypes.map((mediaType) => `${mediaType}-card`))
  for (const mediaType of mediaTypes) {
    expect(restored.get(`${mediaType}-card`)).toMatchObject({
      jobId: `${mediaType}-job`,
      phase: 'running',
    })
  }
})

test('terminal result creates one stale-safe same-card command and never a hidden result node', () => {
  const createApplyGenerationJobResultCommand = requireContractFunction<CreateApplyGenerationJobResultCommand>(
    canvasCommands,
    'createApplyGenerationJobResultCommand',
    'T6-007 RED [same-card-generation-result-command-absent]: same-card result command is not implemented',
  )
  const card = generationCard('text-card', 'text', 'job-text')

  const result: GenerationJobResult = {
    job_id: 'job-text',
    node_id: 'text-card',
    result: { media_type: 'text', content: 'Generated on the same card' },
    version: 7,
  }
  const command = createApplyGenerationJobResultCommand(card, 'job-text', result)

  expect(command).toEqual({
    type: 'apply-generation-job-result',
    nodeId: 'text-card',
    expectedJobId: 'job-text',
    expectedContentRevision: 0,
    content: 'Generated on the same card',
    resultVersion: 7,
  })
  expect(command).not.toHaveProperty('resultNode')
  expect(card.id).toBe('text-card')
})

test('video terminal result updates the initiating card media without creating a Result node', () => {
  const createApplyGenerationJobResultCommand = requireContractFunction<CreateApplyGenerationJobResultCommand>(
    canvasCommands,
    'createApplyGenerationJobResultCommand',
    'T6-011 RED [same-card-video-result-command-absent]: video result mapping is not implemented',
  )
  const card = generationCard('video-card', 'video', 'job-video')
  const result: GenerationJobResult = {
    job_id: 'job-video',
    node_id: 'video-card',
    result: {
      media_type: 'video',
      asset_id: 'asset-video',
      url: 'https://media.revid.test/video.mp4',
    },
    version: 9,
  }

  expect(createApplyGenerationJobResultCommand(card, 'job-video', result)).toEqual({
    type: 'apply-generation-job-result',
    nodeId: 'video-card',
    expectedJobId: 'job-video',
    expectedContentRevision: 0,
    mediaType: 'video',
    assetId: 'asset-video',
    url: 'https://media.revid.test/video.mp4',
    resultVersion: 9,
  })
})

test('image batch keeps slot one on the initiating card and prepares sibling authoring cards without hidden results', () => {
  const source: CanvasNode = {
    id: 'image-card-1',
    type: 'generation',
    title: '图片批次',
    x: 0,
    y: 0,
    width: 340,
    height: 220,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      generation_parameters: {
        schema_version: 1,
        image: { aspect_ratio: '4:3', output_count: 4 },
      },
    },
  }
  const ids = ['image-card-2', 'image-card-3', 'image-card-4']
  const plan = createImageGenerationBatchPlan({
    sourceNode: source,
    existingNodes: [source],
    connections: [],
    slotCount: 4,
    batchId: '00000000-0000-4000-8000-000000000004',
    createId: () => ids.shift()!,
  })
  const cards = [source, ...plan.command.nodes]

  expect(cards.map((card) => card.id)).toEqual([
    'image-card-1',
    'image-card-2',
    'image-card-3',
    'image-card-4',
  ])
  expect(plan.slots.map((slot) => slot.nodeId)).toEqual(cards.map((card) => card.id))
  expect(cards.every((card) => card.type === 'generation')).toBe(true)
  expect(plan.command.nodes.every((card) => card.contentData?.materialized_result_node_id === undefined)).toBe(true)
})
