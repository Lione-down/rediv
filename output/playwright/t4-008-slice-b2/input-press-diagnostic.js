async (page) => {
  const input = page.getByRole('textbox', { name: '项目名称' })
  await input.click()
  const activeAfterClick = await input.evaluate((element) => ({
    isInput: document.activeElement === element,
    tag: document.activeElement?.tagName,
    className: document.activeElement?.className,
    outerHTML: document.activeElement?.outerHTML,
    inputRect: element.getBoundingClientRect().toJSON(),
  }))
  await input.press('Control+A')
  await input.pressSequentially('ascii-project')
  return { activeAfterClick, value: await input.inputValue() }
}
