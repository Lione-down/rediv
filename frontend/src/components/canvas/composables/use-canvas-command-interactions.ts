import { useCanvasStore } from '../../../store/canvas'
import {
  createDeleteSelectionCommand,
  createDuplicateNodesCommand,
  type CanvasCommandSource,
} from '../../../modules/canvas/canvas-commands'

interface CanvasCommandInteractionOptions {
  isReadOnly: () => boolean
}

export function isCanvasEditableTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

export function useCanvasCommandInteractions(options: CanvasCommandInteractionOptions) {
  const canvasStore = useCanvasStore()

  function duplicateSelection(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    const command = createDuplicateNodesCommand(canvasStore.selectedNodeIds)
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function deleteSelection(source: CanvasCommandSource) {
    if (options.isReadOnly()) return false
    const command = createDeleteSelectionCommand(
      canvasStore.selectedNodeIds,
      canvasStore.selectedConnectionId ? [canvasStore.selectedConnectionId] : [],
    )
    if (!command) return false
    void canvasStore.dispatchCommand({ source, command }).catch(() => undefined)
    return true
  }

  function handleCommandKeyDown(event: KeyboardEvent) {
    if (event.repeat || options.isReadOnly() || isCanvasEditableTarget(event.target)) return false
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      if (!duplicateSelection('keyboard')) return false
      event.preventDefault()
      return true
    }
    if (event.key !== 'Delete' && event.key !== 'Backspace') return false
    if (!deleteSelection('keyboard')) return false
    event.preventDefault()
    return true
  }

  return { deleteSelection, duplicateSelection, handleCommandKeyDown }
}
