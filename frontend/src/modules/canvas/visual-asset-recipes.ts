import type { CanvasNode } from '../../types/canvas'

export type VisualAssetRecipeId = 'character-sheet' | 'scene-multiview'

export interface VisualAssetRecipeDefinition {
  id: VisualAssetRecipeId
  version: 1
  title: string
  actionLabel: string
  description: string
}

export const VISUAL_ASSET_RECIPES: Record<VisualAssetRecipeId, VisualAssetRecipeDefinition> = {
  'character-sheet': {
    id: 'character-sheet', version: 1, title: '角色设定图', actionLabel: '生成角色设定图',
    description: '单参考图 · 白底角色资产板',
  },
  'scene-multiview': {
    id: 'scene-multiview', version: 1, title: '场景多视图', actionLabel: '生成场景多视图',
    description: '单参考图 · 场景多角度板',
  },
}

export function resolveVisualAssetRecipe(node: CanvasNode) {
  const rawId = node.contentData?.generation_recipe_id
  const version = node.contentData?.generation_recipe_version
  if ((rawId !== 'character-sheet' && rawId !== 'scene-multiview') || version !== 1) return null
  return VISUAL_ASSET_RECIPES[rawId]
}
