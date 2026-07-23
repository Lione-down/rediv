import { expect, test } from '@playwright/test'
import * as scriptAuthoring from '../../src/modules/canvas/script-authoring'
import {
  createResourceMockState,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

type ParseStoryDirectorCapabilities = (value: unknown) => {
  contractVersion: number
  models: Array<{ id: string; label: string }>
  director: {
    skillId: string
    skillVersion: number
    userSelectable: false
  }
}

function requireContractFunction<T extends (...args: never[]) => unknown>(
  source: object,
  name: string,
  fingerprint: string,
): T {
  const candidate = (source as Record<string, unknown>)[name]
  expect(typeof candidate, fingerprint).toBe('function')
  return candidate as T
}

test('script capabilities expose allowed models while the project-owned director stays automatic', () => {
  const parseStoryDirectorCapabilities = requireContractFunction<ParseStoryDirectorCapabilities>(
    scriptAuthoring,
    'parseStoryDirectorCapabilities',
    'T6-007 RED [built-in-story-director-capability-absent]: parseStoryDirectorCapabilities is not implemented',
  )

  const capabilities = parseStoryDirectorCapabilities({
    contract_version: 2,
    available: true,
    models: [
      { id: 'text-fast', label: 'Text Fast' },
      { id: 'text-quality', label: 'Text Quality' },
    ],
    director: {
      skill_id: 'revid.story-director',
      skill_version: 1,
      user_selectable: false,
    },
  })

  expect(capabilities).toEqual({
    contractVersion: 2,
    models: [
      { id: 'text-fast', label: 'Text Fast' },
      { id: 'text-quality', label: 'Text Quality' },
    ],
    director: {
      skillId: 'revid.story-director',
      skillVersion: 1,
      userSelectable: false,
    },
  })
})

test('script generation returns one built-in story-production document without a Skill selector', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本', exact: true }).click()

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await palette.getByRole('combobox', { name: '搜索专业操作' }).fill('agnes 创意')
  await palette.getByRole('option', { name: /Agnes：从创意生成脚本/ }).click()

  const authoring = page.getByRole('region', { name: 'AI 脚本写作' })
  await authoring.getByRole('textbox', { name: '创意 Brief' }).fill('雨夜车站，一名摄影师寻找失踪的胶卷。')
  await expect(authoring.getByRole('checkbox')).toHaveCount(0)
  await expect(authoring.getByRole('combobox', { name: /Skill/i })).toHaveCount(0)
  await authoring.getByRole('button', { name: '生成新脚本' }).click()
  await expect.poll(() => state.requests.filter((request) => request.path === '/api/text-generate').length).toBe(1)

  const source = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'script-source')!
  const content = source.content as Record<string, unknown>
  expect(
    content.story_production,
    'T6-007 RED [built-in-story-production-result-absent]: script generation still returns plain text only',
  ).toBeTruthy()
  expect(content.story_production).toMatchObject({
    schema_id: 'revid.story-production',
    schema_version: 1,
    skill_id: 'revid.story-director',
    skill_version: 1,
    source_node_id: 'script-source',
    assets: {
      roles: expect.any(Array),
      scenes: expect.any(Array),
      props: expect.any(Array),
    },
    shots: expect.arrayContaining([
      expect.objectContaining({ video_prompt: expect.any(String) }),
    ]),
  })
})
