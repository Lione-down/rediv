import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'
import { resolveNodeDefinition } from './node-registry'
import type { VisualAssetRecipeId } from './visual-asset-recipes'

export type StoryboardRecipeId =
  | 'plot-board-4'
  | 'shot-board-9'
  | 'shot-board-16'
  | 'shot-board-25'
  | 'character-turnaround'
  | 'scene-reference-views'

export interface ShotPlanStoryboardRecipeDefinition {
  id: StoryboardRecipeId
  version: 1
  title: string
  description: string
  keywords: readonly string[]
  source: 'script'
  execution: { type: 'shot-plan'; requestedShotCount: 4 | 9 | 16 | 25 }
}

export interface VisualAssetStoryboardRecipeDefinition {
  id: StoryboardRecipeId
  version: 1
  title: string
  description: string
  keywords: readonly string[]
  source: 'image-result'
  execution: { type: 'visual-asset'; recipeId: VisualAssetRecipeId }
}

export type StoryboardRecipeDefinition =
  | ShotPlanStoryboardRecipeDefinition
  | VisualAssetStoryboardRecipeDefinition

export interface StoryboardRecipeSourceContext {
  assets: readonly Asset[]
  projectId: string
  selectedNodes: readonly CanvasNode[]
  userId: string
}

export const STORYBOARD_RECIPES = {
  'plot-board-4': {
    id: 'plot-board-4', version: 1, source: 'script',
    title: '创建四格剧情板',
    description: '把当前脚本规划为 4 个连续镜头。',
    keywords: ['剧情', '四格', '分镜', 'plot', 'storyboard', '4'],
    execution: { type: 'shot-plan', requestedShotCount: 4 },
  },
  'shot-board-9': {
    id: 'shot-board-9', version: 1, source: 'script',
    title: '创建九镜头故事板',
    description: '把当前脚本规划为 9 个连续镜头。',
    keywords: ['镜头', '九宫格', '分镜', 'shot', 'storyboard', '9'],
    execution: { type: 'shot-plan', requestedShotCount: 9 },
  },
  'shot-board-16': {
    id: 'shot-board-16', version: 1, source: 'script',
    title: '创建十六镜头故事板',
    description: '把当前脚本规划为 16 个连续镜头。',
    keywords: ['镜头', '十六宫格', '分镜', 'shot', 'storyboard', '16'],
    execution: { type: 'shot-plan', requestedShotCount: 16 },
  },
  'shot-board-25': {
    id: 'shot-board-25', version: 1, source: 'script',
    title: '创建二十五镜头故事板',
    description: '把当前脚本规划为 25 个连续镜头。',
    keywords: ['镜头', '二十五宫格', '分镜', 'shot', 'storyboard', '25'],
    execution: { type: 'shot-plan', requestedShotCount: 25 },
  },
  'character-turnaround': {
    id: 'character-turnaround', version: 1, source: 'image-result',
    title: '创建角色转面参考板',
    description: '沿用当前角色参考生成正面、侧面与背面参考。',
    keywords: ['角色', '三视图', '转面', 'character', 'turnaround', 'reference'],
    execution: { type: 'visual-asset', recipeId: 'character-sheet' },
  },
  'scene-reference-views': {
    id: 'scene-reference-views', version: 1, source: 'image-result',
    title: '创建场景多视角参考板',
    description: '沿用当前场景参考生成一致的多角度参考。',
    keywords: ['场景', '多视角', '空间', 'scene', 'multiview', 'reference'],
    execution: { type: 'visual-asset', recipeId: 'scene-multiview' },
  },
} as const satisfies Record<StoryboardRecipeId, StoryboardRecipeDefinition>

export function resolveStoryboardRecipe(id: string, version = 1): StoryboardRecipeDefinition | null {
  if (version !== 1 || !Object.prototype.hasOwnProperty.call(STORYBOARD_RECIPES, id)) return null
  return STORYBOARD_RECIPES[id as StoryboardRecipeId]
}

function scriptSource(node: CanvasNode) {
  const textValue = node.content ?? node.contentData?.text
  const text = typeof textValue === 'string' ? textValue.trim() : ''
  return node.type === 'script' && resolveNodeDefinition(node.type, node.contentData).kind === 'canonical' &&
    node.contentData?.subtype === 'script' && !node.isLocked && !node.parentNodeId &&
    Boolean(text) && text.length <= 12000
}

function visualAssetSource(node: CanvasNode, context: StoryboardRecipeSourceContext) {
  if (
    node.type !== 'result' || resolveNodeDefinition(node.type, node.contentData).kind !== 'canonical' ||
    node.contentData?.subtype !== 'image' || node.isLocked || node.parentNodeId
  ) return null
  const assetId = typeof node.contentData.asset_id === 'string' ? node.contentData.asset_id.trim() : ''
  const projectId = typeof node.contentData.project_id === 'string' ? node.contentData.project_id.trim() : ''
  const url = typeof node.contentData.url === 'string' ? node.contentData.url.trim() : ''
  if (!assetId || projectId !== context.projectId || !url) return null
  const asset = context.assets.find((candidate) => candidate.id === assetId)
  if (
    !asset || asset.user_id !== context.userId || asset.project_id !== context.projectId ||
    asset.type !== 'image' || asset.status !== 'active' || asset.url !== url
  ) return null
  return asset
}

export function resolveStoryboardRecipeSource(
  recipe: StoryboardRecipeDefinition,
  context: StoryboardRecipeSourceContext,
) {
  if (context.selectedNodes.length !== 1) return null
  const node = context.selectedNodes[0]
  if (recipe.source === 'script') {
    return scriptSource(node) ? { type: 'script' as const, node } : null
  }
  const asset = visualAssetSource(node, context)
  return asset ? { type: 'visual-asset' as const, node, asset } : null
}
