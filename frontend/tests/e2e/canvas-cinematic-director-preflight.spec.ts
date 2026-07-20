import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'
import {
  buildCinematicDirectorHandoff,
  parseCinematicDirectorPreflight,
  requestCinematicDirectorPreflight,
  type CinematicDirectorPreflightInput,
} from '../../src/modules/canvas/cinematic-director-preflight'

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const input: CinematicDirectorPreflightInput = {
  projectId: 'project-a', canvasId: 'canvas-a', canvasRevision: 7,
  skillId: 'revid.cinema-video', providerId: 'agnes', modelId: 'agnes-video-v2.0',
  userInstruction: '低机位跟随角色穿过雨夜站台，最后停在列车门前', mentions: [],
  generationParameters: { duration_seconds: 5, reference_mode: 'text-to-video' },
  workflowMode: 'standalone_clip', directorBrief: null, sequenceContext: null, retakeContext: null,
}

function response(ready = true) {
  const issues = ready ? [] : [{ code: 'director_brief_required', message: 'Add an explicit director brief before handoff.' }]
  const canonicalRequest = {
    skill_id: 'revid.cinema-video', skill_version: 2, policy_version: 2,
    workflow_mode: 'standalone_clip', scope: { project_id: 'project-a', canvas_id: 'canvas-a', canvas_revision: 7 },
    provider: { provider_id: 'agnes', model_id: 'agnes-video-v2.0', capability_version: 1 },
    user_instruction: input.userInstruction,
    instruction_precedence: [
      'current_user_instruction', 'reference_transfer', 'accepted_canon', 'current_node_parameters',
      'director_policy', 'provider_defaults',
    ].map((source, index) => ({ rank: index + 1, source })),
    director_brief: null, director_coherence: ready ? 'standalone_fast_lane' : 'director_brief_required',
    references: [], sequence_context: null, retake_context: null, image_ids: [],
    parameters: input.generationParameters,
    supported_control_mapping: { duration_seconds: 'duration', reference_mode: 'reference-mode' },
    optimized_prompt: `当前明确指令：${input.userInstruction}\n导演政策：保持显式指令`,
    constraint_envelope: {}, warnings: [], conflicts: [], recommendations: issues,
  }
  const canonicalRequestJson = canonical(canonicalRequest)
  return {
    contract_version: 2, skill: { id: 'revid.cinema-video', version: 2 }, workflow_mode: 'standalone_clip',
    project_id: 'project-a', canvas_id: 'canvas-a', canvas_revision: 7,
    provider_id: 'agnes', model_id: 'agnes-video-v2.0', capability_version: 1,
    director_coherence: ready ? 'standalone_fast_lane' : 'director_brief_required', references: [],
    warnings: [], conflicts: [], recommendations: issues, ready_for_handoff: ready,
    canonical_request: canonicalRequest, canonical_request_json: canonicalRequestJson,
    exact_request: canonicalRequestJson,
    request_digest: createHash('sha256').update(canonicalRequestJson).digest('hex'),
    requires_acknowledgement: false,
  }
}

test('v2 client posts only the exact existing preflight payload and verifies its digest', async () => {
  const calls: Array<{ path: string; payload: unknown }> = []
  const transport = {
    get: async <T>() => ({ data: {} as T }),
    post: async <T>(path: string, payload: unknown) => {
      calls.push({ path, payload })
      return { data: response() as T }
    },
  }
  const preflight = await requestCinematicDirectorPreflight(input, transport)
  const handoff = buildCinematicDirectorHandoff(input, preflight)

  expect(calls).toEqual([{
    path: '/api/projects/project-a/canvases/canvas-a/agent-skills/cinematic-preflight',
    payload: {
      skill_id: 'revid.cinema-video', skill_version: 2, canvas_revision: 7,
      provider_id: 'agnes', model_id: 'agnes-video-v2.0', user_instruction: input.userInstruction,
      mentions: [], generation_parameters: input.generationParameters, workflow_mode: 'standalone_clip',
      director_brief: null, sequence_context: null, retake_context: null,
    },
  }])
  expect(handoff.submitted_preflight.canonical_request).toEqual(preflight.canonical_request)
  expect(handoff.submitted_preflight.request_digest).toBe(preflight.request_digest)
})

test('v2 client rejects hidden fields, exact request drift, and non-ready handoff', () => {
  const valid = response()
  expect(() => parseCinematicDirectorPreflight({ ...valid, execute: true }, input)).toThrow('cinematic director')
  expect(() => parseCinematicDirectorPreflight({ ...valid, exact_request: `${valid.exact_request} ` }, input)).toThrow('cinematic director')
  const needsBrief = parseCinematicDirectorPreflight(response(false), input)
  expect(needsBrief.recommendations.map((item) => item.code)).toEqual(['director_brief_required'])
  expect(() => buildCinematicDirectorHandoff(input, needsBrief)).toThrow('cinematic director')
})
