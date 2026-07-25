import type { CanvasNode } from '../../types/canvas'
import type { GenerationJobResult } from './generation-job-api'
import type { TextWorkflowMode } from './script-authoring'
import { resolveCanvasCardFamily } from './canvas-card-view-model'
import { isNodeMutationSupported } from './node-registry'

export interface SetTextCardContentCommand {
  type: 'set-text-card-content'
  nodeId: string
  expectedContent: string
  content: string
  expectedContentRevision: number
}

export interface BindTextGenerationJobCommand {
  type: 'bind-text-generation-job'
  nodeId: string
  expectedContentRevision: number
  jobId: string
  mode: TextWorkflowMode
  modelId: string
}

export interface ApplyGenerationJobResultCommand {
  type: 'apply-generation-job-result'
  nodeId: string
  expectedJobId: string
  expectedContentRevision: number
  content?: string
  mediaType?: 'image' | 'video'
  assetId?: string
  url?: string
  resultVersion: number
}

function isEditableTextCard(node: CanvasNode | undefined): node is CanvasNode {
  return Boolean(
    node &&
    resolveCanvasCardFamily(node) === 'text' &&
    !(node.type === 'script' && node.contentData?.subtype === 'script') &&
    !node.isLocked &&
    isNodeMutationSupported(node),
  )
}

export function readTextCardContentRevision(node: Pick<CanvasNode, 'contentData'>) {
  const value = node.contentData?.content_revision
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0
}

function readTextCardContent(node: Pick<CanvasNode, 'content' | 'contentData'>) {
  const value = node.content ?? node.contentData?.text
  return typeof value === 'string' ? value : ''
}

export function createSetTextCardContentCommand(
  nodes: readonly CanvasNode[],
  nodeId: string,
  content: string,
): SetTextCardContentCommand | null {
  const target = nodes.find((node) => node.id === nodeId)
  if (!isEditableTextCard(target) || typeof content !== 'string') return null
  const expectedContent = readTextCardContent(target)
  if (expectedContent === content) return null
  return {
    type: 'set-text-card-content',
    nodeId,
    expectedContent,
    content,
    expectedContentRevision: readTextCardContentRevision(target),
  }
}

export function createBindTextGenerationJobCommand(
  nodes: readonly CanvasNode[],
  nodeId: string,
  input: {
    expectedContentRevision: number
    jobId: string
    mode: TextWorkflowMode
    modelId: string
  },
): BindTextGenerationJobCommand | null {
  const target = nodes.find((node) => node.id === nodeId)
  if (
    !isEditableTextCard(target) ||
    !Number.isSafeInteger(input.expectedContentRevision) || input.expectedContentRevision < 0 ||
    typeof input.jobId !== 'string' || !input.jobId.trim() ||
    typeof input.modelId !== 'string' || !input.modelId.trim() ||
    !['text-to-video', 'image-to-prompt', 'text-to-music'].includes(input.mode) ||
    target.contentData?.active_generation_job_id
  ) return null
  return {
    type: 'bind-text-generation-job',
    nodeId,
    expectedContentRevision: input.expectedContentRevision,
    jobId: input.jobId,
    mode: input.mode,
    modelId: input.modelId,
  }
}

export function createApplyGenerationJobResultCommand(
  node: CanvasNode,
  expectedJobId: string,
  result: GenerationJobResult,
): ApplyGenerationJobResultCommand | null {
  const isMedia = result.result.media_type === 'image' || result.result.media_type === 'video'
  const bindingRevision = isMedia
    ? readTextCardContentRevision(node)
    : node.contentData?.active_generation_job_content_revision
  const content = result.result.media_type === 'text' ? result.result.content.trim() : ''
  const isCompatibleMediaCard = (
    isMedia &&
    node.type === 'generation' &&
    node.contentData?.subtype === result.result.media_type &&
    !node.isLocked &&
    isNodeMutationSupported(node)
  )
  if (
    (!isEditableTextCard(node) && !isCompatibleMediaCard) ||
    node.contentData?.active_generation_job_id !== expectedJobId ||
    result.job_id !== expectedJobId ||
    result.node_id !== node.id ||
    !Number.isSafeInteger(bindingRevision) ||
    Number(bindingRevision) < 0 ||
    readTextCardContentRevision(node) !== Number(bindingRevision) ||
    (!content && !isMedia)
  ) return null
  if (result.result.media_type === 'image' || result.result.media_type === 'video') {
    return {
      type: 'apply-generation-job-result',
      nodeId: node.id,
      expectedJobId,
      expectedContentRevision: Number(bindingRevision),
      mediaType: result.result.media_type,
      assetId: result.result.asset_id,
      url: result.result.url,
      resultVersion: result.version,
    }
  }
  return {
    type: 'apply-generation-job-result',
    nodeId: node.id,
    expectedJobId,
    expectedContentRevision: Number(bindingRevision),
    content,
    resultVersion: result.version,
  }
}
