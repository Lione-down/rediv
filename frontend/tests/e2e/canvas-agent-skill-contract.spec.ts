import { expect, test } from '@playwright/test'
import {
  loadCanvasAgentSkillCapabilities,
  requestCanvasAgentSkillPreflight,
} from '../../src/modules/canvas/agent-skills'

const PROJECT_ID = 'project-agent-skill'
const CANVAS_ID = 'canvas-agent-skill'

function capabilities() {
  return {
    contract_version: 1,
    execution_modes: ['mock-only', 'unavailable'],
    skills: [{
      id: 'revid.canvas-context',
      version: 1,
      execution_mode: 'mock-only',
      intent: 'canvas-context',
      requires_acknowledgement: false,
    }],
    provider: { available: false },
    quota: { available: false },
    task: { available: false },
  }
}

function preflight() {
  return {
    contract_version: 1,
    skill: {
      id: 'revid.canvas-context',
      version: 1,
      execution_mode: 'mock-only',
      intent: 'canvas-context',
      requires_acknowledgement: false,
    },
    project_id: PROJECT_ID,
    canvas_id: CANVAS_ID,
    sources: [
      { node_id: 'node-b', role: 'canvas-node', node_type: 'generation', subtype: 'image' },
      { node_id: 'node-a', role: 'canvas-node', node_type: 'script', subtype: 'script' },
    ],
    execution_mode: 'mock-only',
    requires_acknowledgement: false,
    provider: { available: false },
    quota: { available: false },
    task: { available: false },
  }
}

test('Agent/Skill discovery and preflight preserve the closed Canvas-local mock-only contract', async () => {
  const calls: Array<{ method: string; path: string; payload?: unknown }> = []
  const transport = {
    get: async <T>(path: string) => {
      calls.push({ method: 'get', path })
      return { data: capabilities() as T }
    },
    post: async <T>(path: string, payload: unknown) => {
      calls.push({ method: 'post', path, payload })
      return { data: preflight() as T }
    },
  }

  const discovered = await loadCanvasAgentSkillCapabilities(PROJECT_ID, CANVAS_ID, transport)
  const plan = await requestCanvasAgentSkillPreflight({
    projectId: PROJECT_ID,
    canvasId: CANVAS_ID,
    skillId: 'revid.canvas-context',
    skillVersion: 1,
    selectedNodeIds: ['node-b', 'node-a'],
  }, transport)

  expect(discovered.skills).toEqual([{
    id: 'revid.canvas-context', version: 1, execution_mode: 'mock-only', intent: 'canvas-context', requires_acknowledgement: false,
  }])
  expect(plan.sources).toEqual([
    { node_id: 'node-b', role: 'canvas-node', node_type: 'generation', subtype: 'image' },
    { node_id: 'node-a', role: 'canvas-node', node_type: 'script', subtype: 'script' },
  ])
  expect(plan).toMatchObject({ execution_mode: 'mock-only', requires_acknowledgement: false, provider: { available: false }, quota: { available: false }, task: { available: false } })
  expect(calls).toEqual([
    { method: 'get', path: `/api/projects/${PROJECT_ID}/canvases/${CANVAS_ID}/agent-skills` },
    {
      method: 'post',
      path: `/api/projects/${PROJECT_ID}/canvases/${CANVAS_ID}/agent-skills/preflight`,
      payload: { skill_id: 'revid.canvas-context', skill_version: 1, selected_node_ids: ['node-b', 'node-a'] },
    },
  ])
})

test('Agent/Skill client rejects unknown, future, scope-drift, authority-drift, and malformed contracts', async () => {
  const invalidResponses = [
    { ...capabilities(), skills: [{ ...capabilities().skills[0], id: 'external.remote' }] },
    { ...capabilities(), skills: [{ ...capabilities().skills[0], version: 2 }] },
    { ...preflight(), canvas_id: 'foreign-canvas' },
    { ...preflight(), provider: { available: true } },
    { ...preflight(), sources: [{ node_id: 'node-a', role: 'canvas-node', node_type: 'script', subtype: 'foreign' }] },
  ]

  for (const response of invalidResponses) {
    const transport = {
      get: async <T>() => ({ data: response as T }),
      post: async <T>() => ({ data: response as T }),
    }
    if ('skills' in response) {
      await expect(loadCanvasAgentSkillCapabilities(PROJECT_ID, CANVAS_ID, transport)).rejects.toThrow('Agent/Skill')
    } else {
      await expect(requestCanvasAgentSkillPreflight({
        projectId: PROJECT_ID,
        canvasId: CANVAS_ID,
        skillId: 'revid.canvas-context',
        skillVersion: 1,
        selectedNodeIds: ['node-b', 'node-a'],
      }, transport)).rejects.toThrow('Agent/Skill')
    }
  }
})

test('Agent/Skill client fails before request for empty, duplicate, or unbounded selection', async () => {
  const calls: string[] = []
  const transport = {
    get: async <T>(path: string) => ({ data: capabilities() as T }),
    post: async <T>(path: string) => {
      calls.push(path)
      return { data: preflight() as T }
    },
  }

  for (const selectedNodeIds of [[], ['node-a', 'node-a'], Array.from({ length: 26 }, (_, index) => `node-${index}`)]) {
    await expect(requestCanvasAgentSkillPreflight({
      projectId: PROJECT_ID,
      canvasId: CANVAS_ID,
      skillId: 'revid.canvas-context',
      skillVersion: 1,
      selectedNodeIds,
    }, transport)).rejects.toThrow('Agent/Skill')
  }
  expect(calls).toEqual([])
})
