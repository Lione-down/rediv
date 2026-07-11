async (page) => page.getByRole('textbox', { name: '项目名称' }).evaluate((element) => ({
  value: element.value,
  disabled: element.disabled,
  readOnly: element.readOnly,
  active: document.activeElement === element,
  outerHTML: element.outerHTML,
}))
