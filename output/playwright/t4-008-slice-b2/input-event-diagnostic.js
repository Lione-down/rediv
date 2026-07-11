async (page) => page.getByRole('textbox', { name: '项目名称' }).evaluate(async (element) => {
  const events = []
  for (const name of ['beforeinput', 'input', 'change']) {
    element.addEventListener(name, () => events.push({ name, value: element.value }))
  }
  element.focus()
  element.value = 'event-project'
  element.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    composed: true,
    data: 'event-project',
    inputType: 'insertText',
  }))
  const immediate = element.value
  await Promise.resolve()
  const afterMicrotask = element.value
  await new Promise((resolve) => requestAnimationFrame(resolve))
  const afterFrame = element.value
  return { events, immediate, afterMicrotask, afterFrame }
})
