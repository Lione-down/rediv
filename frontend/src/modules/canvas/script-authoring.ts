import type { CanvasNode } from '../../types/canvas'
import type { ApplyScriptAuthoringResultCommand } from './canvas-commands'
import { resolveNodeDefinition } from './node-registry'

export type ScriptAuthoringIntent = 'script_draft' | 'script_refine'
export type ScriptAuthoringLocale = 'zh-CN' | 'en-US'
export type TextWorkflowMode = 'text-to-video' | 'image-to-prompt' | 'text-to-music'

export interface TextGenerationModel {
  id: string
  label: string
  workflowModes: TextWorkflowMode[]
}

export interface ScriptAuthoringCapabilities {
  contractVersion: 1 | 2
  available: true
  model: string
  modelLabel: string
  models: TextGenerationModel[]
  intents: ScriptAuthoringIntent[]
  locales: ScriptAuthoringLocale[]
  defaultLocale: ScriptAuthoringLocale
  briefMaxLength: number
  sourceMaxLength: number
  outputMaxLength: number
}

export interface ScriptAuthoringLineage {
  contract_version: 1
  intent: ScriptAuthoringIntent
  locale: ScriptAuthoringLocale
  source_node_id: string
  source_task_id: string
  source_model: string
  canvas_revision: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0
}

const TEXT_WORKFLOW_MODES = new Set<TextWorkflowMode>([
  'text-to-video',
  'image-to-prompt',
  'text-to-music',
])

function parseTextGenerationModels(value: unknown): TextGenerationModel[] {
  if (!Array.isArray(value) || !value.length) {
    throw new Error('Script authoring capability contract is invalid')
  }
  const models = value.map((candidate) => {
    if (!isRecord(candidate)) throw new Error('Script authoring capability contract is invalid')
    const workflowModes = candidate.workflow_modes
    if (
      typeof candidate.id !== 'string' || !candidate.id.trim() ||
      typeof candidate.label !== 'string' || !candidate.label.trim() ||
      !Array.isArray(workflowModes) || !workflowModes.length ||
      workflowModes.some((mode) => typeof mode !== 'string' || !TEXT_WORKFLOW_MODES.has(mode as TextWorkflowMode)) ||
      new Set(workflowModes).size !== workflowModes.length
    ) throw new Error('Script authoring capability contract is invalid')
    return {
      id: candidate.id,
      label: candidate.label,
      workflowModes: [...workflowModes] as TextWorkflowMode[],
    }
  })
  if (new Set(models.map((model) => model.id)).size !== models.length) {
    throw new Error('Script authoring capability contract is invalid')
  }
  return models
}

export function parseScriptAuthoringCapabilities(value: unknown): ScriptAuthoringCapabilities {
  if (!isRecord(value)) throw new Error('Script authoring capability contract is invalid')
  const intents = value.intents
  const locales = value.locales
  if (
    ![1, 2].includes(Number(value.contract_version)) || value.available !== true ||
    !Array.isArray(intents) || intents.length !== 2 || intents[0] !== 'script_draft' || intents[1] !== 'script_refine' ||
    !Array.isArray(locales) || locales.length !== 2 || locales[0] !== 'zh-CN' || locales[1] !== 'en-US' ||
    value.default_locale !== 'zh-CN' || !isPositiveInteger(value.brief_max_length) ||
    !isPositiveInteger(value.source_max_length) || !isPositiveInteger(value.output_max_length) ||
    value.creates_media !== false || value.runs_cinematic_decomposition !== false
  ) throw new Error('Script authoring capability contract is invalid')
  const models = value.contract_version === 1
    ? (
        typeof value.model === 'string' && value.model.trim() &&
        typeof value.model_label === 'string' && value.model_label.trim()
          ? [{
              id: value.model,
              label: value.model_label,
              workflowModes: [] as TextWorkflowMode[],
            }]
          : null
      )
    : parseTextGenerationModels(value.models)
  if (!models) throw new Error('Script authoring capability contract is invalid')
  return {
    contractVersion: value.contract_version as 1 | 2,
    available: true,
    model: models[0].id,
    modelLabel: models[0].label,
    models,
    intents: [...intents] as ScriptAuthoringIntent[],
    locales: [...locales] as ScriptAuthoringLocale[],
    defaultLocale: 'zh-CN',
    briefMaxLength: value.brief_max_length,
    sourceMaxLength: value.source_max_length,
    outputMaxLength: value.output_max_length,
  }
}

function nodeText(node: CanvasNode) {
  const value = node.content ?? node.contentData?.text
  return typeof value === 'string' ? value : ''
}

export function resolveScriptAuthoringEligibility(input: {
  canvasReady: boolean
  intent: ScriptAuthoringIntent
  isReadOnly: boolean
  isReviewOnly: boolean
  selectedNodes: readonly CanvasNode[]
}): { eligible: true; source: CanvasNode } | { eligible: false; reason: string } {
  if (!input.canvasReady) return { eligible: false, reason: 'Canvas is not ready' }
  if (input.isReadOnly || input.isReviewOnly) return { eligible: false, reason: 'Script authoring is unavailable in review-only mode' }
  if (input.selectedNodes.length !== 1) return { eligible: false, reason: 'Select exactly one script node' }
  const source = input.selectedNodes[0]
  const definition = resolveNodeDefinition(source.type, source.contentData)
  if (
    source.type !== 'script' || definition.kind !== 'canonical' ||
    source.contentData?.subtype !== 'script' || source.isLocked || source.parentNodeId
  ) return { eligible: false, reason: 'Selected node is not an editable canonical script' }
  const text = nodeText(source).trim()
  if (input.intent === 'script_refine' && !text) return { eligible: false, reason: 'Refine requires a non-empty script' }
  if (text.length > 12_000) return { eligible: false, reason: 'Script exceeds the authoring limit' }
  return { eligible: true, source }
}

export function createScriptAuthoringResultCommand(input: {
  source: CanvasNode
  sourceTextAtRequest: string
  generatedText: string
  lineage: ScriptAuthoringLineage
}): ApplyScriptAuthoringResultCommand | null {
  const currentText = nodeText(input.source)
  const generatedText = input.generatedText.trim()
  if (
    currentText !== input.sourceTextAtRequest || !generatedText || generatedText.length > 12_000 ||
    input.lineage.source_node_id !== input.source.id
  ) return null
  return {
    type: 'apply-script-authoring-result',
    nodeId: input.source.id,
    expectedContent: input.sourceTextAtRequest,
    content: generatedText,
    lineage: input.lineage,
  }
}
