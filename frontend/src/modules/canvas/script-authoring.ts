import { toRaw } from 'vue'
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
  storyDirectorRequestContractVersion: 1 | null
}

export interface StoryDirectorCapabilities {
  contractVersion: number
  models: Array<{ id: string; label: string }>
  director: {
    skillId: 'revid.story-director'
    skillVersion: 1
    userSelectable: false
  }
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

export function parseStoryDirectorCapabilities(value: unknown): StoryDirectorCapabilities {
  if (!isRecord(value) || !isPositiveInteger(value.contract_version) || value.available !== true) {
    throw new Error('Story director capability contract is invalid')
  }
  if (!Array.isArray(value.models) || !value.models.length || !isRecord(value.director)) {
    throw new Error('Story director capability contract is invalid')
  }
  const models = value.models.map((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== 'string' || !candidate.id.trim() ||
      typeof candidate.label !== 'string' || !candidate.label.trim()
    ) throw new Error('Story director capability contract is invalid')
    return { id: candidate.id, label: candidate.label }
  })
  if (
    new Set(models.map((model) => model.id)).size !== models.length ||
    value.director.skill_id !== 'revid.story-director' ||
    value.director.skill_version !== 1 ||
    value.director.user_selectable !== false
  ) throw new Error('Story director capability contract is invalid')
  return {
    contractVersion: value.contract_version,
    models,
    director: {
      skillId: 'revid.story-director',
      skillVersion: 1,
      userSelectable: false,
    },
  }
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
  const storyDirector = value.story_director
  if (
    storyDirector !== undefined && (
      !isRecord(storyDirector) ||
      storyDirector.available !== true ||
      storyDirector.request_contract_version !== 1
    )
  ) throw new Error('Script authoring capability contract is invalid')
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
    storyDirectorRequestContractVersion: storyDirector === undefined ? null : 1,
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

function isStoryProductionDocument(value: unknown, sourceNodeId: string): value is Record<string, unknown> {
  if (
    !isRecord(value) ||
    value.schema_id !== 'revid.story-production' ||
    value.schema_version !== 1 ||
    value.skill_id !== 'revid.story-director' ||
    value.skill_version !== 1 ||
    value.source_node_id !== sourceNodeId ||
    typeof value.source_revision !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.source_revision) ||
    typeof value.model_id !== 'string' || !value.model_id.trim() ||
    !isRecord(value.assets) ||
    !Array.isArray(value.assets.roles) ||
    !Array.isArray(value.assets.scenes) ||
    !Array.isArray(value.assets.props) ||
    !Array.isArray(value.shots) || !value.shots.length
  ) return false
  return value.shots.every((shot) => (
    isRecord(shot) &&
    typeof shot.shot_id === 'string' && Boolean(shot.shot_id.trim()) &&
    typeof shot.video_prompt === 'string' && Boolean(shot.video_prompt.trim())
  ))
}

export function createStoryProductionResultCommand(input: {
  source: CanvasNode
  sourceTextAtRequest: string
  generatedText: string
  storyProduction: unknown
  lineage: ScriptAuthoringLineage
}): ApplyScriptAuthoringResultCommand | null {
  const command = createScriptAuthoringResultCommand(input)
  if (
    !command ||
    !isStoryProductionDocument(input.storyProduction, input.source.id) ||
    input.storyProduction.model_id !== input.lineage.source_model
  ) return null
  return {
    ...command,
    storyProduction: structuredClone(input.storyProduction),
  }
}

function persistedScriptLineage(source: CanvasNode): ScriptAuthoringLineage | null {
  const content = source.contentData ?? {}
  const intent = content.generation_intent
  const locale = content.generation_locale
  if (
    content.script_authoring_contract_version !== 1 ||
    (intent !== 'script_draft' && intent !== 'script_refine') ||
    (locale !== 'zh-CN' && locale !== 'en-US') ||
    typeof content.source_task_id !== 'string' || !content.source_task_id ||
    typeof content.source_model !== 'string' || !content.source_model ||
    content.source_node_id !== source.id ||
    !Number.isInteger(content.source_canvas_revision) ||
    Number(content.source_canvas_revision) < 0
  ) return null
  return {
    contract_version: 1,
    intent,
    locale,
    source_node_id: source.id,
    source_task_id: content.source_task_id,
    source_model: content.source_model,
    canvas_revision: Number(content.source_canvas_revision),
  }
}

export function createAppendStoryShotCommand(input: {
  source: CanvasNode
  shotId: string
}): ApplyScriptAuthoringResultCommand | null {
  const storyProduction = input.source.contentData?.story_production
  const lineage = persistedScriptLineage(input.source)
  if (
    !lineage || !isStoryProductionDocument(storyProduction, input.source.id) ||
    !input.shotId.trim()
  ) return null
  const shots = storyProduction.shots as unknown[]
  if (
    shots.length >= 25 ||
    shots.some((shot) => isRecord(shot) && shot.shot_id === input.shotId)
  ) return null
  const plainProduction = structuredClone(toRaw(storyProduction))
  const plainShots = plainProduction.shots as unknown[]
  const previous = plainShots[plainShots.length - 1]
  if (!isRecord(previous)) return null
  const nextShot = {
    ...previous,
    shot_id: input.shotId,
    shot_number: shots.length + 1,
    duration_seconds: 5,
    visual_description: '待补充镜头画面',
    dialogue: '',
    music_sfx: '',
    camera_movement: '待设置',
    image_prompt: '待补充镜头图像提示',
    video_prompt: '待补充分镜视频提示',
    generation_revision: 1,
    validation_state: 'needs_review',
    locked_fields: {},
  }
  const updatedProduction = {
    ...plainProduction,
    shots: [...plainShots, nextShot],
  }
  return createStoryProductionResultCommand({
    source: input.source,
    sourceTextAtRequest: nodeText(input.source),
    generatedText: nodeText(input.source),
    storyProduction: updatedProduction,
    lineage,
  })
}

export type StoryShotEditableField =
  | 'duration_seconds'
  | 'visual_description'
  | 'framing'
  | 'lighting_atmosphere'
  | 'dialogue'
  | 'music_sfx'
  | 'camera_movement'
  | 'image_prompt'
  | 'video_prompt'
  | 'framing_zh'
  | 'image_prompt_zh'
  | 'video_prompt_zh'

export type StoryAssetEditableField = 'name' | 'description' | 'image_prompt' | 'image_prompt_zh'

const SHOT_TEXT_LIMITS: Record<Exclude<StoryShotEditableField, 'duration_seconds'>, number> = {
  visual_description: 2000,
  framing: 200,
  lighting_atmosphere: 2000,
  dialogue: 1000,
  music_sfx: 1000,
  camera_movement: 200,
  image_prompt: 4000,
  video_prompt: 4000,
  framing_zh: 200,
  image_prompt_zh: 4000,
  video_prompt_zh: 4000,
}

const SHOT_METADATA_FIELDS = new Set<StoryShotEditableField>([
  'lighting_atmosphere',
  'framing_zh',
  'image_prompt_zh',
  'video_prompt_zh',
])

const ASSET_TEXT_LIMITS: Record<StoryAssetEditableField, number> = {
  name: 200,
  description: 2000,
  image_prompt: 4000,
  image_prompt_zh: 4000,
}

function storyMutationCommand(
  source: CanvasNode,
  mutate: (production: Record<string, unknown>) => boolean,
) {
  const storyProduction = source.contentData?.story_production
  const lineage = persistedScriptLineage(source)
  if (!lineage || !isStoryProductionDocument(storyProduction, source.id)) return null
  const updatedProduction = structuredClone(toRaw(storyProduction))
  if (!mutate(updatedProduction)) return null
  return createStoryProductionResultCommand({
    source,
    sourceTextAtRequest: nodeText(source),
    generatedText: nodeText(source),
    storyProduction: updatedProduction,
    lineage,
  })
}

export function createUpdateStoryShotCommand(input: {
  source: CanvasNode
  shotId: string
  field: StoryShotEditableField
  value: string | number
}) {
  return storyMutationCommand(input.source, (production) => {
    const shots = production.shots
    if (!Array.isArray(shots)) return false
    const shot = shots.find((candidate) => isRecord(candidate) && candidate.shot_id === input.shotId)
    if (!isRecord(shot) || !isRecord(shot.locked_fields)) return false
    const isPromptField = ['image_prompt', 'video_prompt', 'image_prompt_zh', 'video_prompt_zh']
      .includes(input.field)
    if (
      (!isPromptField && shot.locked_fields.user_confirmation === true) ||
      (isPromptField && shot.locked_fields.prompt_confirmation === true)
    ) return false
    if (input.field === 'duration_seconds') {
      if (!Number.isInteger(input.value) || Number(input.value) < 1 || Number(input.value) > 30) return false
      shot.duration_seconds = Number(input.value)
    } else {
      if (typeof input.value !== 'string') return false
      const value = input.value.trim()
      if (value.length > SHOT_TEXT_LIMITS[input.field]) return false
      const mayBeEmpty = ['dialogue', 'music_sfx', 'lighting_atmosphere', 'framing_zh', 'image_prompt_zh', 'video_prompt_zh']
        .includes(input.field)
      if (!value && !mayBeEmpty) return false
      if (SHOT_METADATA_FIELDS.has(input.field)) {
        if (!isRecord(shot.editable_fields)) return false
        if (value) shot.editable_fields[input.field] = value
        else delete shot.editable_fields[input.field]
      } else {
        shot[input.field] = value
      }
    }
    shot.generation_revision = Number(shot.generation_revision) + 1
    shot.validation_state = 'needs_review'
    return true
  })
}

export function createUpdateStoryAssetCommand(input: {
  source: CanvasNode
  assetId: string
  field: StoryAssetEditableField
  value: string
}) {
  return storyMutationCommand(input.source, (production) => {
    if (!isRecord(production.assets)) return false
    const assets = ['roles', 'scenes', 'props'].flatMap((kind) => {
      const candidates = production.assets
      return isRecord(candidates) && Array.isArray(candidates[kind])
        ? candidates[kind] as unknown[]
        : []
    })
    const asset = assets.find((candidate) => isRecord(candidate) && candidate.asset_id === input.assetId)
    if (!isRecord(asset) || !isRecord(asset.locked_fields) || asset.locked_fields[input.field] === true) {
      return false
    }
    const value = input.value.trim()
    if (value.length > ASSET_TEXT_LIMITS[input.field]) return false
    if (!value && input.field !== 'image_prompt_zh') return false
    if (input.field === 'image_prompt_zh') {
      if (!isRecord(asset.editable_fields)) return false
      if (value) asset.editable_fields.image_prompt_zh = value
      else delete asset.editable_fields.image_prompt_zh
    } else {
      asset[input.field] = value
    }
    asset.generation_revision = Number(asset.generation_revision) + 1
    asset.validation_state = 'needs_review'
    return true
  })
}

export function createDeleteStoryShotCommand(input: {
  source: CanvasNode
  shotId: string
}) {
  return storyMutationCommand(input.source, (production) => {
    if (!Array.isArray(production.shots) || production.shots.length <= 1) return false
    const target = production.shots.find((candidate) => isRecord(candidate) && candidate.shot_id === input.shotId)
    if (!isRecord(target) || (isRecord(target.locked_fields) && target.locked_fields.user_confirmation === true)) {
      return false
    }
    production.shots = production.shots
      .filter((candidate) => !isRecord(candidate) || candidate.shot_id !== input.shotId)
      .map((candidate, index) => isRecord(candidate)
        ? { ...candidate, shot_number: index + 1 }
        : candidate)
    return true
  })
}

export function createSetStoryShotsConfirmedCommand(input: {
  source: CanvasNode
  confirmed: boolean
}) {
  return storyMutationCommand(input.source, (production) => {
    if (!Array.isArray(production.shots) || !production.shots.length) return false
    for (const candidate of production.shots) {
      if (!isRecord(candidate) || !isRecord(candidate.editable_fields) || !isRecord(candidate.locked_fields)) {
        return false
      }
      if (input.confirmed) {
        candidate.editable_fields.user_confirmation = 'confirmed'
        candidate.locked_fields.user_confirmation = true
        candidate.validation_state = 'valid'
      } else {
        delete candidate.editable_fields.user_confirmation
        delete candidate.locked_fields.user_confirmation
        candidate.validation_state = 'needs_review'
      }
      candidate.generation_revision = Number(candidate.generation_revision) + 1
    }
    return true
  })
}

export function createSetStoryPromptsConfirmedCommand(input: {
  source: CanvasNode
  shotIds: readonly string[]
  confirmed: boolean
}) {
  const selectedShotIds = new Set(input.shotIds)
  if (!selectedShotIds.size) return null
  return storyMutationCommand(input.source, (production) => {
    if (!Array.isArray(production.shots) || !production.shots.length) return false
    let changed = false
    for (const candidate of production.shots) {
      if (
        !isRecord(candidate) ||
        typeof candidate.shot_id !== 'string' ||
        !selectedShotIds.has(candidate.shot_id)
      ) continue
      if (!isRecord(candidate.editable_fields) || !isRecord(candidate.locked_fields)) return false
      if (input.confirmed) {
        candidate.editable_fields.prompt_confirmation = 'confirmed'
        candidate.locked_fields.prompt_confirmation = true
      } else {
        delete candidate.editable_fields.prompt_confirmation
        delete candidate.locked_fields.prompt_confirmation
      }
      candidate.generation_revision = Number(candidate.generation_revision) + 1
      changed = true
    }
    return changed
  })
}
