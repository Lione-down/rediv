import { expect, test } from '@playwright/test'
import {
  buildCinematicMention,
  loadCinematicSkillCapabilities,
  loadCinematicSkillSources,
  parseCinematicSkillCapabilities,
  parseCinematicSkillNodeSettings,
  parseCinematicSkillPreflight,
  prepareCinematicGeneration,
  requestCinematicSkillPreflight,
} from '../../src/modules/canvas/cinematic-skills'

const capabilities = {
  contract_version: 1,
  providers: [{
    id: 'agnes',
    capability_version: 1,
    billing_responsibility: 'platform',
    requires_acknowledgement: false,
    models: [
      { id: 'agnes-2.0-flash', media_type: 'text', user_selectable: true, automatic_routing: false },
      { id: 'agnes-image-2.1-flash', media_type: 'image', user_selectable: true, automatic_routing: false },
      { id: 'agnes-video-v2.0', media_type: 'video', user_selectable: true, automatic_routing: false },
    ],
  }],
}

test('cinematic capability parsing keeps provider and model choice user-owned', () => {
  const parsed = parseCinematicSkillCapabilities(capabilities)
  expect(parsed.providers[0].models.map((model) => model.id)).toEqual([
    'agnes-2.0-flash', 'agnes-image-2.1-flash', 'agnes-video-v2.0',
  ])
  expect(parsed.providers[0].models.every((model) => model.user_selectable && !model.automatic_routing)).toBeTruthy()
  expect(() => parseCinematicSkillCapabilities({
    ...capabilities,
    providers: [{ ...capabilities.providers[0], models: [{ ...capabilities.providers[0].models[0], automatic_routing: true }] }],
  })).toThrow('cinematic Skill capability')
})

test('user-billed capability requires active server acknowledgement before preflight', async () => {
  let acknowledgementActive = false
  let postCount = 0
  const transport = {
    get: async <T>(path: string) => {
      if (path.includes('provider-cost-acknowledgements')) return { data: {
        user_id: 'user-a', provider_id: 'agnes', acknowledged_until: null, cancelled_at: null,
        active: acknowledgementActive,
      } as T }
      if (path.endsWith('/cinematic-sources')) return { data: { canvas_revision: 3, items: [] } as T }
      return { data: {
        ...capabilities,
        providers: [{ ...capabilities.providers[0], requires_acknowledgement: true }],
      } as T }
    },
    post: async <T>(_path: string, _payload: unknown) => {
      postCount += 1
      const canonicalRequest = {
        skill_id: 'revid.cinema-image', skill_version: 1, provider_id: 'agnes',
        model_id: 'agnes-image-2.1-flash', optimized_prompt: 'optimized', references: [], image_ids: [],
        parameters: { image_ids: [], aspect_ratio: '4:3' },
      }
      const exact = JSON.stringify(canonicalRequest)
      return { data: {
        contract_version: 1, skill: { id: 'revid.cinema-image', version: 1 },
        project_id: 'project-a', canvas_id: 'canvas-a', canvas_revision: 3,
        provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', capability_version: 1,
        references: [], summary: { preserved_attributes: [], allowed_changes: [], conflicts: [] },
        canonical_request: canonicalRequest, canonical_request_json: exact, exact_request: exact,
        request_digest: 'c'.repeat(64), requires_acknowledgement: true,
      } as T }
    },
  }
  const input = {
    projectId: 'project-a', canvasId: 'canvas-a', mediaType: 'image' as const,
    userInstruction: 'create image',
    rawSettings: {
      contract_version: 1, enabled: true, skill_id: 'revid.cinema-image', skill_version: 1,
      provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', mentions: [],
    },
    generationParameters: { image_ids: [], aspect_ratio: '4:3' },
  }
  await expect(prepareCinematicGeneration(input, transport)).rejects.toThrow('需要计费确认')
  expect(postCount).toBe(0)
  acknowledgementActive = true
  expect((await prepareCinematicGeneration(input, transport))?.optimizedPrompt).toBe('optimized')
  expect(postCount).toBe(1)
})

test('structured mentions keep stable node identity separate from display text', () => {
  const mention = buildCinematicMention({
    nodeId: 'node-character',
    title: '角色参考',
    role: 'identity',
    instruction: '保持脸型、发型和服装',
    sourceRevision: 'a'.repeat(64),
  })
  expect(mention).toEqual({
    node_id: 'node-character',
    display_title: '角色参考',
    role: 'identity',
    instruction: '保持脸型、发型和服装',
    source_revision: 'a'.repeat(64),
  })
  expect({ ...mention, display_title: '已重命名角色' }).toMatchObject({ node_id: 'node-character' })
  expect(() => buildCinematicMention({
    nodeId: '', title: '无效', role: 'identity', instruction: 'x', sourceRevision: 'a'.repeat(64),
  })).toThrow('cinematic Skill mention')
})

test('node settings persist exact structured bindings without display-text identity', () => {
  const settings = parseCinematicSkillNodeSettings({
    contract_version: 1,
    enabled: true,
    skill_id: 'revid.cinema-image',
    skill_version: 1,
    provider_id: 'agnes',
    model_id: 'agnes-image-2.1-flash',
    mentions: [{
      node_id: 'node-character', role: 'identity', instruction: '保持身份', source_revision: 'a'.repeat(64),
    }],
  }, 'image')
  expect(settings.mentions[0]).toEqual({
    node_id: 'node-character', role: 'identity', instruction: '保持身份', source_revision: 'a'.repeat(64),
  })
  expect(settings.mentions[0]).not.toHaveProperty('display_title')
  expect(() => parseCinematicSkillNodeSettings({ ...settings, model_id: '' }, 'image'))
    .toThrow('cinematic Skill mention')
  expect(() => parseCinematicSkillNodeSettings({ ...settings, remote_skill_url: 'https://example.test' }, 'image'))
    .toThrow('cinematic Skill mention')
})

test('preflight parser rejects request drift and hidden execution fields', () => {
  const canonicalRequest = {
    skill_id: 'revid.cinema-image', skill_version: 1,
    provider_id: 'agnes', model_id: 'agnes-image-2.1-flash',
    optimized_prompt: '保持角色身份。', image_ids: ['asset-a'],
    references: [{ node_id: 'node-a', role: 'identity', instruction: '保持角色身份', source_revision: 'a'.repeat(64), asset_id: 'asset-a' }],
    parameters: { aspect_ratio: '4:3' },
  }
  const exactRequest = JSON.stringify(canonicalRequest)
  const response = {
    contract_version: 1,
    skill: { id: 'revid.cinema-image', version: 1 },
    project_id: 'project-a', canvas_id: 'canvas-a', canvas_revision: 4,
    provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', capability_version: 1,
    references: canonicalRequest.references,
    summary: { preserved_attributes: ['identity'], allowed_changes: [], conflicts: [] },
    canonical_request: canonicalRequest,
    canonical_request_json: exactRequest,
    exact_request: exactRequest,
    request_digest: 'b'.repeat(64),
    requires_acknowledgement: false,
  }
  expect(parseCinematicSkillPreflight(response, {
    projectId: 'project-a', canvasId: 'canvas-a', skillId: 'revid.cinema-image', skillVersion: 1,
  }).canonical_request).toEqual(canonicalRequest)
  expect(() => parseCinematicSkillPreflight({ ...response, exact_request: `${exactRequest} ` }, {
    projectId: 'project-a', canvasId: 'canvas-a', skillId: 'revid.cinema-image', skillVersion: 1,
  })).toThrow('cinematic Skill preflight')
  expect(() => parseCinematicSkillPreflight({ ...response, automatic_retry: true }, {
    projectId: 'project-a', canvasId: 'canvas-a', skillId: 'revid.cinema-image', skillVersion: 1,
  })).toThrow('cinematic Skill preflight')
})

test('cinematic discovery and preflight stay on the authenticated Canvas Agent Skill boundary', async () => {
  const calls: Array<{ method: string; path: string; payload?: unknown }> = []
  const canonicalRequest = {
    skill_id: 'revid.cinema-image', skill_version: 1,
    provider_id: 'agnes', model_id: 'agnes-image-2.1-flash',
    optimized_prompt: '保持角色身份。', image_ids: ['asset-a'], references: [], parameters: { aspect_ratio: '4:3' },
  }
  const exactRequest = JSON.stringify(canonicalRequest)
  const transport = {
    get: async <T>(path: string) => {
      calls.push({ method: 'get', path })
      if (path.endsWith('/cinematic-sources')) return { data: {
        canvas_revision: 4,
        items: [{
          node_id: 'node-a', title: '角色参考', node_type: 'asset', subtype: 'image', source_revision: 'a'.repeat(64),
        }],
      } as T }
      return { data: capabilities as T }
    },
    post: async <T>(path: string, payload: unknown) => {
      calls.push({ method: 'post', path, payload })
      return { data: {
        contract_version: 1,
        skill: { id: 'revid.cinema-image', version: 1 },
        project_id: 'project-a', canvas_id: 'canvas-a', canvas_revision: 4,
        provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', capability_version: 1,
        references: [], summary: { preserved_attributes: [], allowed_changes: [], conflicts: [] },
        canonical_request: canonicalRequest, canonical_request_json: exactRequest, exact_request: exactRequest,
        request_digest: 'b'.repeat(64), requires_acknowledgement: false,
      } as T }
    },
  }

  await loadCinematicSkillCapabilities('project-a', 'canvas-a', transport)
  const sources = await loadCinematicSkillSources('project-a', 'canvas-a', transport)
  await requestCinematicSkillPreflight({
    projectId: 'project-a', canvasId: 'canvas-a', canvasRevision: sources.canvas_revision,
    skillId: 'revid.cinema-image', skillVersion: 1,
    providerId: 'agnes', modelId: 'agnes-image-2.1-flash', userInstruction: '生成一致角色',
    mentions: [{
      node_id: 'node-a', display_title: '角色参考', role: 'identity', instruction: '保持身份', source_revision: 'a'.repeat(64),
    }],
    generationParameters: { aspect_ratio: '4:3' },
  }, transport)

  expect(calls).toEqual([
    { method: 'get', path: '/api/projects/project-a/canvases/canvas-a/agent-skills/cinematic-capabilities' },
    { method: 'get', path: '/api/projects/project-a/canvases/canvas-a/agent-skills/cinematic-sources' },
    {
      method: 'post', path: '/api/projects/project-a/canvases/canvas-a/agent-skills/cinematic-preflight',
      payload: {
        skill_id: 'revid.cinema-image', skill_version: 1, canvas_revision: 4,
        provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', user_instruction: '生成一致角色',
        mentions: [{ node_id: 'node-a', role: 'identity', instruction: '保持身份', source_revision: 'a'.repeat(64) }],
        generation_parameters: { aspect_ratio: '4:3' },
      },
    },
  ])
})
