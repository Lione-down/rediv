import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  addCinematicVideoNode,
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const VISUAL_DIR = resolve(process.cwd(), '../output/playwright/t5-091-cinematic-skills')
const DIRECTOR_V2_VISUAL_DIR = resolve(process.cwd(), '../output/playwright/t6-001-cinematic-director-v2')

async function selectCoverGeneration(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成', exact: true }).click()
}

function enableCinematicImage(state: ReturnType<typeof createResourceMockState>) {
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    cinematic_skill: {
      contract_version: 1, enabled: true, skill_id: 'revid.cinema-image', skill_version: 1,
      provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', mentions: [],
    },
  }
}

function configureDirectorV2Result(state: ReturnType<typeof createResourceMockState>) {
  const revision = 'a'.repeat(64)
  const brief = {
    contract_version: 1, schema_id: 'revid.cinematic-director-brief',
    source_script_node_id: 'script-source', source_revision: revision,
    intention: '让角色从迟疑转为行动', visible_beat: '角色走到站台入口',
    camera: { shot: '中景', movement: '缓慢推进', endpoint: '站台入口' },
    light: { motivated_source: '站台灯', transition: '由冷转暖' },
    blocking_performance: '先停顿再迈步', motion: '雨线稳定', sound_intent: '保留雨声',
    continuity_anchors: ['深灰风衣'], must_preserve: ['角色身份'], allowed_changes: ['镜头距离'],
    must_not_transfer: [], safety_notes: [],
  }
  const sequence = {
    contract_version: 1, schema_id: 'revid.cinematic-sequence', sequence_id: 'sequence-script-source',
    source_script_node_id: 'script-source', source_revision: revision,
    story_objective: '角色决定离开', final_outcome: '角色登上列车', director_brief: brief,
    ordered_beats: [
      { beat_id: 'beat-01', summary: '走到站台入口', state: 'planned' },
      { beat_id: 'beat-02', summary: '登上列车', state: 'reserved' },
    ],
    clips: [{
      clip_id: 'clip-01', scene_id: 'scene-01', narrative_job: '让决定可见', intention: '从迟疑转为行动',
      state: 'generated', accepted_result_node_id: null, accepted_result_revision: null, observed_end_state: null,
      completed_beat_ids: [], reserved_beat_ids: ['beat-02'], extension_depth: 0, attempt_count: 1,
    }],
    canon_revision: 0,
  }
  const script = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!
  script.content = { ...(script.content as Record<string, unknown>), cinematic_sequence: sequence }
  const result = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-existing')!
  result.status = 'success'
  const task = state.tasks.find((item) => item.id === 'task-existing-success')!
  task.request_parameters = {
    cinematic_skill: {
      contract_version: 2,
      canonical_request: {
        skill_id: 'revid.cinema-image', skill_version: 2,
        provider: { provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', capability_version: 1 },
        parameters: { image_ids: [], aspect_ratio: '4:3' }, references: [], director_brief: brief,
        sequence_context: { sequence_id: sequence.sequence_id, current_clip_id: 'clip-01' }, retake_context: null,
      },
    },
  }
}

test('recommended cinematic Skill stays off until one explicit user toggle', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await selectCoverGeneration(page)
  const controls = page.getByRole('region', { name: 'Cinematic Skill 与结构化引用' })
  const toggle = controls.getByRole('checkbox')
  await expect(toggle).not.toBeChecked()
  await expect(controls).toContainText('普通 generation 不会静默套用优化')
  expect(state.requests.filter((item) => item.path.includes('/agent-skills/cinematic-'))).toHaveLength(0)

  await toggle.check()
  await expect(toggle).toBeChecked()
  await expect(controls.getByLabel('Cinematic Skill model')).toHaveValue('agnes::agnes-image-2.1-flash')
  await expect.poll(() => documentPatches(state).length).toBe(1)
  expect(state.requests.filter((item) => item.path.endsWith('/cinematic-capabilities'))).toHaveLength(1)
  expect(state.requests.filter((item) => item.path.endsWith('/cinematic-sources'))).toHaveLength(1)
})

test('active Director v2 binds non-transfer rules, disables unsupported media with reasons, and Send stays explicit', async ({ page }) => {
  const state = createResourceMockState()
  const script = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...script,
    id: 'audio-reference',
    node_type: 'asset',
    content: { title: '节奏音频', subtype: 'audio', serialization_version: 1, asset_id: 'asset-audio' },
    position_x: 1320,
  })
  await openResourceWorkspace(page, state)
  await selectCoverGeneration(page)
  const controls = page.getByRole('region', { name: 'Cinematic Skill 与结构化引用' })
  await controls.getByRole('checkbox').check()
  await expect(controls).toContainText('revid.cinema-image.v2')

  const mentionInput = controls.getByLabel('结构化 @ 引用指令')
  await mentionInput.press('@')
  const chooser = controls.getByRole('listbox', { name: '当前 Canvas 可引用节点' })
  const audioOption = chooser.getByRole('option', { name: /节奏音频/ })
  await expect(audioOption).toBeDisabled()
  await expect(audioOption).toContainText('不支持 audio 引用')
  await mentionInput.press('Escape')

  await controls.getByText(/不传递/).click()
  await controls.getByRole('checkbox', { name: '背景' }).check()
  await controls.getByRole('checkbox', { name: '机位' }).check()
  await mentionInput.press('@')
  await mentionInput.fill('@ 只保留角色身份')
  await chooser.getByRole('option', { name: /历史图片生成结果/ }).click()
  await expect(controls.getByRole('list', { name: '已绑定结构化引用' })).toContainText('不传递 background、camera')
  const saved = () => (state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!.content as Record<string, unknown>).cinematic_skill
  await expect.poll(() => JSON.stringify(saved())).toContain('must_not_transfer')
  expect(saved()).toEqual(expect.objectContaining({
    skill_version: 2,
    provider_id: 'agnes',
    model_id: 'agnes-image-2.1-flash',
    mentions: [expect.objectContaining({ must_not_transfer: ['background', 'camera'] })],
  }))

  await controls.getByRole('button', { name: '预检优化请求' }).click()
  await expect(controls.getByRole('region', { name: 'Cinematic Skill 执行摘要' })).toContainText('revid.cinema-image.v2')
  expect(state.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(0)
  await page.getByRole('region', { name: '生成任务编辑器' }).getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  const handoff = state.requests.find((item) => item.path === '/api/image-generate')!.body?.cinematic_handoff as Record<string, unknown>
  expect(handoff).toEqual(expect.objectContaining({
    skill_version: 2, provider_id: 'agnes', model_id: 'agnes-image-2.1-flash',
    workflow_mode: 'standalone_clip',
  }))
  expect(handoff.mentions).toEqual([expect.objectContaining({ must_not_transfer: ['background', 'camera'] })])

  const accessibility = await new AxeBuilder({ page }).include('.cinematic-skill').analyze()
  expect(accessibility.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
  await mkdir(DIRECTOR_V2_VISUAL_DIR, { recursive: true })
  await page.screenshot({ path: resolve(DIRECTOR_V2_VISUAL_DIR, 'reference-transfer-1440x900.png'), fullPage: true })
})

test('take review keeps canon atomic and reroll remains preflight-only until a later explicit Send', async ({ page }) => {
  const state = createResourceMockState()
  configureDirectorV2Result(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 历史图片生成结果', exact: true }).click()
  const review = page.getByRole('region', { name: 'Cinematic Director take review' })
  await expect(review).toBeVisible()
  await review.getByLabel('画面结束状态').fill('角色停在站台入口并抬头')
  await review.getByRole('button', { name: '确认选择' }).click()
  await expect(review.getByRole('status')).toContainText('canon revision 仅增加 1')
  await expect.poll(() => {
    const script = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!
    const sequence = (script.content as Record<string, unknown>).cinematic_sequence as Record<string, unknown>
    return sequence?.canon_revision
  }).toBe(1)

  configureDirectorV2Result(state)
  await page.reload()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 历史图片生成结果', exact: true }).click()
  const rerollReview = page.getByRole('region', { name: 'Cinematic Director take review' })
  await rerollReview.getByRole('radio', { name: '单变量重抽' }).check()
  await rerollReview.getByLabel('唯一 repair variable').fill('camera movement')
  const generationCountBefore = state.requests.filter((item) => item.path === '/api/image-generate').length
  await rerollReview.getByRole('button', { name: '仅创建新 preflight' }).click()
  await expect(rerollReview.getByRole('status')).toContainText('未创建 task')
  expect(state.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(generationCountBefore)
  const retakePreflight = state.requests.filter((item) => item.path.endsWith('/cinematic-preflight')).at(-1)!
  expect(retakePreflight.body).toEqual(expect.objectContaining({
    workflow_mode: 'retake', provider_id: 'agnes', model_id: 'agnes-image-2.1-flash',
    retake_context: expect.objectContaining({ repair_variable: 'camera movement', attempt_count: 1 }),
  }))

  await rerollReview.getByRole('button', { name: '定位原节点' }).click()
  const editor = page.getByRole('region', { name: '生成任务编辑器' })
  await expect(editor).toContainText('下一次显式 Send')
  await editor.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(generationCountBefore + 1)
  const handoff = state.requests.filter((item) => item.path === '/api/image-generate').at(-1)!.body?.cinematic_handoff as Record<string, unknown>
  expect(handoff).toEqual(expect.objectContaining({ skill_version: 2, workflow_mode: 'retake' }))
  expect(handoff.retake_context).toEqual(expect.objectContaining({ repair_variable: 'camera movement' }))
})

test('structured @ mention persists as one reversible Canvas command and preflights exact request', async ({ page }) => {
  const state = createResourceMockState()
  enableCinematicImage(state)
  await openResourceWorkspace(page, state)
  await selectCoverGeneration(page)

  const controls = page.getByRole('region', { name: 'Cinematic Skill 与结构化引用' })
  await expect(controls).toContainText('revid.cinema-image.v1')
  await expect(controls).toContainText('已选择')
  await expect(controls.getByLabel('Cinematic Skill model')).toHaveValue('agnes::agnes-image-2.1-flash')

  const mentionInput = controls.getByLabel('结构化 @ 引用指令')
  await mentionInput.press('@')
  const chooser = controls.getByRole('listbox', { name: '当前 Canvas 可引用节点' })
  await expect(chooser).toBeVisible()
  await mentionInput.press('Escape')
  await expect(chooser).toBeHidden()
  await mentionInput.press('@')
  await mentionInput.fill('@ 保持角色身份和服装')
  await expect(chooser).toBeVisible()
  await chooser.getByRole('option', { name: /历史图片生成结果/ }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const savedSkill = () => (state.documents[FIRST_CANVAS_ID].nodes
    .find((item) => item.id === 'generation-cover')!.content as Record<string, unknown>).cinematic_skill
  expect(savedSkill()).toEqual({
    contract_version: 1,
    enabled: true,
    skill_id: 'revid.cinema-image',
    skill_version: 1,
    provider_id: 'agnes',
    model_id: 'agnes-image-2.1-flash',
    mentions: [{
      node_id: 'result-existing', role: 'identity', instruction: '保持角色身份和服装', source_revision: 'a'.repeat(64),
    }],
  })
  expect(JSON.stringify(savedSkill())).not.toContain('历史图片生成结果')

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => documentPatches(state).length).toBe(2)
  expect(savedSkill()).toEqual({
    contract_version: 1, enabled: true, skill_id: 'revid.cinema-image', skill_version: 1,
    provider_id: 'agnes', model_id: 'agnes-image-2.1-flash', mentions: [],
  })
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => documentPatches(state).length).toBe(3)
  await expect(controls.getByRole('list', { name: '已绑定结构化引用' })).toContainText('历史图片生成结果')

  await controls.getByRole('button', { name: '预检优化请求' }).click()
  const summary = controls.getByRole('region', { name: 'Cinematic Skill 执行摘要' })
  await expect(summary).toContainText('预检通过')
  await expect(summary).toContainText('agnes-image-2.1-flash')
  await summary.getByText('查看 exact optimized request').click()
  await expect(summary.locator('pre')).toContainText('result-existing')
  expect(state.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(0)

  const editor = page.getByRole('region', { name: '生成任务编辑器' })
  await editor.getByRole('button', { name: '开始图片生成' }).click()
  await expect(editor.getByRole('status', { name: '生成状态' })).toContainText('已完成')
  const generationRequests = state.requests.filter((item) => item.path === '/api/image-generate')
  expect(generationRequests).toHaveLength(1)
  const generationBody = generationRequests[0].body!
  expect(generationBody.prompt).toContain('用户指令：电影感海边封面')
  expect(generationBody.image_ids).toEqual(['asset-generated'])
  expect(generationBody.cinematic_handoff).toEqual(expect.objectContaining({
    skill_id: 'revid.cinema-image', provider_id: 'agnes', model_id: 'agnes-image-2.1-flash',
    user_instruction: '电影感海边封面',
    mentions: [{
      node_id: 'result-existing', role: 'identity', instruction: '保持角色身份和服装', source_revision: 'a'.repeat(64),
    }],
  }))
  expect(JSON.stringify(generationBody)).not.toContain('automatic_retry')
  expect(JSON.stringify(generationBody)).not.toContain('automatic_model')
  expect(state.requests.filter((item) => item.path.endsWith('/cinematic-preflight'))).toHaveLength(2)

  const accessibility = await new AxeBuilder({ page }).include('.cinematic-skill').analyze()
  expect(accessibility.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')).toEqual([])
  await mkdir(VISUAL_DIR, { recursive: true })
  await page.screenshot({ path: resolve(VISUAL_DIR, 'cinematic-image-1440x900.png'), fullPage: true })
})

test('375px review keeps persisted cinematic bindings inspectable and removes actions', async ({ page }) => {
  const state = createResourceMockState()
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    cinematic_skill: {
      contract_version: 1, enabled: true, skill_id: 'revid.cinema-image', skill_version: 1,
      provider_id: 'agnes', model_id: 'agnes-image-2.1-flash',
      mentions: [{ node_id: 'result-existing', role: 'identity', instruction: '保持身份', source_revision: 'a'.repeat(64) }],
    },
  }
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectCoverGeneration(page)
  const controls = page.getByRole('region', { name: 'Cinematic Skill 与结构化引用' })
  await expect(controls).toContainText('已启用')
  await expect(controls).toContainText('历史图片生成结果')
  await expect(controls.getByLabel('结构化 @ 引用指令')).toHaveCount(0)
  await expect(controls.getByRole('button', { name: '预检优化请求' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  await expect.poll(async () => {
    const box = await page.locator('.n-drawer:visible').boundingBox()
    return Math.round((box?.x ?? 0) + (box?.width ?? 0))
  }).toBeLessThanOrEqual(375)
})

test('375px review-only keeps Director take decisions inspectable without mutation controls', async ({ page }) => {
  const state = createResourceMockState()
  configureDirectorV2Result(state)
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 历史图片生成结果', exact: true }).click()
  const review = page.getByRole('region', { name: 'Cinematic Director take review' })
  await expect(review).toBeVisible()
  await expect(review).toContainText('用户决定 · 不自动重试')
  await expect(review.getByRole('button', { name: /确认选择|仅创建新 preflight/ })).toHaveCount(0)
  await expect(review.getByRole('radio')).toHaveCount(5)
  await expect(review.getByRole('radio').first()).toBeDisabled()
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.requests.filter((item) => item.path.endsWith('/cinematic-preflight'))).toHaveLength(0)
  await mkdir(DIRECTOR_V2_VISUAL_DIR, { recursive: true })
  await page.screenshot({ path: resolve(DIRECTOR_V2_VISUAL_DIR, 'take-review-375x812.png'), fullPage: true })
})

for (const viewport of [{ width: 1366, height: 768 }, { width: 920, height: 900 }]) {
  test(`${viewport.width}px keeps cinematic ownership inside the context surface`, async ({ page }) => {
    const state = createResourceMockState()
    enableCinematicImage(state)
    await openResourceWorkspace(page, state, viewport)
    await selectCoverGeneration(page)
    const controls = page.getByRole('region', { name: 'Cinematic Skill 与结构化引用' })
    await expect(controls).toBeVisible()
    await expect(controls).toContainText('Provider / model（用户选择）')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy()
  })
}

test('user-billed reminder cancel blocks execution and explicit 24-hour acknowledgement unlocks one action', async ({ page }) => {
  const state = createResourceMockState()
  enableCinematicImage(state)
  state.cinematicRequiresAcknowledgement = true
  await openResourceWorkspace(page, state)
  await selectCoverGeneration(page)
  const controls = page.getByRole('region', { name: 'Cinematic Skill 与结构化引用' })
  await controls.getByRole('button', { name: '预检优化请求' }).click()
  const reminder = controls.getByRole('dialog', { name: '用户计费 provider 提醒' })
  await expect(reminder).toContainText('将消耗你的 provider quota 或余额')
  await expect(reminder.getByLabel('计费提醒抑制时长')).toHaveValue('24')
  await reminder.getByRole('button', { name: '取消' }).click()
  await expect(controls.getByRole('alert')).toContainText('未创建任务或消耗 quota')
  expect(state.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(0)

  await controls.getByRole('button', { name: '预检优化请求' }).click()
  await controls.getByRole('dialog', { name: '用户计费 provider 提醒' })
    .getByRole('button', { name: '确认并允许执行' }).click()
  await expect(controls).toContainText('server acknowledgement 有效期内')
  await page.getByRole('region', { name: '生成任务编辑器' })
    .getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.filter((item) => item.path === '/api/provider-cost-acknowledgements/agnes' && item.method === 'POST')).toHaveLength(1)
})

test('video Skill preserves explicit first/last roles and keyframes in one provider action', async ({ page }) => {
  const state = createResourceMockState()
  addCinematicVideoNode(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 连续性视频生成', exact: true }).click()
  const controls = page.getByRole('region', { name: 'Cinematic Skill 与结构化引用' })
  await expect(controls.getByRole('list', { name: '已绑定结构化引用' })).toContainText('first-frame')
  await expect(controls.getByRole('list', { name: '已绑定结构化引用' })).toContainText('last-frame')
  await page.getByRole('region', { name: '生成任务编辑器' })
    .getByRole('button', { name: '开始视频生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)
  const body = state.requests.find((item) => item.path === '/api/video-generate')!.body!
  expect(body).toEqual(expect.objectContaining({
    reference_mode: 'keyframes', duration_seconds: 5,
    image_ids: ['asset-generated', 'asset-reference'],
  }))
  expect(body.cinematic_handoff).toEqual(expect.objectContaining({
    skill_id: 'revid.cinema-video', model_id: 'agnes-video-v2.0',
    mentions: [
      expect.objectContaining({ node_id: 'result-existing', role: 'first-frame' }),
      expect.objectContaining({ node_id: 'asset-reference-node', role: 'last-frame' }),
    ],
  }))
  expect(state.requests.filter((item) => item.path === '/api/image-generate')).toHaveLength(0)
})
