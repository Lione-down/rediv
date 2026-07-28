import { expect, test } from '@playwright/test'
import type { CanvasNode } from '../../src/types/canvas'
import {
  parseGenerationCapabilities,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import { requestCanvasGeneration } from '../../src/modules/canvas/generation-service'
import { createStoryShotGenerationCommand } from '../../src/modules/canvas/story-shot-generation'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

const TEMPLATE_LINEAGE = {
  contract_version: 1 as const,
  template_id: 'revid.product-ad',
  template_version: 1,
  instance_id: 'instance-1',
  instance_step_id: 'instance-step-1',
  step_id: 'compile-story',
  script_node_id: 'script-1',
}

function sourceScript(): CanvasNode {
  const record = {
    editable_fields: {},
    locked_fields: {
      user_confirmation: true,
      prompt_confirmation: true,
    },
    generation_revision: 1,
    source_ids: ['script-1'],
    validation_state: 'valid',
  }
  return {
    id: 'script-1',
    type: 'script',
    title: 'Template Script',
    content: '',
    contentData: {
      serialization_version: 1,
      subtype: 'script',
      workflow_template_lineage: TEMPLATE_LINEAGE,
      story_production: {
        schema_id: 'revid.story-production',
        schema_version: 1,
        skill_id: 'revid.story-director',
        skill_version: 1,
        source_node_id: 'script-1',
        source_revision: 'b'.repeat(64),
        model_id: 'agnes-2.5-flash',
        template_lineage: TEMPLATE_LINEAGE,
        shots: [{
          ...record,
          shot_id: 'shot-1',
          shot_number: 1,
          image_prompt: 'Approved image prompt',
          video_prompt: 'Approved video prompt',
          visual_description: 'Approved shot',
        }],
      },
    },
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    zIndex: 0,
    isLocked: false,
    isCollapsed: false,
  }
}

test('template-backed Video carries exact shot lineage through the provider-valid request', async () => {
  const source = sourceScript()
  const command = createStoryShotGenerationCommand({
    sourceNode: source,
    existingNodes: [source],
    connections: [],
    shotIds: ['shot-1'],
    options: {
      mediaType: 'video',
      aspectRatio: '16:9',
      durationSeconds: 5,
      videoResolution: '720p',
      videoMode: 'text-to-video',
    },
    createId: () => 'video-1',
  })

  expect(command?.nodes).toHaveLength(1)
  expect(command?.connections).toHaveLength(0)
  const video = command!.nodes[0]
  const context = resolveGenerationRequestContext(
    video,
    'video',
    [source, video],
    command!.connections,
    parseGenerationCapabilities(GENERATION_CAPABILITIES_V6),
  )
  expect(context.parameterError).toBe('')
  expect(context.templateLineage).toEqual({
    ...TEMPLATE_LINEAGE,
    shot_id: 'shot-1',
  })
  expect(context.referenceMode).toBe('text-to-video')
  expect(context.videoReferences).toEqual([])

  let submitted: Record<string, unknown> | null = null
  await requestCanvasGeneration({
    mediaType: 'video',
    clientRequestId: 'request-1',
    projectId: 'project-1',
    originCanvasId: 'canvas-1',
    canvasNodeId: video.id,
    prompt: context.prompt,
    templateLineage: context.templateLineage,
    videoReferences: context.videoReferences,
    aspectRatio: context.aspectRatio,
    durationSeconds: context.durationSeconds,
    videoResolution: context.videoResolution,
  }, {
    quotas: { text: 1, image: 1, video: 1 },
    quotaRevision: 1,
    applyQuotaSnapshot: () => true,
  }, {
    async post(_path, payload) {
      submitted = payload as Record<string, unknown>
      return {
        data: {
          asset: {
            id: 'asset-video',
            user_id: 'owner-1',
            project_id: 'project-1',
            origin_canvas_id: 'canvas-1',
            canvas_node_id: video.id,
            type: 'video',
            source: 'generation',
            source_model: 'agnes-video-v2.0',
            source_task_id: 'task-1',
            status: 'active',
            url: 'https://fixture.invalid/video.mp4',
            content_text: null,
            created_at: '2026-07-29T00:00:00Z',
            updated_at: '2026-07-29T00:00:00Z',
          },
          generation_task: {
            id: 'task-1',
            user_id: 'owner-1',
            project_id: 'project-1',
            origin_canvas_id: 'canvas-1',
            canvas_node_id: video.id,
            media_type: 'video',
            provider: 'agnes',
            model: 'agnes-video-v2.0',
            status: 'succeeded',
            client_request_id: 'request-1',
            request_parameters: {
              contract_version: 1,
              media_type: 'video',
              model: 'agnes-video-v2.0',
              reference_mode: 'text-to-video',
              duration_seconds: 5,
              num_frames: 121,
              frame_rate: 24,
              aspect_ratio: '16:9',
              width: 1152,
              height: 648,
              image_ids: [],
              video_references: [],
              template_lineage: {
                ...TEMPLATE_LINEAGE,
                shot_id: 'shot-1',
              },
            },
            result_asset_id: 'asset-video',
          },
          quotas: { text: 1, image: 1, video: 0 },
          quota_revision: 2,
        },
      } as never
    },
  })

  expect(submitted).toEqual(expect.objectContaining({
    template_lineage: {
      ...TEMPLATE_LINEAGE,
      shot_id: 'shot-1',
    },
    video_references: [],
  }))
  expect(submitted).not.toHaveProperty('image_ids')
  expect(submitted).not.toHaveProperty('workflow_run')
})
