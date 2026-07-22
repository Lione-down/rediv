import { ref, type Ref } from 'vue'
import { resolveGenerationRequestContext, type GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import { getGenerationMediaType } from '../../../modules/canvas/node-registry'
import { resolveStoryboardGroup } from '../../../modules/canvas/storyboard-group'
import type { CanvasConnection, CanvasNode } from '../../../types/canvas'

interface StoryboardGroupGenerationOptions {
  canvas: {
    connections: readonly CanvasConnection[]
    findNodeById: (nodeId: string) => CanvasNode | null | undefined
    nodes: readonly CanvasNode[]
  }
  generateNode: (nodeId: string) => Promise<boolean | undefined>
  generationCapabilities: Ref<GenerationCapabilities | null>
  getImageQuota: () => number
  isNodeGenerating: (nodeId: string) => boolean
  isReviewOnly: Ref<boolean>
}

export function useCanvasStoryboardGroupGeneration(options: StoryboardGroupGenerationOptions) {
  const storyboardGenerationSummary = ref('')
  const activeGroups = new Set<string>()

  async function generateStoryboardGroup(groupId: string) {
    if (options.isReviewOnly.value || activeGroups.has(groupId)) return
    const resolved = resolveStoryboardGroup(options.canvas.nodes, groupId)
    if (!resolved || !('storyboard_kind' in resolved.content) || resolved.content.storyboard_kind !== 'shot-plan') return
    const childrenById = new Map(resolved.children.map((child) => [child.id, child]))
    const ordered = resolved.content.ordered_child_ids.flatMap((id) => {
      const child = childrenById.get(id)
      return child ? [child] : []
    })
    let completed = 0
    let failed = 0
    let skipped = 0
    activeGroups.add(groupId)
    storyboardGenerationSummary.value = '资产组生成中…'
    try {
      for (let index = 0; index < ordered.length; index += 1) {
        const child = options.canvas.findNodeById(ordered[index].id)
        const context = child && getGenerationMediaType(child) === 'image'
          ? resolveGenerationRequestContext(
              child, 'image', options.canvas.nodes, options.canvas.connections, options.generationCapabilities.value,
            )
          : null
        if (!child || child.isLocked || options.isNodeGenerating(child.id) ||
          child.contentData?.generation_status === 'succeeded' || !context || context.parameterError || !context.prompt
        ) {
          skipped += 1
          continue
        }
        if (options.getImageQuota() < 1) {
          skipped += ordered.length - index
          break
        }
        if (await options.generateNode(child.id)) completed += 1
        else failed += 1
      }
    } finally {
      activeGroups.delete(groupId)
      storyboardGenerationSummary.value = `完成 ${completed} · 失败 ${failed} · 跳过 ${skipped}`
    }
  }

  return { generateStoryboardGroup, storyboardGenerationSummary }
}
