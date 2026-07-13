export function createPointerFrameQueue(processEvent: (event: PointerEvent) => void) {
  let pendingEvent: PointerEvent | null = null
  let frame: number | null = null

  function clear() {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    pendingEvent = null
  }

  function flush() {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    const nextEvent = pendingEvent
    pendingEvent = null
    if (nextEvent) processEvent(nextEvent)
  }

  function schedule(event: PointerEvent) {
    pendingEvent = event
    if (frame !== null) return
    frame = requestAnimationFrame(() => {
      frame = null
      const nextEvent = pendingEvent
      pendingEvent = null
      if (nextEvent) processEvent(nextEvent)
    })
  }

  return { clear, flush, schedule }
}
