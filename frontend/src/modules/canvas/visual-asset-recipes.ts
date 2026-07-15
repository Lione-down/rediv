import type { CanvasNode } from '../../types/canvas'

export type VisualAssetRecipeId = 'character-sheet' | 'scene-multiview'
export type VisualAssetRecipeVersion = 1 | 2

export interface VisualAssetRecipeDefinition {
  id: VisualAssetRecipeId
  version: VisualAssetRecipeVersion
  title: string
  actionLabel: string
  description: string
}

export const VISUAL_ASSET_RECIPES: Record<VisualAssetRecipeId, VisualAssetRecipeDefinition> = {
  'character-sheet': {
    id: 'character-sheet', version: 2, title: '角色设定图', actionLabel: '生成角色设定图',
    description: '单参考图 · 白底角色资产板',
  },
  'scene-multiview': {
    id: 'scene-multiview', version: 2, title: '场景多视图', actionLabel: '生成场景多视图',
    description: '单参考图 · 场景多角度板',
  },
}

export function resolveVisualAssetRecipe(node: CanvasNode): VisualAssetRecipeDefinition | null {
  const rawId = node.contentData?.generation_recipe_id
  const version = node.contentData?.generation_recipe_version
  if ((rawId !== 'character-sheet' && rawId !== 'scene-multiview') || (version !== 1 && version !== 2)) return null
  return { ...VISUAL_ASSET_RECIPES[rawId], version: version as VisualAssetRecipeVersion }
}
