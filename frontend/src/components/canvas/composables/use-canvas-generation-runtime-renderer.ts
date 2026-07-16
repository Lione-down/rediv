import { watch } from 'vue'
import {
  changedGenerationRuntimeNodeIds,
  type GenerationRuntimePresentation,
} from '../../../modules/canvas/generation-runtime-presentation'

const EMPTY_GENERATION_RUNTIME = new Map<string, GenerationRuntimePresentation>()

export type GenerationRuntimePresentationGetter = () => ReadonlyMap<string, GenerationRuntimePresentation>

export function useCanvasGenerationRuntimeRenderer(
  getPresentations: GenerationRuntimePresentationGetter,
  updateNodeVisuals: (nodeIds: readonly string[]) => void,
) {
  watch(getPresentations, (presentations, previousPresentations = EMPTY_GENERATION_RUNTIME) => {
    updateNodeVisuals(changedGenerationRuntimeNodeIds(previousPresentations, presentations))
  })
}
