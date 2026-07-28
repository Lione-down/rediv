import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  createGroupNodesCommand,
  createUngroupNodesCommand,
} from '../../modules/canvas/canvas-commands'
import type { CanvasConnection, CanvasNode } from '../../types/canvas'

interface MarqueeSelectionOptions {
  beginCanvasPan: (event: PointerEvent) => void
  cancelCanvasPan: (event: PointerEvent) => void
  connections: () => readonly CanvasConnection[]
  finishCanvasPan: (event: PointerEvent) => void
  groupSelection: () => void
  moveCanvas: (event: PointerEvent) => void
  nodes: () => readonly CanvasNode[]
  selectedNodeIds: () => readonly string[]
  setInteractionState: (state: 'idle' | 'marquee') => void
  setSelection: (nodeIds: string[]) => void
  ungroupSelection: () => void
}

const INTERACTIVE_SELECTOR = [
  '[data-runtime-node]',
  'button',
  'input',
  'textarea',
  'select',
  'video',
  'audio',
  'a',
  '[contenteditable="true"]',
].join(', ')

function isEditableTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
  ))
}

export function useRuntimeMarqueeSelection(options: MarqueeSelectionOptions) {
  const marquee = ref<{
    additive: boolean
    current: { x: number; y: number }
    pointerId: number
    start: { x: number; y: number }
  } | null>(null)
  const isSpacePressed = ref(false)
  const canGroupSelection = computed(() => Boolean(
    createGroupNodesCommand(options.nodes(), options.selectedNodeIds()),
  ))
  const canUngroupSelection = computed(() => Boolean(
    createUngroupNodesCommand(
      options.nodes(),
      options.selectedNodeIds(),
      options.connections(),
    ),
  ))
  const marqueeStyle = computed(() => {
    const selection = marquee.value
    if (!selection) return {}
    return {
      left: `${Math.min(selection.start.x, selection.current.x)}px`,
      top: `${Math.min(selection.start.y, selection.current.y)}px`,
      width: `${Math.abs(selection.current.x - selection.start.x)}px`,
      height: `${Math.abs(selection.current.y - selection.start.y)}px`,
    }
  })

  function beginWorldPointer(event: PointerEvent) {
    if (event.button !== 0 && event.button !== 1) return
    const target = event.target
    if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) return
    if (event.button === 1 || isSpacePressed.value) {
      options.beginCanvasPan(event)
      return
    }
    const world = event.currentTarget as HTMLElement
    world.setPointerCapture(event.pointerId)
    marquee.value = {
      additive: event.shiftKey || event.ctrlKey || event.metaKey,
      current: { x: event.clientX, y: event.clientY },
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
    }
    options.setInteractionState('marquee')
  }

  function moveWorldPointer(event: PointerEvent) {
    const selection = marquee.value
    if (selection?.pointerId === event.pointerId) {
      marquee.value = {
        ...selection,
        current: { x: event.clientX, y: event.clientY },
      }
      return
    }
    options.moveCanvas(event)
  }

  function finishWorldPointer(event: PointerEvent) {
    const selection = marquee.value
    if (!selection || selection.pointerId !== event.pointerId) {
      options.finishCanvasPan(event)
      return
    }
    const left = Math.min(selection.start.x, selection.current.x)
    const right = Math.max(selection.start.x, selection.current.x)
    const top = Math.min(selection.start.y, selection.current.y)
    const bottom = Math.max(selection.start.y, selection.current.y)
    const selectedIds = [...document.querySelectorAll<HTMLElement>('[data-runtime-node]')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.left <= right && rect.right >= left && rect.top <= bottom && rect.bottom >= top
      })
      .flatMap((element) => element.dataset.runtimeNode ? [element.dataset.runtimeNode] : [])
    options.setSelection(
      selection.additive
        ? [...new Set([...options.selectedNodeIds(), ...selectedIds])]
        : selectedIds,
    )
    marquee.value = null
    options.setInteractionState('idle')
  }

  function cancelWorldPointer(event: PointerEvent) {
    if (marquee.value?.pointerId !== event.pointerId) {
      options.cancelCanvasPan(event)
      return
    }
    marquee.value = null
    options.setInteractionState('idle')
  }

  function handleRuntimeKeyDown(event: KeyboardEvent) {
    if (isEditableTarget(event.target)) return
    if (event.code === 'Space') {
      isSpacePressed.value = true
      event.preventDefault()
      return
    }
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'g') return
    event.preventDefault()
    if (event.shiftKey) {
      if (canUngroupSelection.value) options.ungroupSelection()
    } else if (canGroupSelection.value) {
      options.groupSelection()
    }
  }

  function handleRuntimeKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space') isSpacePressed.value = false
  }

  onMounted(() => {
    window.addEventListener('keydown', handleRuntimeKeyDown, true)
    window.addEventListener('keyup', handleRuntimeKeyUp, true)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleRuntimeKeyDown, true)
    window.removeEventListener('keyup', handleRuntimeKeyUp, true)
  })

  return {
    beginWorldPointer,
    cancelWorldPointer,
    canGroupSelection,
    canUngroupSelection,
    finishWorldPointer,
    marquee,
    marqueeStyle,
    moveWorldPointer,
  }
}
