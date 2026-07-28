import { expect, test } from '@playwright/test'
import type { CanvasNode } from '../../src/types/canvas'
import { createStoryShotGenerationCommand } from '../../src/modules/canvas/story-shot-generation'
import {
  parseGenerationCapabilities,
  resolveGenerationRequestContext,
} from '../../src/modules/canvas/generation-parameters'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

const TEMPLATE_LINEAGE = {
  contract_version: 1,
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
    title: '模板脚本',
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
        shots: [
          {
            ...record,
            shot_id: 'shot-1',
            shot_number: 1,
            image_prompt: '镜头一',
            video_prompt: '镜头一视频',
            visual_description: '镜头一画面',
          },
          {
            ...record,
            shot_id: 'shot-2',
            shot_number: 2,
            image_prompt: '镜头二',
            video_prompt: '镜头二视频',
            visual_description: '镜头二画面',
          },
        ],
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

test('template-backed selected shots create one atomic Image graph with exact lineage and output count', () => {
  const source = sourceScript()
  let nextId = 0
  const command = createStoryShotGenerationCommand({
    sourceNode: source,
    existingNodes: [source],
    connections: [],
    shotIds: ['shot-1', 'shot-2'],
    options: {
      mediaType: 'image',
      aspectRatio: '16:9',
      imageSize: '2K',
      imageOutputCount: 4,
    },
    createId: () => `created-${++nextId}`,
  })

  expect(command?.type).toBe('insert-graph')
  expect(command?.nodes).toHaveLength(2)
  expect(command?.connections).toHaveLength(0)
  expect(command?.nodes.map((node) => node.contentData?.template_lineage)).toEqual([
    { ...TEMPLATE_LINEAGE, shot_id: 'shot-1' },
    { ...TEMPLATE_LINEAGE, shot_id: 'shot-2' },
  ])
  expect(command?.nodes.map((node) => (
    (node.contentData?.generation_parameters as Record<string, any>).image.output_count
  ))).toEqual([4, 4])
  const requestContext = resolveGenerationRequestContext(
    command!.nodes[0],
    'image',
    [source, ...command!.nodes],
    command!.connections,
    parseGenerationCapabilities(GENERATION_CAPABILITIES_V6),
  )
  expect(requestContext.parameterError).toBe('')
  expect(requestContext.templateLineage).toEqual({
    ...TEMPLATE_LINEAGE,
    shot_id: 'shot-1',
  })
})

test('mismatched template Script lineage fails closed before creating cards', () => {
  const source = sourceScript()
  const production = source.contentData?.story_production as Record<string, any>
  production.template_lineage = {
    ...TEMPLATE_LINEAGE,
    script_node_id: 'foreign-script',
  }

  expect(createStoryShotGenerationCommand({
    sourceNode: source,
    existingNodes: [source],
    connections: [],
    shotIds: ['shot-1'],
    options: {
      mediaType: 'image',
      aspectRatio: '16:9',
      imageSize: '2K',
      imageOutputCount: 1,
    },
  })).toBeNull()
})
