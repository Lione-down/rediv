import { expect, test } from '@playwright/test'
import {
  buildCinematicReferenceTransfer,
  buildCinematicRetakeDraft,
  resolveCinematicReferenceAvailability,
  resolveCinematicTakeActions,
} from '../../src/modules/canvas/cinematic-director-ux'
import type { CinematicModelCapability, CinematicSkillSource } from '../../src/modules/canvas/cinematic-skills'
import { prepareCinematicGeneration } from '../../src/modules/canvas/cinematic-skills'

const model: CinematicModelCapability = {
  id: 'agnes-video-v2.0', media_type: 'video', user_selectable: true, automatic_routing: false,
  accepted_reference_media: ['image', 'text'],
  accepted_reference_roles: ['identity', 'first-frame', 'last-frame', 'action'],
  max_references: 8,
  supported_controls: ['duration', 'reference-mode', 'shot-controls', 'temporal'],
}

function source(subtype: string): CinematicSkillSource {
  return {
    node_id: `node-${subtype}`, title: subtype, node_type: 'asset', subtype,
    source_revision: 'a'.repeat(64),
  }
}

test('reference availability exposes exact backend-catalog role and media reasons', () => {
  expect(resolveCinematicReferenceAvailability(model, source('image'), 'identity')).toEqual({
    isSupported: true, reason: '可作为 identity 引用。',
  })
  expect(resolveCinematicReferenceAvailability(model, source('audio'), 'action')).toEqual({
    isSupported: false, reason: '当前 provider/model 不支持 audio 引用。',
  })
  expect(resolveCinematicReferenceAvailability(model, source('image'), 'product')).toEqual({
    isSupported: false, reason: '当前 provider/model 不支持 product 角色。',
  })
})

test('v2 reference binds ordered identity, one role, revision, instruction, and bounded exclusions', () => {
  expect(buildCinematicReferenceTransfer({
    source: source('image'), role: 'identity', instruction: '只保留角色身份',
    mustNotTransfer: ['background', 'camera'],
  })).toEqual({
    node_id: 'node-image', role: 'identity', instruction: '只保留角色身份',
    must_not_transfer: ['background', 'camera'], source_revision: 'a'.repeat(64),
  })
  expect(() => buildCinematicReferenceTransfer({
    source: source('image'), role: 'identity', instruction: '保持身份',
    mustNotTransfer: ['background', 'background'],
  })).toThrow('cinematic director reference transfer is invalid')
})

test('take actions are progressive and reroll or rewrite creates preflight intent only', () => {
  expect(resolveCinematicTakeActions('video', true)).toEqual([
    ['keep', true], ['fix_in_post', true], ['edit', true], ['reroll', true], ['rewrite', true],
  ])
  const reroll = buildCinematicRetakeDraft({
    decision: 'reroll', priorTaskId: 'task-1', priorResultNodeId: 'result-1',
    problemCategory: 'camera', repairVariable: 'camera movement', attemptCount: 1,
  })
  expect(reroll).toEqual(expect.objectContaining({
    workflowMode: 'retake', executionRequested: false,
    context: expect.objectContaining({ decision: 'reroll', repair_variable: 'camera movement' }),
  }))
  expect(() => buildCinematicRetakeDraft({
    decision: 'rewrite', priorTaskId: 'task-1', priorResultNodeId: 'result-1',
    problemCategory: 'action', repairVariable: 'action timing', attemptCount: 9,
    revisedInstruction: '只调整动作节奏',
  })).toThrow('cinematic director retake is invalid')
})

test('explicit Send preparation uses active v2 preflight while provider and model remain settings-owned', async () => {
  const calls: Array<{ path: string; payload: Record<string, unknown> }> = []
  const transport = {
    get: async <T>(path: string) => ({ data: (path.endsWith('/cinematic-sources')
      ? { canvas_revision: 4, items: [] }
      : { contract_version: 1, providers: [{
          id: 'agnes', capability_version: 1, billing_responsibility: 'platform',
          requires_acknowledgement: false, models: [model],
        }] }) as T }),
    post: async <T>(path: string, rawPayload: unknown) => {
      const payload = rawPayload as Record<string, unknown>
      calls.push({ path, payload })
      const canonical = {
        skill_id: 'revid.cinema-video', skill_version: 2, policy_version: 2,
        workflow_mode: 'standalone_clip',
        scope: { project_id: 'project-1', canvas_id: 'canvas-1', canvas_revision: 4 },
        provider: { provider_id: 'agnes', model_id: 'agnes-video-v2.0', capability_version: 1 },
        user_instruction: payload.user_instruction,
        instruction_precedence: ['current_user_instruction', 'reference_transfer', 'accepted_canon', 'current_node_parameters', 'director_policy', 'provider_defaults'].map((source, index) => ({ rank: index + 1, source })),
        director_brief: null, director_coherence: 'standalone_fast_lane', references: [],
        sequence_context: null, retake_context: null, image_ids: [],
        parameters: payload.generation_parameters,
        supported_control_mapping: { duration_seconds: 'duration', reference_mode: 'reference-mode' },
        optimized_prompt: 'exact optimized prompt', constraint_envelope: {},
        warnings: [], conflicts: [], recommendations: [],
      }
      const canonicalJson = JSON.stringify(canonical, Object.keys(canonical).sort())
      const stable = (value: unknown): string => Array.isArray(value)
        ? `[${value.map(stable).join(',')}]`
        : value && typeof value === 'object'
          ? `{${Object.keys(value as object).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`
          : JSON.stringify(value)
      const exact = stable(canonical)
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(exact))
      const digest = [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
      expect(canonicalJson).not.toBe('')
      return { data: {
        contract_version: 2, skill: { id: 'revid.cinema-video', version: 2 },
        workflow_mode: 'standalone_clip', project_id: 'project-1', canvas_id: 'canvas-1', canvas_revision: 4,
        provider_id: 'agnes', model_id: 'agnes-video-v2.0', capability_version: 1,
        director_coherence: 'standalone_fast_lane', references: [], warnings: [], conflicts: [], recommendations: [],
        ready_for_handoff: true, canonical_request: canonical, canonical_request_json: exact,
        exact_request: exact, request_digest: digest, requires_acknowledgement: false,
      } as T }
    },
  }
  const prepared = await prepareCinematicGeneration({
    projectId: 'project-1', canvasId: 'canvas-1', mediaType: 'video',
    userInstruction: '保持用户选择的 provider 和 model',
    rawSettings: {
      contract_version: 1, enabled: true, skill_id: 'revid.cinema-video', skill_version: 2,
      provider_id: 'agnes', model_id: 'agnes-video-v2.0', mentions: [],
    },
    generationParameters: { duration_seconds: 5, reference_mode: 'text-to-video' },
  }, transport)
  expect(calls).toHaveLength(1)
  expect(calls[0].payload).toEqual(expect.objectContaining({
    skill_version: 2, provider_id: 'agnes', model_id: 'agnes-video-v2.0', workflow_mode: 'standalone_clip',
  }))
  expect(prepared?.handoff).toEqual(expect.objectContaining({
    skill_version: 2, provider_id: 'agnes', model_id: 'agnes-video-v2.0', workflow_mode: 'standalone_clip',
  }))
})
