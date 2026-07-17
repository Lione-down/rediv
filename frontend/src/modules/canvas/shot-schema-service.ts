import { request } from '../../api/request'
import { parseShotSchemaDocument, type ShotSchemaDocument } from './shot-schema'

export interface ShotSchemaRequestInput {
  projectId: string
  canvasId: string
  sourceScriptNodeId: string
  script: string
  requestedShotCount?: number
}

export interface ShotSchemaTransport {
  post<T>(path: string, payload: unknown): Promise<{ data: T }>
}

function boundedId(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized.length > 36) throw new Error('Shot schema request scope is invalid')
  return normalized
}

export async function requestMockShotSchema(
  input: ShotSchemaRequestInput,
  transport: ShotSchemaTransport = request,
): Promise<ShotSchemaDocument> {
  const projectId = boundedId(input.projectId)
  const canvasId = boundedId(input.canvasId)
  const sourceScriptNodeId = boundedId(input.sourceScriptNodeId)
  const script = input.script.trim()
  if (!script || script.length > 12000) throw new Error('Shot schema script is invalid')
  if (
    input.requestedShotCount !== undefined &&
    (!Number.isSafeInteger(input.requestedShotCount) || input.requestedShotCount < 2 || input.requestedShotCount > 25)
  ) throw new Error('Shot schema shot count is invalid')

  const response = await transport.post<unknown>(
    `/api/projects/${encodeURIComponent(projectId)}/canvases/${encodeURIComponent(canvasId)}/shot-schema`,
    {
      contract_version: 1,
      provider: 'mock',
      source_script_node_id: sourceScriptNodeId,
      script,
      ...(input.requestedShotCount === undefined
        ? {}
        : { requested_shot_count: input.requestedShotCount }),
    },
  )
  const document = parseShotSchemaDocument(response.data)
  if (
    document.project_id !== projectId || document.canvas_id !== canvasId ||
    document.source_script_node_id !== sourceScriptNodeId
  ) throw new Error('Shot schema response scope mismatch')
  return document
}
