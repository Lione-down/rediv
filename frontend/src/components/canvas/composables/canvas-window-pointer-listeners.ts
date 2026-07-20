interface CanvasWindowPointerListeners {
  pointermove: (event: PointerEvent) => void
  pointerup: (event: PointerEvent) => void
  pointercancel: (event: PointerEvent) => void
}

export function createCanvasWindowPointerListeners(listeners: CanvasWindowPointerListeners) {
  let isBound = false

  function bind() {
    if (isBound) return
    window.addEventListener('pointermove', listeners.pointermove)
    window.addEventListener('pointerup', listeners.pointerup)
    window.addEventListener('pointercancel', listeners.pointercancel)
    isBound = true
  }

  function unbind() {
    if (!isBound) return
    window.removeEventListener('pointermove', listeners.pointermove)
    window.removeEventListener('pointerup', listeners.pointerup)
    window.removeEventListener('pointercancel', listeners.pointercancel)
    isBound = false
  }

  return { bind, unbind }
}
