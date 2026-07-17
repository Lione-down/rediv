export const CANVAS_AGENT_SKILL_CONTRACT_VERSION = 1
export const CANVAS_CONTEXT_SKILL_ID = 'revid.canvas-context'
export const CANVAS_CONTEXT_SKILL_VERSION = 1

export type CanvasAgentSkillExecutionMode = 'mock-only' | 'unavailable'
export type CanvasAgentSkillNodeType = 'script' | 'note' | 'asset' | 'generation' | 'result' | 'group'

export interface CanvasAgentSkillManifest {
  id: typeof CANVAS_CONTEXT_SKILL_ID
  version: typeof CANVAS_CONTEXT_SKILL_VERSION
  execution_mode: 'mock-only'
  intent: 'canvas-context'
  requires_acknowledgement: false
}

export interface CanvasAgentSkillCapabilities {
  contract_version: 1
  execution_modes: ['mock-only', 'unavailable']
  skills: [CanvasAgentSkillManifest]
  provider: { available: false }
  quota: { available: false }
  task: { available: false }
}

export interface CanvasAgentSkillSource {
  node_id: string
  role: 'canvas-node'
  node_type: CanvasAgentSkillNodeType
  subtype: string
}

export interface CanvasAgentSkillPreflight {
  contract_version: 1
  skill: CanvasAgentSkillManifest
  project_id: string
  canvas_id: string
  sources: CanvasAgentSkillSource[]
  execution_mode: 'mock-only'
  requires_acknowledgement: false
  provider: { available: false }
  quota: { available: false }
  task: { available: false }
}

export interface CanvasAgentSkillPreflightInput {
  projectId: string
  canvasId: string
  skillId: string
  skillVersion: number
  selectedNodeIds: readonly string[]
}

export interface CanvasAgentSkillTransport {
  get<T>(path: string): Promise<{ data: T }>
  post<T>(path: string, payload: unknown): Promise<{ data: T }>
}

function contractError() {
  return new Error('Agent/Skill contract is invalid')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

function boundedValue(value: unknown, maximum: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maximum
    ? value.trim()
    : null
}

function isUnavailableAuthority(value: unknown): value is { available: false } {
  return isRecord(value) && hasExactKeys(value, ['available']) && value.available === false
}

const CANONICAL_SUBTYPES: Record<CanvasAgentSkillNodeType, readonly string[]> = {
  script: ['script', 'prompt'],
  note: ['annotation'],
  asset: ['image', 'video', 'audio'],
  generation: ['image', 'video'],
  result: ['image', 'video', 'text'],
  group: ['group', 'storyboard'],
}

function isCanonicalNodeType(value: unknown): value is CanvasAgentSkillNodeType {
  return typeof value === 'string' && value in CANONICAL_SUBTYPES
}

function parseManifest(value: unknown): CanvasAgentSkillManifest {
  if (!isRecord(value) || !hasExactKeys(value, [
    'execution_mode', 'id', 'intent', 'requires_acknowledgement', 'version',
  ]) || value.id !== CANVAS_CONTEXT_SKILL_ID || value.version !== CANVAS_CONTEXT_SKILL_VERSION ||
    value.execution_mode !== 'mock-only' || value.intent !== 'canvas-context' ||
    value.requires_acknowledgement !== false
  ) throw contractError()
  return {
    id: CANVAS_CONTEXT_SKILL_ID,
    version: CANVAS_CONTEXT_SKILL_VERSION,
    execution_mode: 'mock-only',
    intent: 'canvas-context',
    requires_acknowledgement: false,
  }
}

function parseSources(value: unknown): CanvasAgentSkillSource[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 25) throw contractError()
  const ids = new Set<string>()
  return value.map((source) => {
    if (!isRecord(source) || !hasExactKeys(source, ['node_id', 'node_type', 'role', 'subtype']) ||
      source.role !== 'canvas-node' || !isCanonicalNodeType(source.node_type) ||
      typeof source.subtype !== 'string' || !CANONICAL_SUBTYPES[source.node_type].includes(source.subtype)
    ) throw contractError()
    const nodeId = boundedValue(source.node_id, 96)
    if (!nodeId || ids.has(nodeId)) throw contractError()
    ids.add(nodeId)
    return {
      node_id: nodeId,
      role: 'canvas-node',
      node_type: source.node_type,
      subtype: source.subtype,
    }
  })
}

function canvasAgentSkillPath(projectId: string, canvasId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/canvases/${encodeURIComponent(canvasId)}/agent-skills`
}

function normalizeScope(projectId: unknown, canvasId: unknown) {
  const normalizedProjectId = boundedValue(projectId, 96)
  const normalizedCanvasId = boundedValue(canvasId, 96)
  if (!normalizedProjectId || !normalizedCanvasId) throw contractError()
  return { projectId: normalizedProjectId, canvasId: normalizedCanvasId }
}

function normalizePreflightInput(input: CanvasAgentSkillPreflightInput) {
  const scope = normalizeScope(input.projectId, input.canvasId)
  if (input.skillId !== CANVAS_CONTEXT_SKILL_ID || input.skillVersion !== CANVAS_CONTEXT_SKILL_VERSION ||
    input.selectedNodeIds.length < 1 || input.selectedNodeIds.length > 25
  ) throw contractError()
  const selectedNodeIds = input.selectedNodeIds.map((nodeId) => boundedValue(nodeId, 96))
  if (selectedNodeIds.some((nodeId) => !nodeId) || new Set(selectedNodeIds).size !== selectedNodeIds.length) {
    throw contractError()
  }
  return { ...scope, selectedNodeIds: selectedNodeIds as string[] }
}

export function parseCanvasAgentSkillCapabilities(value: unknown): CanvasAgentSkillCapabilities {
  if (!isRecord(value) || !hasExactKeys(value, [
    'contract_version', 'execution_modes', 'provider', 'quota', 'skills', 'task',
  ]) || value.contract_version !== CANVAS_AGENT_SKILL_CONTRACT_VERSION ||
    !Array.isArray(value.execution_modes) || value.execution_modes.length !== 2 ||
    value.execution_modes[0] !== 'mock-only' || value.execution_modes[1] !== 'unavailable' ||
    !Array.isArray(value.skills) || value.skills.length !== 1 ||
    !isUnavailableAuthority(value.provider) || !isUnavailableAuthority(value.quota) ||
    !isUnavailableAuthority(value.task)
  ) throw contractError()
  return {
    contract_version: 1,
    execution_modes: ['mock-only', 'unavailable'],
    skills: [parseManifest(value.skills[0])],
    provider: { available: false },
    quota: { available: false },
    task: { available: false },
  }
}

export function parseCanvasAgentSkillPreflight(
  value: unknown,
  expected: Pick<CanvasAgentSkillPreflightInput, 'projectId' | 'canvasId' | 'selectedNodeIds'>,
): CanvasAgentSkillPreflight {
  const scope = normalizeScope(expected.projectId, expected.canvasId)
  if (!isRecord(value) || !hasExactKeys(value, [
    'canvas_id', 'contract_version', 'execution_mode', 'project_id', 'provider', 'quota',
    'requires_acknowledgement', 'skill', 'sources', 'task',
  ]) || value.contract_version !== CANVAS_AGENT_SKILL_CONTRACT_VERSION ||
    value.project_id !== scope.projectId || value.canvas_id !== scope.canvasId ||
    value.execution_mode !== 'mock-only' || value.requires_acknowledgement !== false ||
    !isUnavailableAuthority(value.provider) || !isUnavailableAuthority(value.quota) ||
    !isUnavailableAuthority(value.task)
  ) throw contractError()
  const sources = parseSources(value.sources)
  if (sources.length !== expected.selectedNodeIds.length ||
    sources.some((source, index) => source.node_id !== expected.selectedNodeIds[index])
  ) throw contractError()
  return {
    contract_version: 1,
    skill: parseManifest(value.skill),
    project_id: scope.projectId,
    canvas_id: scope.canvasId,
    sources,
    execution_mode: 'mock-only',
    requires_acknowledgement: false,
    provider: { available: false },
    quota: { available: false },
    task: { available: false },
  }
}

export async function loadCanvasAgentSkillCapabilities(
  projectId: string,
  canvasId: string,
  transport: CanvasAgentSkillTransport,
) {
  const scope = normalizeScope(projectId, canvasId)
  const response = await transport.get<unknown>(canvasAgentSkillPath(scope.projectId, scope.canvasId))
  return parseCanvasAgentSkillCapabilities(response.data)
}

export async function requestCanvasAgentSkillPreflight(
  input: CanvasAgentSkillPreflightInput,
  transport: CanvasAgentSkillTransport,
) {
  const normalized = normalizePreflightInput(input)
  const response = await transport.post<unknown>(
    `${canvasAgentSkillPath(normalized.projectId, normalized.canvasId)}/preflight`,
    {
      skill_id: CANVAS_CONTEXT_SKILL_ID,
      skill_version: CANVAS_CONTEXT_SKILL_VERSION,
      selected_node_ids: normalized.selectedNodeIds,
    },
  )
  return parseCanvasAgentSkillPreflight(response.data, {
    projectId: normalized.projectId,
    canvasId: normalized.canvasId,
    selectedNodeIds: normalized.selectedNodeIds,
  })
}
