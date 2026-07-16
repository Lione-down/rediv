import { computed } from 'vue'
import {
  createConvertStoryboardGroupCommand,
  createCreateStoryboardGroupCommand,
  createReorderStoryboardGroupCommand,
  createUpdateStoryboardGroupCommand,
} from '../../../modules/canvas/storyboard-commands'
import { resolveStoryboardGroupForNode, type StoryboardGroupSettings } from '../../../modules/canvas/storyboard-group'
import { useCanvasStore } from '../../../store/canvas'

export function useCanvasStoryboardGroups() {
  const canvasStore = useCanvasStore()
  const selectedContext = computed(() => {
    if (canvasStore.selectedNodeIds.length !== 1) return null
    return resolveStoryboardGroupForNode(canvasStore.nodes, canvasStore.selectedNodeIds[0])
  })
  const canCreateStoryboardGroup = computed(() => Boolean(createCreateStoryboardGroupCommand(
    canvasStore.nodes, canvasStore.selectedNodeIds,
  )))
  const storyboardControls = computed(() => {
    const resolved = selectedContext.value
    if (!resolved) return null
    const selectedNodeId = canvasStore.selectedNodeIds[0]
    const nodeId = selectedNodeId === resolved.group.id ? null : selectedNodeId
    return {
      groupId: resolved.group.id,
      nodeId,
      settings: {
        aspect_ratio: resolved.content.aspect_ratio,
        columns: resolved.content.columns,
        show_numbers: resolved.content.show_numbers,
      },
      canMoveEarlier: Boolean(nodeId && createReorderStoryboardGroupCommand(canvasStore.nodes, resolved.group.id, nodeId, -1)),
      canMoveLater: Boolean(nodeId && createReorderStoryboardGroupCommand(canvasStore.nodes, resolved.group.id, nodeId, 1)),
    }
  })

  function createStoryboardGroup() {
    const command = createCreateStoryboardGroupCommand(canvasStore.nodes, canvasStore.selectedNodeIds)
    if (command) void canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  }

  function updateStoryboardGroup(groupId: string, settings: StoryboardGroupSettings) {
    const command = createUpdateStoryboardGroupCommand(canvasStore.nodes, groupId, settings)
    if (command) void canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  }

  function reorderStoryboardGroup(groupId: string, nodeId: string, direction: -1 | 1) {
    const command = createReorderStoryboardGroupCommand(canvasStore.nodes, groupId, nodeId, direction)
    if (command) void canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  }

  function convertStoryboardGroup(groupId: string) {
    const command = createConvertStoryboardGroupCommand(canvasStore.nodes, groupId)
    if (command) void canvasStore.dispatchCommand({ source: 'toolbar', command }).catch(() => undefined)
  }

  return {
    canCreateStoryboardGroup,
    storyboardControls,
    convertStoryboardGroup,
    createStoryboardGroup,
    reorderStoryboardGroup,
    updateStoryboardGroup,
  }
}
