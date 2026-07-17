import { expect, test } from '@playwright/test'
import { parseShotSchemaDocument } from '../../src/modules/canvas/shot-schema'
import { requestMockShotSchema } from '../../src/modules/canvas/shot-schema-service'

function validDocument() {
  return {
    contract_version: 1,
    schema_id: 'revid.shot-sequence',
    provider: 'mock',
    model: 'revid-shot-mock-v1',
    project_id: 'project-a',
    canvas_id: 'canvas-a',
    source_script_node_id: 'script-a',
    aspect_ratio: '16:9',
    shot_count: 2,
    shots: [
      {
        shot_id: 'shot-01', index: 1, title: '镜头 01',
        narrative: '人物走入黄昏海岸。', image_prompt: '人物走入黄昏海岸。',
      },
      {
        shot_id: 'shot-02', index: 2, title: '镜头 02',
        narrative: '海浪在人物身后翻涌。', image_prompt: '海浪在人物身后翻涌。',
      },
    ],
  }
}

function clone(value: unknown) {
  return structuredClone(value)
}

test('strict shot schema v1 accepts only exact contiguous mock output', () => {
  const parsed = parseShotSchemaDocument(validDocument())

  expect(parsed).toEqual(validDocument())
  expect(parsed.shots.map((shot) => [shot.shot_id, shot.index])).toEqual([
    ['shot-01', 1], ['shot-02', 2],
  ])
})

test('strict shot schema v1 fails closed for future foreign malformed extra or reordered data', () => {
  const cases: Array<{ label: string; mutate(value: any): void }> = [
    { label: 'future version', mutate: (value) => { value.contract_version = 2 } },
    { label: 'foreign provider', mutate: (value) => { value.provider = 'agnes' } },
    { label: 'foreign model', mutate: (value) => { value.model = 'unknown' } },
    { label: 'root extra', mutate: (value) => { value.extra = true } },
    { label: 'shot extra', mutate: (value) => { value.shots[0].camera_angle = 'wide' } },
    { label: 'duplicate id', mutate: (value) => { value.shots[1].shot_id = 'shot-01' } },
    { label: 'reordered index', mutate: (value) => { value.shots[1].index = 3; value.shots[1].shot_id = 'shot-03' } },
    { label: 'wrong count', mutate: (value) => { value.shot_count = 3 } },
    { label: 'missing prompt', mutate: (value) => { delete value.shots[0].image_prompt } },
    { label: 'oversized narrative', mutate: (value) => { value.shots[0].narrative = 'x'.repeat(501) } },
    { label: 'unsupported ratio', mutate: (value) => { value.aspect_ratio = '5:4' } },
  ]

  for (const scenario of cases) {
    const candidate = clone(validDocument()) as any
    scenario.mutate(candidate)
    expect(() => parseShotSchemaDocument(candidate), scenario.label).toThrow('Shot schema response is invalid')
  }
})

test('shot schema service sends one exact mock request and rejects response scope drift', async () => {
  const calls: Array<{ path: string; payload: unknown }> = []
  const transport = {
    async post<T>(path: string, payload: unknown) {
      calls.push({ path, payload })
      return { data: validDocument() as T }
    },
  }
  const input = {
    projectId: 'project-a', canvasId: 'canvas-a', sourceScriptNodeId: 'script-a',
    script: '人物走入黄昏海岸。海浪在身后翻涌。', requestedShotCount: 2,
  }

  await expect(requestMockShotSchema(input, transport)).resolves.toEqual(validDocument())
  expect(calls).toEqual([{
    path: '/api/projects/project-a/canvases/canvas-a/shot-schema',
    payload: {
      contract_version: 1,
      provider: 'mock',
      source_script_node_id: 'script-a',
      script: input.script,
      requested_shot_count: 2,
    },
  }])

  const foreignTransport = {
    async post<T>() {
      return { data: { ...validDocument(), canvas_id: 'canvas-b' } as T }
    },
  }
  await expect(requestMockShotSchema(input, foreignTransport)).rejects.toThrow('Shot schema response scope mismatch')
})
