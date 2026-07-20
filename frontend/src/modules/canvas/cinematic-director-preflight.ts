import type {
  CinematicDirectorBrief,
  CinematicReferenceTransfer,
  CinematicRetakeContext,
} from './cinematic-director'
import type { CinematicSequenceState } from './cinematic-sequence'
import type { CinematicSkillTransport } from './cinematic-skills'

export type CinematicWorkflowMode = 'standalone_clip' | 'sequence_clip' | 'continuation' | 'retake'
export type CinematicReferenceTransferInput = Omit<CinematicReferenceTransfer, 'contract_version'>

export interface CinematicDirectorPreflightInput {
  projectId: string
  canvasId: string
  canvasRevision: number
  skillId: 'revid.cinema-script' | 'revid.cinema-image' | 'revid.cinema-video'
  providerId: string
  modelId: string
  userInstruction: string
  mentions: CinematicReferenceTransferInput[]
  generationParameters: Record<string, unknown>
  workflowMode: CinematicWorkflowMode
  directorBrief: CinematicDirectorBrief | null
  sequenceContext: CinematicSequenceState | null
  retakeContext: CinematicRetakeContext | null
}

export interface CinematicDirectorPreflight {
  contract_version: 2
  skill: { id: CinematicDirectorPreflightInput['skillId']; version: 2 }
  workflow_mode: CinematicWorkflowMode
  project_id: string
  canvas_id: string
  canvas_revision: number
  provider_id: string
  model_id: string
  capability_version: 1
  director_coherence: 'standalone_fast_lane' | 'explicit_brief' | 'director_brief_required'
  references: Array<Record<string, unknown>>
  warnings: CinematicDirectorIssue[]
  conflicts: CinematicDirectorIssue[]
  recommendations: CinematicDirectorIssue[]
  ready_for_handoff: boolean
  canonical_request: Record<string, unknown>
  canonical_request_json: string
  exact_request: string
  request_digest: string
  requires_acknowledgement: boolean
}

export interface CinematicDirectorIssue {
  code: string
  message: string
  node_id?: string
}

export interface CinematicDirectorGenerationHandoff {
  skill_id: CinematicDirectorPreflightInput['skillId']
  skill_version: 2
  canvas_revision: number
  provider_id: string
  model_id: string
  user_instruction: string
  mentions: CinematicReferenceTransferInput[]
  generation_parameters: Record<string, unknown>
  workflow_mode: CinematicWorkflowMode
  director_brief: CinematicDirectorBrief | null
  sequence_context: CinematicSequenceState | null
  retake_context: CinematicRetakeContext | null
  submitted_preflight: CinematicDirectorPreflight
}

function contractError() { return new Error('cinematic director preflight contract is invalid') }
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
function text(value: unknown, maximum: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) throw contractError()
  return value.trim()
}
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (record(value)) return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalJson(value[key])}`
  )).join(',')}}`
  return JSON.stringify(value)
}
async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
function parseIssues(value: unknown): CinematicDirectorIssue[] {
  if (!Array.isArray(value) || value.length > 25) throw contractError()
  return value.map((issue) => {
    if (!record(issue) || !(exact(issue, ['code', 'message']) || exact(issue, ['code', 'message', 'node_id']))) {
      throw contractError()
    }
    return {
      code: text(issue.code, 96), message: text(issue.message, 500),
      ...(issue.node_id === undefined ? {} : { node_id: text(issue.node_id, 96) }),
    }
  })
}

export function parseCinematicDirectorPreflight(
  value: unknown,
  expected: Pick<CinematicDirectorPreflightInput, 'projectId' | 'canvasId' | 'canvasRevision' | 'skillId' | 'workflowMode'>,
): CinematicDirectorPreflight {
  if (!record(value) || !exact(value, [
    'canvas_id', 'canvas_revision', 'canonical_request', 'canonical_request_json', 'capability_version',
    'conflicts', 'contract_version', 'director_coherence', 'exact_request', 'model_id', 'project_id',
    'provider_id', 'ready_for_handoff', 'recommendations', 'references', 'request_digest',
    'requires_acknowledgement', 'skill', 'warnings', 'workflow_mode',
  ]) || value.contract_version !== 2 || value.capability_version !== 1 ||
    value.project_id !== expected.projectId || value.canvas_id !== expected.canvasId ||
    value.canvas_revision !== expected.canvasRevision || value.workflow_mode !== expected.workflowMode ||
    !record(value.skill) || !exact(value.skill, ['id', 'version']) ||
    value.skill.id !== expected.skillId || value.skill.version !== 2 ||
    !['standalone_fast_lane', 'explicit_brief', 'director_brief_required'].includes(String(value.director_coherence)) ||
    !Array.isArray(value.references) || typeof value.ready_for_handoff !== 'boolean' ||
    typeof value.requires_acknowledgement !== 'boolean' || !record(value.canonical_request) ||
    typeof value.canonical_request_json !== 'string' || value.exact_request !== value.canonical_request_json ||
    canonicalJson(value.canonical_request) !== value.canonical_request_json ||
    typeof value.request_digest !== 'string' || !/^[a-f0-9]{64}$/.test(value.request_digest)
  ) throw contractError()
  const canonical = value.canonical_request
  if (!exact(canonical, [
    'conflicts', 'constraint_envelope', 'director_brief', 'director_coherence', 'image_ids',
    'instruction_precedence', 'optimized_prompt', 'parameters', 'policy_version', 'provider',
    'recommendations', 'references', 'retake_context', 'scope', 'sequence_context', 'skill_id',
    'skill_version', 'supported_control_mapping', 'user_instruction', 'warnings', 'workflow_mode',
  ]) || canonical.skill_id !== expected.skillId || canonical.skill_version !== 2 ||
    canonical.policy_version !== 2 || canonical.workflow_mode !== expected.workflowMode ||
    !record(canonical.scope) || !exact(canonical.scope, ['canvas_id', 'canvas_revision', 'project_id']) ||
    canonical.scope.project_id !== expected.projectId || canonical.scope.canvas_id !== expected.canvasId ||
    canonical.scope.canvas_revision !== expected.canvasRevision || !record(canonical.provider) ||
    !exact(canonical.provider, ['capability_version', 'model_id', 'provider_id']) ||
    !Array.isArray(canonical.instruction_precedence) || canonical.instruction_precedence.length !== 6 ||
    !Array.isArray(canonical.references) || canonical.references.length !== value.references.length ||
    !Array.isArray(canonical.image_ids) || !record(canonical.parameters) ||
    !record(canonical.supported_control_mapping) || typeof canonical.optimized_prompt !== 'string'
  ) throw contractError()
  const warnings = parseIssues(value.warnings)
  const conflicts = parseIssues(value.conflicts)
  const recommendations = parseIssues(value.recommendations)
  if (canonicalJson(canonical.warnings) !== canonicalJson(warnings) ||
    canonicalJson(canonical.conflicts) !== canonicalJson(conflicts) ||
    canonicalJson(canonical.recommendations) !== canonicalJson(recommendations) ||
    (value.ready_for_handoff !== (conflicts.length === 0 && recommendations.length === 0))
  ) throw contractError()
  return { ...value, warnings, conflicts, recommendations } as unknown as CinematicDirectorPreflight
}

function path(input: Pick<CinematicDirectorPreflightInput, 'projectId' | 'canvasId'>) {
  return `/api/projects/${encodeURIComponent(text(input.projectId, 96))}/canvases/${encodeURIComponent(text(input.canvasId, 96))}/agent-skills/cinematic-preflight`
}

export async function requestCinematicDirectorPreflight(
  input: CinematicDirectorPreflightInput,
  transport: CinematicSkillTransport,
) {
  if (!Number.isInteger(input.canvasRevision) || input.canvasRevision < 0 || input.mentions.length > 25) {
    throw contractError()
  }
  const payload = {
    skill_id: input.skillId, skill_version: 2, canvas_revision: input.canvasRevision,
    provider_id: text(input.providerId, 64), model_id: text(input.modelId, 96),
    user_instruction: text(input.userInstruction, 4_000), mentions: input.mentions,
    generation_parameters: input.generationParameters, workflow_mode: input.workflowMode,
    director_brief: input.directorBrief, sequence_context: input.sequenceContext,
    retake_context: input.retakeContext,
  }
  const response = await transport.post<unknown>(path(input), payload)
  const preflight = parseCinematicDirectorPreflight(response.data, input)
  if (await sha256(preflight.canonical_request_json) !== preflight.request_digest) throw contractError()
  return preflight
}

export function buildCinematicDirectorHandoff(
  input: CinematicDirectorPreflightInput,
  preflight: CinematicDirectorPreflight,
): CinematicDirectorGenerationHandoff {
  const parsed = parseCinematicDirectorPreflight(preflight, input)
  if (!parsed.ready_for_handoff) throw contractError()
  return {
    skill_id: input.skillId, skill_version: 2, canvas_revision: input.canvasRevision,
    provider_id: input.providerId, model_id: input.modelId, user_instruction: input.userInstruction.trim(),
    mentions: input.mentions, generation_parameters: input.generationParameters,
    workflow_mode: input.workflowMode, director_brief: input.directorBrief,
    sequence_context: input.sequenceContext, retake_context: input.retakeContext,
    submitted_preflight: parsed,
  }
}
