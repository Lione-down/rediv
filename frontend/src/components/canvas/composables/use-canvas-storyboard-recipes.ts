import { nextTick, type ComputedRef } from 'vue'
import {
  resolveStoryboardRecipe,
  resolveStoryboardRecipeSource,
  type StoryboardRecipeId,
} from '../../../modules/canvas/storyboard-recipe-registry'
import type { VisualAssetRecipeId } from '../../../modules/canvas/visual-asset-recipes'
import { useCanvasStore } from '../../../store/canvas'
import type { Asset } from '../../../types/asset'
import { useCanvasShotSchema } from './use-canvas-shot-schema'

interface CanvasStoryboardRecipesOptions {
  assets: () => readonly Asset[]
  branchVisualRecipe: (recipeId: VisualAssetRecipeId) => Promise<string | null>
  canvasId: ComputedRef<string>
  generateVisualRecipe: (recipeId: VisualAssetRecipeId) => Promise<unknown>
  projectId: ComputedRef<string>
  userId: () => string
}

export function useCanvasStoryboardRecipes(options: CanvasStoryboardRecipesOptions) {
  const canvasStore = useCanvasStore()
  const { createCinematicShotGraph, createShotGraph } = useCanvasShotSchema({ projectId: options.projectId, canvasId: options.canvasId })

  function currentSource(recipeId: StoryboardRecipeId, recipeVersion: number) {
    const recipe = resolveStoryboardRecipe(recipeId, recipeVersion)
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    if (
      !recipe || !canvasStore.hasLoaded || canvasStore.activeProjectId !== projectId ||
      canvasStore.activeCanvasId !== canvasId
    ) return null
    const source = resolveStoryboardRecipeSource(recipe, {
      assets: options.assets(),
      projectId,
      selectedNodes: canvasStore.selectedNodes,
      userId: options.userId(),
    })
    return source ? { recipe, source } : null
  }

  async function createStoryboardRecipe(recipeId: string, recipeVersion: number) {
    const resolved = currentSource(recipeId as StoryboardRecipeId, recipeVersion)
    if (!resolved) throw new Error('当前选择不支持该故事板配方。')
    if (resolved.recipe.execution.type === 'shot-plan') {
      return createShotGraph(resolved.recipe.execution.requestedShotCount)
    }
    const nodeId = await createVisualAssetRecipe(resolved.recipe.execution.recipeId)
    if (!nodeId) throw new Error('视觉参考配方分支创建失败。')
    return nodeId
  }

  async function createVisualAssetRecipe(recipeId: VisualAssetRecipeId) {
    const nodeId = await options.branchVisualRecipe(recipeId)
    if (!nodeId) return null
    await nextTick()
    await options.generateVisualRecipe(recipeId)
    return nodeId
  }

  return { createCinematicShotGraph, createShotGraph, createStoryboardRecipe, createVisualAssetRecipe }
}
