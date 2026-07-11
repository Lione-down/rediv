async (page) => {
  const input = page.getByRole('textbox', { name: '项目名称' })
  await input.fill('ascii-project')
  const immediate = await input.inputValue()
  await page.waitForTimeout(50)
  const afterDelay = await input.inputValue()
  return { immediate, afterDelay }
}
