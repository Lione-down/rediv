import { toRaw, type ComputedRef } from 'vue'
import { resolveShotSchemaSource, type ProfessionalCanvasActionContext } from '../../../modules/canvas/professional-action-registry'
import { createShotGraphInsertCommand } from '../../../modules/canvas/shot-graph'
import { requestMockShotSchema } from '../../../modules/canvas/shot-schema-service'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'

interface CanvasShotSchemaOptions {
  canvasId: ComputedRef<string>
  projectId: ComputedRef<string>
}

function snapshotNode(node: CanvasNode) {
  return structuredClone(toRaw(node))
}

function sourceText(node: CanvasNode) {
  const value = node.content ?? node.contentData?.text
  return typeof value === 'string' ? value.trim() : ''
}

export function useCanvasShotSchema(options: CanvasShotSchemaOptions) {
  const canvasStore = useCanvasStore()

  function currentSource() {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    if (
      !canvasStore.hasLoaded || canvasStore.activeProjectId !== projectId ||
      canvasStore.activeCanvasId !== canvasId
    ) return null
    return resolveShotSchemaSource({
      assets: [],
      canvasId,
      canvasReady: true,
      isBusy: false,
      isReadOnly: false,
      isWorkflowView: true,
      projectId,
      selectedNodes: canvasStore.selectedNodes,
      userId: 'current-user',
    } satisfies ProfessionalCanvasActionContext)
  }

  async function createShotGraph() {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    const source = currentSource()
    if (!source) throw new Error('请选择一个可用的脚本节点。')
    const sourceSnapshot = snapshotNode(source)
    const script = sourceText(sourceSnapshot)
    const schema = await requestMockShotSchema({
      projectId,
      canvasId,
      sourceScriptNodeId: sourceSnapshot.id,
      script,
    })
    const current = currentSource()
    if (
      !current || current.id !== sourceSnapshot.id || sourceText(current) !== script ||
      options.projectId.value !== projectId || options.canvasId.value !== canvasId
    ) throw new Error('脚本上下文已变化，请重新执行。')
    const command = createShotGraphInsertCommand({
      sourceNode: sourceSnapshot,
      schema,
      existingNodes: canvasStore.nodes,
    })
    if (!command) throw new Error('脚本上下文已变化，请重新执行。')
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    return command.nodes.at(-1)?.id ?? null
  }

  return { createShotGraph }
}
