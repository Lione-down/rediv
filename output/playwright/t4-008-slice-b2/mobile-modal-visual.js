async (page) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole('button', { name: '新建项目', exact: true }).first().click()
  const dialog = page.getByRole('dialog', { name: '创建项目' })
  const input = page.getByRole('textbox', { name: '项目名称' })
  await dialog.waitFor()
  await page.waitForTimeout(500)
  const result = await dialog.evaluate((element) => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    inputFocused: document.activeElement?.getAttribute('id') === 'project-name',
    rect: element.getBoundingClientRect().toJSON(),
    opacity: getComputedStyle(element).opacity,
  }))
  if (result.scrollWidth > result.innerWidth) throw new Error('mobile create dialog overflows horizontally')
  if (!result.inputFocused) throw new Error('mobile create dialog did not focus the project name input')
  await page.screenshot({ path: 'mobile-create-modal-375-viewport.png' })
  return result
}
