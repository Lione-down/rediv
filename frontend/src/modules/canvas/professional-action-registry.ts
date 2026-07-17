import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'
import type { ImageGridOutputCount } from './image-grid-split'
import { resolveNodeDefinition, type CanonicalNodeType } from './node-registry'

export type { ImageGridOutputCount } from './image-grid-split'
export type ProfessionalCanvasActionCategory = 'create' | 'script' | 'image'
export type ProfessionalCanvasActionIntent =
  | { type: 'create-node'; nodeType: CanonicalNodeType; subtype: string }
  | { type: 'create-shot-graph' }
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
    id: 'script.create-shot-graph',
    category: 'script',
    title: '从脚本创建分镜计划',
    description: '用本地 mock 解析脚本并创建镜头生成图。',
    keywords: ['脚本', '镜头', '分镜', 'shot', 'script', 'storyboard', 'plan'],
    intent: { type: 'create-shot-graph' },
  },
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
  if (action.intent.type === 'create-shot-graph' && !resolveShotSchemaSource(context)) {
    return { eligible: false, reason: '请选择一个可用的脚本节点。' }
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
