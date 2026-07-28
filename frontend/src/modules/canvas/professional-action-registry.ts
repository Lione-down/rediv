import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'
import type { ImageGridOutputCount } from './image-grid-split'
import { resolveNodeDefinition, type CanonicalNodeType } from './node-registry'
import {
  STORYBOARD_RECIPES,
  resolveStoryboardRecipe,
  resolveStoryboardRecipeSource,
  type StoryboardRecipeId,
} from './storyboard-recipe-registry'
import {
  IMAGE_OPERATIONS,
  resolveImageOperationSources,
  type ImageOperationCapabilities,
  type ImageOperationId,
} from './image-operations'
import { resolveScriptAuthoringEligibility, type ScriptAuthoringIntent } from './script-authoring'

export type { ImageGridOutputCount } from './image-grid-split'
export type ProfessionalCanvasActionCategory = 'create' | 'script' | 'image' | 'storyboard' | 'image-operation' | 'video' | 'audio' | 'agent-skill'
export type ProfessionalCanvasActionIntent =
  | { type: 'create-node'; nodeType: CanonicalNodeType; subtype: string }
  | { type: 'create-shot-graph' }
  | { type: 'open-script-authoring'; intent: ScriptAuthoringIntent }
  | { type: 'create-cinematic-shot-graph'; skillId: 'revid.cinema-script'; skillVersion: 1 }
  | { type: 'create-storyboard-recipe'; recipeId: StoryboardRecipeId; recipeVersion: 1 }
  | { type: 'create-image-operation'; operationId: ImageOperationId; operationVersion: 1 }
  | { type: 'open-video-edit-preflight'; templateId: 'video-edit-preflight'; templateVersion: 1 }
  | { type: 'open-audio-generation-preflight'; templateId: 'audio-generation-preflight'; templateVersion: 1 }
  | { type: 'open-agent-skill-preflight'; skillId: 'revid.canvas-context'; skillVersion: 1 }
  | { type: 'split-image-grid'; outputCount: ImageGridOutputCount }

export interface ProfessionalCanvasActionDefinition {
  id: string
  category: ProfessionalCanvasActionCategory
  title: string
  description: string
  keywords: readonly string[]
  intent: ProfessionalCanvasActionIntent
}

export interface ProfessionalCanvasActionContext {
  assets: readonly Asset[]
  canvasId: string
  canvasReady: boolean
  imageOperationCapabilities?: ImageOperationCapabilities | null
  isBusy: boolean
  isReadOnly: boolean
  isWorkflowView: boolean
  projectId: string
  selectedNodes: readonly CanvasNode[]
  userId: string
}

export interface ResolvedProfessionalCanvasAction extends ProfessionalCanvasActionDefinition {
  eligibility: { eligible: boolean; reason?: string }
}

export interface OwnedMediaActionTarget {
  assetId: string
  kind: 'image' | 'video'
  nodeId: string
  title: string
  url: string
}

const STORYBOARD_RECIPE_ACTIONS = Object.values(STORYBOARD_RECIPES).map((recipe) => ({
  id: `storyboard.${recipe.id}`,
  category: 'storyboard' as const,
  title: recipe.title,
  description: recipe.description,
  keywords: recipe.keywords,
  intent: {
    type: 'create-storyboard-recipe' as const,
    recipeId: recipe.id,
    recipeVersion: recipe.version,
  },
})) satisfies readonly ProfessionalCanvasActionDefinition[]

const IMAGE_OPERATION_ACTIONS = Object.values(IMAGE_OPERATIONS).map((operation) => ({
  id: `image-operation.${operation.id}`,
  category: 'image-operation' as const,
  title: operation.actionLabel,
  description: operation.description,
  keywords: operation.keywords,
  intent: {
    type: 'create-image-operation' as const,
    operationId: operation.id,
    operationVersion: operation.version,
  },
})) satisfies readonly ProfessionalCanvasActionDefinition[]

export const PROFESSIONAL_CANVAS_ACTIONS = [
  {
    id: 'canvas.create-script',
    category: 'create',
    title: '新建脚本节点',
    description: '在当前视野创建可编辑脚本。',
    keywords: ['脚本', '提示词', 'script', 'prompt', 'text', 'node'],
    intent: { type: 'create-node', nodeType: 'script', subtype: 'script' },
  },
  {
    id: 'canvas.create-note',
    category: 'create',
    title: '新建笔记节点',
    description: '在当前视野创建画布笔记。',
    keywords: ['笔记', '备注', 'note', 'annotation', 'node'],
    intent: { type: 'create-node', nodeType: 'note', subtype: 'annotation' },
  },
  {
    id: 'canvas.create-image-generation',
    category: 'create',
    title: '新建图片生成节点',
    description: '创建一个图片生成任务节点。',
    keywords: ['图片', '图像', '生成', 'image', 'generation', 'generate', 'node'],
    intent: { type: 'create-node', nodeType: 'generation', subtype: 'image' },
  },
  {
    id: 'canvas.create-video-generation',
    category: 'create',
    title: '新建视频生成节点',
    description: '创建一个视频生成任务节点。',
    keywords: ['视频', '生成', 'video', 'generation', 'generate', 'node'],
    intent: { type: 'create-node', nodeType: 'generation', subtype: 'video' },
  },
  {
    id: 'script.generate-draft',
    category: 'script',
    title: 'Agnes：从创意生成脚本',
    description: '使用 Agnes 2.0 Flash 生成新的可编辑脚本，不自动创建分镜或媒体。',
    keywords: ['agnes', '脚本', '创意', '生成', 'draft', 'script', 'write'],
    intent: { type: 'open-script-authoring', intent: 'script_draft' },
  },
  {
    id: 'script.refine',
    category: 'script',
    title: 'Agnes：优化当前脚本',
    description: '使用 Agnes 2.0 Flash 基于当前精确脚本文本生成优化版本。',
    keywords: ['agnes', '脚本', '优化', '改写', 'refine', 'script', 'rewrite'],
    intent: { type: 'open-script-authoring', intent: 'script_refine' },
  },
  {
    id: 'script.create-shot-graph',
    category: 'script',
    title: '从脚本创建分镜计划',
    description: '用本地 mock 解析脚本并创建镜头生成图。',
    keywords: ['脚本', '镜头', '分镜', 'shot', 'script', 'storyboard', 'plan'],
    intent: { type: 'create-shot-graph' },
  },
  {
    id: 'script.create-cinematic-shot-graph',
    category: 'script',
    title: 'Cinematic Script：优化并创建分镜',
    description: '使用 revid.cinema-script.v1、当前 Agnes model 和 exact preflight 创建 strict shot document。',
    keywords: ['cinematic', 'script', 'skill', '电影', '脚本', '镜头', '分镜', '优化'],
    intent: { type: 'create-cinematic-shot-graph', skillId: 'revid.cinema-script', skillVersion: 1 },
  },
  {
    id: 'video.edit-preflight',
    category: 'video',
    title: '视频裁剪与拼接预检',
    description: '检查当前视频素材的裁剪、序列预览和导出边界。',
    keywords: ['视频', '裁剪', '拼接', '预览', '导出', 'trim', 'concat', 'preview', 'export'],
    intent: { type: 'open-video-edit-preflight', templateId: 'video-edit-preflight', templateVersion: 1 },
  },
  {
    id: 'audio.generation-preflight',
    category: 'audio',
    title: '音频生成与驱动视频预检',
    description: '检查脚本音频或音频驱动视频的 provider、quota 和任务边界。',
    keywords: ['音频', '旁白', '声音', '音乐', '驱动视频', 'audio', 'speech', 'music', 'sound', 'preflight'],
    intent: { type: 'open-audio-generation-preflight', templateId: 'audio-generation-preflight', templateVersion: 1 },
  },
  {
    id: 'agent-skill.canvas-context',
    category: 'agent-skill',
    title: 'Agent Canvas context preflight',
    description: 'Inspect the current Canvas selection through Revid’s mock-only Agent/Skill contract.',
    keywords: ['agent', 'skill', 'context', 'canvas', 'mock', 'preflight', '上下文', '预检'],
    intent: { type: 'open-agent-skill-preflight', skillId: 'revid.canvas-context', skillVersion: 1 },
  },
  ...STORYBOARD_RECIPE_ACTIONS,
  ...IMAGE_OPERATION_ACTIONS,
  {
    id: 'image.split-4',
    category: 'image',
    title: '拆分为四宫格',
    description: '把当前项目图片拆成 4 个新素材。',
    keywords: ['图片', '拆分', '切图', '四宫格', '2x2', '4', 'image', 'split', 'grid'],
    intent: { type: 'split-image-grid', outputCount: 4 },
  },
  {
    id: 'image.split-9',
    category: 'image',
    title: '拆分为九宫格',
    description: '把当前项目图片拆成 9 个新素材。',
    keywords: ['图片', '拆分', '切图', '九宫格', '3x3', '9', 'image', 'split', 'grid'],
    intent: { type: 'split-image-grid', outputCount: 9 },
  },
  {
    id: 'image.split-16',
    category: 'image',
    title: '拆分为十六宫格',
    description: '把当前项目图片拆成 16 个新素材。',
    keywords: ['图片', '拆分', '切图', '十六宫格', '4x4', '16', 'image', 'split', 'grid'],
    intent: { type: 'split-image-grid', outputCount: 16 },
  },
  {
    id: 'image.split-25',
    category: 'image',
    title: '拆分为二十五宫格',
    description: '把当前项目图片拆成 25 个新素材。',
    keywords: ['图片', '拆分', '切图', '二十五宫格', '5x5', '25', 'image', 'split', 'grid'],
    intent: { type: 'split-image-grid', outputCount: 25 },
  },
] as const satisfies readonly ProfessionalCanvasActionDefinition[]

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function resolveOwnedMediaActionTarget(
  context: Pick<ProfessionalCanvasActionContext, 'assets' | 'projectId' | 'selectedNodes' | 'userId'>,
): OwnedMediaActionTarget | null {
  if (context.selectedNodes.length !== 1) return null
  const node = context.selectedNodes[0]
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const kind = node.contentData?.subtype
  if (
    definition.kind !== 'canonical' ||
    (node.type !== 'asset' && node.type !== 'result' && node.type !== 'generation') ||
    (kind !== 'image' && kind !== 'video') || node.isLocked || node.parentNodeId
  ) return null
  const assetId = readString(node.contentData?.asset_id)
  const nodeProjectId = readString(node.contentData?.project_id)
  const url = readString(node.contentData?.url)
  if (!assetId || !url) return null
  if (node.type === 'generation') {
    const resultAssetId = readString(node.contentData?.result_asset_id)
    const jobId = readString(node.contentData?.last_generation_job_id)
    if (resultAssetId !== assetId || !jobId) return null
    return { assetId, kind, nodeId: node.id, title: node.title, url }
  }
  if (nodeProjectId !== context.projectId) return null
  const asset = context.assets.find((candidate) => candidate.id === assetId)
  if (
    !asset || asset.user_id !== context.userId || asset.project_id !== context.projectId ||
    asset.type !== kind || asset.status !== 'active' || asset.url !== url
  ) return null
  return { assetId, kind, nodeId: node.id, title: node.title, url }
}

export function resolveProjectImageSplitTarget(context: ProfessionalCanvasActionContext) {
  if (context.selectedNodes.length !== 1) return null
  const node = context.selectedNodes[0]
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (
    node.type !== 'asset' || definition.kind !== 'canonical' ||
    node.contentData?.subtype !== 'image' || node.isLocked || node.parentNodeId
  ) return null
  const assetId = readString(node.contentData?.asset_id)
  const nodeProjectId = readString(node.contentData?.project_id)
  const nodeUrl = readString(node.contentData?.url)
  if (!assetId || nodeProjectId !== context.projectId || !nodeUrl) return null
  const asset = context.assets.find((candidate) => candidate.id === assetId)
  if (
    !asset || asset.project_id !== context.projectId || asset.user_id !== context.userId ||
    asset.type !== 'image' || asset.source !== 'upload' || asset.status !== 'active' ||
    !asset.url || asset.url !== nodeUrl
  ) return null
  return { asset, node }
}

export function resolveShotSchemaSource(context: ProfessionalCanvasActionContext) {
  if (context.selectedNodes.length !== 1) return null
  const node = context.selectedNodes[0]
  const definition = resolveNodeDefinition(node.type, node.contentData)
  const textValue = node.content ?? node.contentData?.text
  const text = typeof textValue === 'string' ? textValue.trim() : ''
  if (
    node.type !== 'script' || definition.kind !== 'canonical' ||
    node.contentData?.subtype !== 'script' || node.isLocked || node.parentNodeId ||
    !text || text.length > 12000
  ) return null
  return node
}

function baseIneligibility(context: ProfessionalCanvasActionContext) {
  if (!context.projectId.trim() || !context.canvasId.trim() || !context.canvasReady) return '画布尚未就绪。'
  if (!context.userId.trim()) return '登录状态不可用。'
  if (context.isReadOnly) return '当前为只读审阅模式。'
  if (!context.isWorkflowView) return '请返回工作流视图。'
  if (context.isBusy) return '当前操作尚未完成。'
  return null
}

function resolveEligibility(
  context: ProfessionalCanvasActionContext,
  action: ProfessionalCanvasActionDefinition,
) {
  const baseReason = baseIneligibility(context)
  if (baseReason) return { eligible: false, reason: baseReason }
  if (action.intent.type === 'split-image-grid' && !resolveProjectImageSplitTarget(context)) {
    return { eligible: false, reason: '请选择一个可用的项目上传图片。' }
  }
  if ((action.intent.type === 'create-shot-graph' || action.intent.type === 'create-cinematic-shot-graph') && !resolveShotSchemaSource(context)) {
    return { eligible: false, reason: '请选择一个可用的脚本节点。' }
  }
  if (action.intent.type === 'open-script-authoring') {
    const eligibility = resolveScriptAuthoringEligibility({
      canvasReady: context.canvasReady,
      intent: action.intent.intent,
      isReadOnly: context.isReadOnly,
      isReviewOnly: context.isReadOnly,
      selectedNodes: context.selectedNodes,
    })
    if (!eligibility.eligible) return { eligible: false, reason: eligibility.reason }
  }
  if (action.intent.type === 'open-video-edit-preflight') {
    const eligible = context.selectedNodes.length > 0 && context.selectedNodes.every((node) => {
      const assetId = readString(node.contentData?.asset_id)
      const url = readString(node.contentData?.url)
      const asset = assetId ? context.assets.find((candidate) => candidate.id === assetId) : null
      return !node.isLocked && (node.type === 'asset' || node.type === 'result') &&
        node.contentData?.subtype === 'video' && node.contentData?.project_id === context.projectId &&
        Boolean(url) && Boolean(asset && asset.user_id === context.userId && asset.project_id === context.projectId &&
          asset.type === 'video' && asset.status === 'active' && asset.url === url)
    })
    if (!eligible) return { eligible: false, reason: '请选择当前项目中可用的视频素材或结果节点。' }
  }
  if (action.intent.type === 'open-audio-generation-preflight') {
    const hasPrompt = Boolean(resolveShotSchemaSource(context))
    const mediaTypes = context.selectedNodes.map((node) => node.contentData?.subtype)
    const hasAudioDrivenVideo = context.selectedNodes.length === 2 &&
      mediaTypes.includes('audio') && mediaTypes.includes('video') && context.selectedNodes.every((node) => !node.isLocked)
    if (!hasPrompt && !hasAudioDrivenVideo) {
      return { eligible: false, reason: '请选择一条可用脚本，或一条音频和一条视频素材。' }
    }
  }
  if (action.intent.type === 'open-agent-skill-preflight') {
    const eligible = context.selectedNodes.length >= 1 && context.selectedNodes.length <= 25 &&
      context.selectedNodes.every((node) => Boolean(readString(node.id)) && !node.isLocked)
    if (!eligible) return { eligible: false, reason: '请选择 1 至 25 个当前画布可用节点。' }
  }
  if (action.intent.type === 'create-storyboard-recipe') {
    const recipe = resolveStoryboardRecipe(action.intent.recipeId, action.intent.recipeVersion)
    if (!recipe || !resolveStoryboardRecipeSource(recipe, context)) {
      return { eligible: false, reason: '当前选择不支持该故事板配方。' }
    }
  }
  if (action.intent.type === 'create-image-operation') {
    const operation = IMAGE_OPERATIONS[action.intent.operationId]
    if (!operation || action.intent.operationVersion !== operation.version || !resolveImageOperationSources(operation, {
      assets: context.assets,
      capabilities: context.imageOperationCapabilities ?? null,
      projectId: context.projectId,
      selectedNodes: context.selectedNodes,
      userId: context.userId,
    })) return { eligible: false, reason: '当前选择或 capability 不支持该图片操作。' }
  }
  return { eligible: true }
}

function normalizedSearchTerms(query: string) {
  return query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
}

function actionSearchText(action: ProfessionalCanvasActionDefinition) {
  return [
    action.id,
    action.category,
    action.title,
    action.description,
    ...action.keywords,
    action.intent.type,
    action.intent.type === 'create-node'
      ? `${action.intent.nodeType} ${action.intent.subtype}`
      : action.intent.type === 'split-image-grid'
        ? String(action.intent.outputCount)
        : action.intent.type === 'create-storyboard-recipe'
          ? `${action.intent.recipeId} storyboard recipe`
          : action.intent.type === 'create-image-operation'
            ? `${action.intent.operationId} image operation edit`
          : action.intent.type === 'open-video-edit-preflight'
            ? `${action.intent.templateId} video trim concat preview export`
          : action.intent.type === 'open-agent-skill-preflight'
            ? `${action.intent.skillId} agent skill canvas context mock preflight`
            : action.intent.type === 'open-script-authoring'
              ? `${action.intent.intent} agnes script authoring`
            : action.intent.type === 'create-cinematic-shot-graph'
              ? `${action.intent.skillId} cinematic script shot storyboard`
              : 'script shot storyboard',
  ].join(' ').normalize('NFKC').toLocaleLowerCase()
}

export function resolveProfessionalCanvasActions(
  context: ProfessionalCanvasActionContext,
  query = '',
): ResolvedProfessionalCanvasAction[] {
  const terms = normalizedSearchTerms(query)
  return PROFESSIONAL_CANVAS_ACTIONS
    .filter((action) => {
      const searchText = actionSearchText(action)
      return terms.every((term) => searchText.includes(term))
    })
    .map((action) => ({ ...action, eligibility: resolveEligibility(context, action) }))
}

export function resolveProfessionalCanvasAction(
  context: ProfessionalCanvasActionContext,
  actionId: string,
) {
  const action = PROFESSIONAL_CANVAS_ACTIONS.find((candidate) => candidate.id === actionId)
  return action ? { ...action, eligibility: resolveEligibility(context, action) } : null
}
