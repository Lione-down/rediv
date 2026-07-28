import { expect, test, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { reactive } from 'vue'
import {
  createVisualState,
  installMockApi,
  type MockState,
} from './authenticated-workflow-fixture'
import { mapCanvasNode } from '../../src/modules/canvas/mappers'
import {
  createAppendStoryShotCommand,
  createDeleteStoryShotCommand,
  createSetStoryPromptsConfirmedCommand,
  createSetStoryShotsConfirmedCommand,
  createUpdateStoryAssetCommand,
  createUpdateStoryShotCommand,
} from '../../src/modules/canvas/script-authoring'
import { createStoryShotGenerationCommand } from '../../src/modules/canvas/story-shot-generation'
import { GENERATION_CAPABILITIES_V6 } from './canvas-generation-parameters-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'
const T6_013_EVIDENCE_DIRECTORY = resolve(
  process.env.REVID_T6_013_EVIDENCE_DIRECTORY
    ?? resolve(
      process.cwd(),
      '..',
      'output',
      'playwright',
      't6-013-sixth-candidate',
    ),
)
const T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY = resolve(
  process.env.REVID_T6_013_HUMAN_EVIDENCE_DIRECTORY
    ?? resolve(
      process.cwd(),
      '..',
      'output',
      'playwright',
      't6-013-tenth-candidate',
      'libtv-script-video-20260727',
    ),
)

function storyProduction(sourceNodeId: string) {
  const record = {
    editable_fields: {},
    locked_fields: {},
    generation_revision: 1,
    source_ids: ['event-1'],
    validation_state: 'valid',
  }
  return {
    schema_id: 'revid.story-production',
    schema_version: 1,
    skill_id: 'revid.story-director',
    skill_version: 1,
    source_node_id: sourceNodeId,
    source_revision: 'b'.repeat(64),
    model_id: 'agnes-2.0-flash',
    story: {
      summary: '女孩在雨后城市找回机器狗。',
      events: [{ event_id: 'event-1', summary: '女孩发现机器狗留下的信号。' }],
    },
    references: [],
    continuity: {
      canonical_revision: 1,
      identity_locks: ['role-girl'],
      accepted_take_id: null,
      accepted_result_node_id: null,
      accepted_result_revision: null,
      observed_end_state: null,
    },
    assets: {
      roles: [{
        asset_id: 'role-girl',
        name: '女孩',
        description: '穿黄色雨衣的女孩',
        image_prompt: '黄色雨衣女孩，雨后城市',
        ...record,
      }],
      scenes: [{
        asset_id: 'scene-city',
        name: '雨后城市',
        description: '积水反射霓虹的街道',
        image_prompt: '雨后城市街道，霓虹倒影',
        ...record,
      }],
      props: [],
    },
    shots: [{
      shot_id: 'shot-1',
      shot_number: 1,
      duration_seconds: 5,
      visual_description: '女孩沿着闪烁信号跑过积水街道。',
      framing: '中景',
      scene_id: 'scene-city',
      role_ids: ['role-girl'],
      prop_ids: [],
      dialogue: '你在哪里？',
      music_sfx: '雨滴与微弱电子声',
      camera_movement: '跟拍',
      image_prompt: '女孩跑过雨后霓虹街道，中景',
      video_prompt: '中景跟拍女孩跑过积水街道，保持黄色雨衣。',
      reference_ids: [],
      continuity_locks: ['role-girl'],
      reserved_beat_ids: [],
      ...record,
      editable_fields: {
        lighting_atmosphere: '冷蓝霓虹反射在雨幕与积水中',
      },
    }],
  }
}

function addScriptFlow(state: MockState) {
  state.canvasNodes.push(
    {
      ...state.canvasNodes[0],
      id: 'node-prompt-story',
      node_type: 'script',
      content: {
        title: '提示词',
        subtype: 'prompt',
        serialization_version: 1,
        text: '一个女孩在暴雨后的城市寻找走失的机器狗。',
      },
      position_x: 80,
      position_y: 300,
      width: 320,
      height: 180,
    },
    {
      ...state.canvasNodes[0],
      id: 'node-script-story',
      node_type: 'script',
      content: {
        title: '脚本',
        subtype: 'script',
        serialization_version: 1,
        text: '',
      },
      position_x: 560,
      position_y: 300,
      width: 360,
      height: 200,
    },
  )
  state.canvasConnections.push({
    id: 'connection-prompt-script',
    project_id: 'project-e2e',
    canvas_id: 'canvas-first',
    source_node_id: 'node-prompt-story',
    source_port: 'out',
    target_node_id: 'node-script-story',
    target_port: 'in',
    status: 'active',
    metadata: {},
    created_at: '2026-07-25T14:00:00Z',
    updated_at: '2026-07-25T14:00:00Z',
  })
}

test('append-story-shot command preserves persisted lineage and adds one review shot', () => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: storyProduction('node-script-story'),
    source_model: 'agnes-2.0-flash',
    source_task_id: 'task-existing-story',
    source_node_id: 'node-script-story',
    source_canvas_revision: 0,
    generation_intent: 'script_draft',
    generation_locale: 'zh-CN',
    script_authoring_contract_version: 1,
  }

  const command = createAppendStoryShotCommand({
    source: reactive(mapCanvasNode(script)),
    shotId: 'shot-new',
  })

  expect(command).not.toBeNull()
  expect(command?.storyProduction?.shots).toHaveLength(2)
  expect(command?.storyProduction?.shots).toEqual(expect.arrayContaining([
    expect.objectContaining({
      shot_id: 'shot-new',
      shot_number: 2,
      validation_state: 'needs_review',
    }),
  ]))
})

test('story-production edit commands preserve stable identities and localized metadata', () => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: storyProduction('node-script-story'),
    source_model: 'agnes-2.0-flash',
    source_task_id: 'task-existing-story',
    source_node_id: 'node-script-story',
    source_canvas_revision: 0,
    generation_intent: 'script_draft',
    generation_locale: 'zh-CN',
    script_authoring_contract_version: 1,
  }
  const source = reactive(mapCanvasNode(script))

  const shotCommand = createUpdateStoryShotCommand({
    source,
    shotId: 'shot-1',
    field: 'video_prompt_zh',
    value: '中景跟拍女孩跑过积水街道，保持黄色雨衣。',
  })
  const assetCommand = createUpdateStoryAssetCommand({
    source,
    assetId: 'role-girl',
    field: 'description',
    value: '穿黄色雨衣、短发的女孩',
  })

  expect(shotCommand?.storyProduction?.shots).toEqual([
    expect.objectContaining({
      shot_id: 'shot-1',
      generation_revision: 2,
      validation_state: 'needs_review',
      editable_fields: expect.objectContaining({
        video_prompt_zh: '中景跟拍女孩跑过积水街道，保持黄色雨衣。',
      }),
    }),
  ])
  expect(assetCommand?.storyProduction?.assets).toMatchObject({
    roles: [{
      asset_id: 'role-girl',
      description: '穿黄色雨衣、短发的女孩',
      generation_revision: 2,
      validation_state: 'needs_review',
    }],
  })
})

test('story shot deletion renumbers remaining shots while confirmation is reversible', () => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  const production = storyProduction('node-script-story')
  production.shots.push({
    ...structuredClone(production.shots[0]),
    shot_id: 'shot-2',
    shot_number: 2,
  })
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: production,
    source_model: 'agnes-2.0-flash',
    source_task_id: 'task-existing-story',
    source_node_id: 'node-script-story',
    source_canvas_revision: 0,
    generation_intent: 'script_draft',
    generation_locale: 'zh-CN',
    script_authoring_contract_version: 1,
  }
  const source = reactive(mapCanvasNode(script))

  const deleted = createDeleteStoryShotCommand({ source, shotId: 'shot-1' })
  expect(deleted?.storyProduction?.shots).toEqual([
    expect.objectContaining({ shot_id: 'shot-2', shot_number: 1 }),
  ])
  expect(createDeleteStoryShotCommand({
    source: {
      ...source,
      contentData: {
        ...source.contentData,
        story_production: deleted?.storyProduction,
      },
    },
    shotId: 'shot-2',
  })).toBeNull()

  const confirmed = createSetStoryShotsConfirmedCommand({ source, confirmed: true })
  expect(confirmed?.storyProduction?.shots).toEqual([
    expect.objectContaining({
      editable_fields: expect.objectContaining({ user_confirmation: 'confirmed' }),
      locked_fields: expect.objectContaining({ user_confirmation: true }),
    }),
    expect.objectContaining({
      editable_fields: expect.objectContaining({ user_confirmation: 'confirmed' }),
      locked_fields: expect.objectContaining({ user_confirmation: true }),
    }),
  ])
  const reopenedSource = {
    ...source,
    contentData: {
      ...source.contentData,
      story_production: confirmed?.storyProduction,
    },
  }
  const reopened = createSetStoryShotsConfirmedCommand({ source: reopenedSource, confirmed: false })
  expect(reopened?.storyProduction?.shots).toEqual([
    expect.objectContaining({
      editable_fields: expect.not.objectContaining({ user_confirmation: expect.anything() }),
      locked_fields: expect.not.objectContaining({ user_confirmation: expect.anything() }),
    }),
    expect.objectContaining({
      editable_fields: expect.not.objectContaining({ user_confirmation: expect.anything() }),
      locked_fields: expect.not.objectContaining({ user_confirmation: expect.anything() }),
    }),
  ])
})

test('prompt confirmation marks only selected stable shots and can be reopened', () => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  const production = storyProduction('node-script-story')
  production.shots.push({
    ...structuredClone(production.shots[0]),
    shot_id: 'shot-2',
    shot_number: 2,
  })
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: production,
    source_model: 'agnes-2.0-flash',
    source_task_id: 'task-existing-story',
    source_node_id: 'node-script-story',
    source_canvas_revision: 0,
    generation_intent: 'script_draft',
    generation_locale: 'zh-CN',
    script_authoring_contract_version: 1,
  }
  const source = reactive(mapCanvasNode(script))

  const confirmed = createSetStoryPromptsConfirmedCommand({
    source,
    shotIds: ['shot-1'],
    confirmed: true,
  })
  expect(confirmed?.storyProduction?.shots).toEqual([
    expect.objectContaining({
      editable_fields: expect.objectContaining({ prompt_confirmation: 'confirmed' }),
      locked_fields: expect.objectContaining({ prompt_confirmation: true }),
    }),
    expect.objectContaining({
      editable_fields: expect.not.objectContaining({ prompt_confirmation: expect.anything() }),
      locked_fields: expect.not.objectContaining({ prompt_confirmation: expect.anything() }),
    }),
  ])
})

test('shot batch graph uses exactly one materialized frame for official image-to-video', () => {
  const state = createVisualState()
  addScriptFlow(state)
  const scriptDto = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  const production = storyProduction('node-script-story')
  production.shots[0].locked_fields = {
    prompt_confirmation: true,
    user_confirmation: true,
  }
  scriptDto.content = {
    ...(scriptDto.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: production,
  }
  const source = reactive(mapCanvasNode(scriptDto))
  const imageNode = {
    id: 'image-shot-1',
    type: 'generation',
    title: '镜头 01 · 图片生成',
    x: 980,
    y: 300,
    width: 340,
    height: 220,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      source_script_node_id: source.id,
      shot_id: 'shot-1',
      result_materialized_task_id: 'task-frame-1',
    },
  } as const
  const resultNode = {
    id: 'result-shot-1',
    type: 'result',
    title: '镜头 01 · 图片结果',
    x: 1360,
    y: 300,
    width: 360,
    height: 280,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: 'asset-frame-1',
      source_task_id: 'task-frame-1',
      url: 'https://example.invalid/frame-1.webp',
    },
  } as const
  const nodes = [source, imageNode, resultNode]
  const existingConnection = {
    id: 'image-result-1',
    from: imageNode.id,
    to: resultNode.id,
    sourcePort: 'out',
    targetPort: 'in',
  }
  let id = 0
  const command = createStoryShotGenerationCommand({
    sourceNode: source,
    existingNodes: nodes,
    connections: [existingConnection],
    shotIds: ['shot-1'],
    options: {
      mediaType: 'video',
      aspectRatio: '16:9',
      durationSeconds: 5,
      videoResolution: '1080p',
      videoMode: 'image-to-video',
    },
    createId: () => `created-${++id}`,
  })

  expect(command?.nodes).toHaveLength(1)
  expect(command?.nodes[0]).toMatchObject({
    type: 'generation',
    contentData: {
      subtype: 'video',
      source_script_node_id: source.id,
      shot_id: 'shot-1',
      generation_parameters: {
        schema_version: 1,
        video: {
          aspect_ratio: '16:9',
          duration_seconds: 5,
          resolution: '1080p',
          reference_mode: 'image-to-video',
          primary_reference_node_id: resultNode.id,
        },
      },
    },
  })
  expect(command?.connections).toEqual([expect.objectContaining({
    from: resultNode.id,
    to: command.nodes[0].id,
    sourcePort: 'out',
    targetPort: 'media',
  })])

  expect(createStoryShotGenerationCommand({
    sourceNode: source,
    existingNodes: [source],
    connections: [],
    shotIds: ['shot-1'],
    options: {
      mediaType: 'video',
      aspectRatio: '16:9',
      durationSeconds: 5,
      videoResolution: '1080p',
      videoMode: 'image-to-video',
    },
  })).toBeNull()
})

async function installStoryDirectorRoute(page: Page, state: MockState) {
  let submittedBody: Record<string, unknown> | null = null
  await page.route('http://localhost:8000/api/text-generate', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: {
        'access-control-allow-headers': 'Authorization, Content-Type',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-origin': 'http://127.0.0.1:9099',
      } })
      return
    }
    submittedBody = route.request().postDataJSON() as Record<string, unknown>
    const production = storyProduction('node-script-story')
    await route.fulfill({
      status: 200,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:9099',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content: production.story.summary,
        story_production: production,
        asset: {
          id: 'asset-story-production',
          user_id: 'user-e2e',
          project_id: 'project-e2e',
          origin_canvas_id: 'canvas-first',
          canvas_node_id: 'node-script-story',
          type: 'prompt',
          url: null,
          content_text: JSON.stringify(production),
          source: 'generation',
          source_model: 'agnes-2.0-flash',
          source_task_id: 'task-story-production',
          status: 'active',
          created_at: '2026-07-25T14:00:00Z',
          updated_at: '2026-07-25T14:00:00Z',
        },
        generation_task: {
          id: 'task-story-production',
          user_id: 'user-e2e',
          project_id: 'project-e2e',
          origin_canvas_id: 'canvas-first',
          canvas_node_id: 'node-script-story',
          media_type: 'text',
          provider: 'mock',
          model: 'agnes-2.0-flash',
          provider_request_id: 'request-story-production',
          client_request_id: submittedBody.client_request_id,
          request_fingerprint: 'a'.repeat(64),
          status: 'succeeded',
          duration_ms: 10,
          result_asset_id: 'asset-story-production',
          error_code: null,
          error_message: null,
          request_parameters: {
            script_authoring: {
              contract_version: 1,
              intent: submittedBody.intent,
              locale: submittedBody.locale,
              source_node_id: 'node-script-story',
              canvas_revision: submittedBody.canvas_revision,
            },
            story_director: submittedBody.story_director,
          },
          created_at: '2026-07-25T14:00:00Z',
          updated_at: '2026-07-25T14:00:00Z',
        },
        quotas: { text: 9, image: 5, video: 3 },
        quota_revision: 2,
        script_authoring: {
          contract_version: 1,
          intent: submittedBody.intent,
          locale: submittedBody.locale,
          source_node_id: 'node-script-story',
          source_task_id: 'task-story-production',
          source_model: 'agnes-2.0-flash',
          canvas_revision: submittedBody.canvas_revision,
        },
      }),
    })
  })
  return () => submittedBody
}

async function openRuntime(
  page: Page,
  state: MockState,
  capabilityOverride?: Record<string, unknown>,
) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  const submittedBody = await installStoryDirectorRoute(page, state)
  if (capabilityOverride) {
    await page.route('http://localhost:8000/api/generation-capabilities', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': 'http://127.0.0.1:9099',
          'content-type': 'application/json',
        },
        body: JSON.stringify(capabilityOverride),
      })
    })
  }
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)
  return {
    runtime: page.locator('[data-canvas-runtime="replacement"]'),
    submittedBody,
  }
}

test('stale backend capability blocks Story Director before an invalid request is sent', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const staleCapability = structuredClone(
    GENERATION_CAPABILITIES_V6,
  ) as unknown as Record<string, unknown>
  delete (staleCapability.text as Record<string, unknown>).story_director
  const { runtime, submittedBody } = await openRuntime(page, state, staleCapability)
  const scriptCard = runtime.locator('[data-runtime-node="node-script-story"]')
  await scriptCard.locator('[data-node-body]').click()
  const composer = runtime.locator('[data-node-composer][data-composer-kind="script"]')
  await composer.getByRole('textbox', { name: '分镜生成要求' }).fill('生成完整分镜。')

  await expect(composer.getByRole('alert')).toContainText('当前 backend runtime 未声明分镜请求 contract')
  await expect(composer.getByRole('button', { name: '生成分镜' })).toBeDisabled()
  expect(submittedBody()).toBeNull()
  await mkdir(T6_013_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_EVIDENCE_DIRECTORY, 'script-stale-runtime-blocked-1440x900.png'),
    fullPage: true,
  })
})

test('connected Prompt/Text is authoritative input and returns storyboard to the same Script card', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const { runtime, submittedBody } = await openRuntime(page, state)
  const scriptCard = runtime.locator('[data-runtime-node="node-script-story"]')
  await scriptCard.locator('[data-node-body]').click()
  const composer = runtime.locator('[data-node-composer][data-composer-kind="script"]')
  await composer.getByRole('textbox', { name: '分镜生成要求' }).fill('生成完整分镜，保持人物关系和结局。')
  await expect(composer.getByRole('spinbutton', { name: '镜头数量' })).toHaveValue('10')
  await composer.locator('.script-authoring__submit').click()

  await expect.poll(() => submittedBody()).toMatchObject({
    story_director: {
      contract_version: 1,
      requested_shot_count: 10,
      source_node_ids: ['node-prompt-story'],
    },
  })
  const submitted = submittedBody()!
  await mkdir(T6_013_EVIDENCE_DIRECTORY, { recursive: true })
  await writeFile(
    resolve(T6_013_EVIDENCE_DIRECTORY, 'script-request-schema.json'),
    JSON.stringify({
      fields: Object.keys(submitted).sort(),
      story_director: submitted.story_director,
      intent: submitted.intent,
      locale: submitted.locale,
    }, null, 2),
    'utf8',
  )
  await expect.poll(() => (
    state.canvasNodes.find((node) => node.id === 'node-script-story')
      ?.content as Record<string, unknown>
  )?.story_production).toMatchObject({
    schema_id: 'revid.story-production',
    shots: [{ shot_id: 'shot-1' }],
  })
  await expect(scriptCard).toContainText('女孩在雨后城市找回机器狗。')
  await page.screenshot({
    path: resolve(T6_013_EVIDENCE_DIRECTORY, 'script-same-card-success-1440x900.png'),
    fullPage: true,
  })
})

test('selected Script toolbar exposes working configuration and workspace actions without media crop', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const { runtime } = await openRuntime(page, state)
  await runtime.locator('[data-runtime-node="node-script-story"] [data-node-body]').click()
  const toolbar = runtime.locator('[data-node-toolbar]')

  await expect(toolbar.locator('[data-script-tool="crop"]')).toHaveCount(0)
  await toolbar.locator('[data-script-tool="settings"]').click()
  await expect(runtime.locator('[data-script-settings-popover]')).toBeVisible()
  await toolbar.locator('[data-script-tool="workspace"]').click()
  await expect(runtime.locator('[data-script-workspace]')).toBeVisible()
})

test('Script workspace column settings and JSON export perform visible non-mutating actions', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: storyProduction('node-script-story'),
  }
  const { runtime } = await openRuntime(page, state)
  await page.setViewportSize({ width: 1920, height: 1000 })
  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const workspace = runtime.locator('[data-script-workspace]')

  for (const columnName of [
    '镜号',
    '时长',
    '画面描述',
    '景别',
    '中文景别',
    '光影氛围',
    '对白/旁白',
    '音效',
    '运镜',
    '操作',
  ]) {
    await expect(workspace.getByRole('columnheader', { name: columnName, exact: true })).toBeVisible()
  }
  await expect(workspace.getByRole('textbox', { name: '镜头 1 光影氛围' }))
    .toHaveValue('冷蓝霓虹反射在雨幕与积水中')
  const actionColumnBox = await workspace
    .getByRole('columnheader', { name: '操作', exact: true })
    .boundingBox()
  expect(actionColumnBox).not.toBeNull()
  expect(actionColumnBox!.x + actionColumnBox!.width).toBeLessThanOrEqual(1900)
  await page.screenshot({
    path: resolve(
      process.env.REVID_T6_013_HUMAN_EVIDENCE_DIRECTORY
        ?? resolve(process.cwd(), '..', 'output', 'playwright'),
      'script-ten-columns-1920x1000.png',
    ),
    fullPage: true,
  })
  await workspace.getByRole('button', { name: /^3 合成提示词/ }).click()
  await expect(workspace.getByRole('columnheader', { name: '最终提示词（原文）' })).toBeVisible()
  await expect(workspace.getByRole('textbox', { name: '镜头 1 最终提示词（原文）' }))
    .toHaveValue('中景跟拍女孩跑过积水街道，保持黄色雨衣。')

  await workspace.getByRole('button', { name: /^1 确认镜头/ }).click()
  await workspace.locator('[data-script-column-settings]').click()
  await workspace.getByRole('checkbox', { name: '对白' }).uncheck()
  await expect(workspace.locator('[data-story-column="dialogue"]')).toHaveCount(0)
  const downloadPromise = page.waitForEvent('download')
  await workspace.locator('[data-script-export]').click()
  await workspace.getByRole('menuitem', { name: '导出 JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/脚本.*\.json$/)
  expect(state.authenticatedRequests.filter((request) => request.startsWith('PATCH '))).toEqual([])
})

test('Script workspace autonomously creates storyboard from its own text without an upstream connection', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  state.canvasConnections = []
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩循着机器狗留下的信号穿过雨后城市，最终在旧车站重逢。',
  }
  const { runtime, submittedBody } = await openRuntime(page, state)
  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const workspace = runtime.locator('[data-script-workspace]')

  await workspace.getByRole('button', { name: '自主创建分镜' }).click()

  await expect.poll(() => submittedBody()).toMatchObject({
    canvas_node_id: 'node-script-story',
    story_director: {
      contract_version: 1,
      requested_shot_count: 10,
      source_node_ids: [],
    },
  })
  await workspace.getByRole('button', { name: /^3 合成提示词/ }).click()
  await expect(workspace.getByRole('columnheader', { name: '最终提示词（原文）' })).toBeVisible()
  await expect(workspace.locator('tbody tr')).toHaveCount(1)
})

test('Script workspace replaces raw HTTP 422 text with an actionable source message', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
  }
  const { runtime } = await openRuntime(page, state)
  await page.route('http://localhost:8000/api/text-generate', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-headers': 'Authorization, Content-Type',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-origin': 'http://127.0.0.1:9099',
        },
      })
      return
    }
    await route.fulfill({
      status: 422,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:9099',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        detail: {
          code: 'story_source_required',
          message: 'Connect usable Prompt/Text content before generating storyboard',
        },
      }),
    })
  })
  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const workspace = runtime.locator('[data-script-workspace]')

  await workspace.getByRole('button', { name: '自主创建分镜' }).click()

  const alert = workspace.getByRole('alert')
  await expect(alert).toContainText('填写当前脚本')
  await expect(alert).not.toContainText('Request failed with status code 422')
})

test('Script workspace can append one stable shot and request storyboard completion', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: storyProduction('node-script-story'),
    source_model: 'agnes-2.0-flash',
    source_task_id: 'task-existing-story',
    source_node_id: 'node-script-story',
    source_canvas_revision: 0,
    generation_intent: 'script_draft',
    generation_locale: 'zh-CN',
    script_authoring_contract_version: 1,
  }
  const { runtime, submittedBody } = await openRuntime(page, state)
  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const workspace = runtime.locator('[data-script-workspace]')

  await workspace.getByRole('button', { name: '添加镜头' }).click()
  await expect(workspace.locator('tbody tr')).toHaveCount(2)
  await workspace.getByRole('button', { name: '自主创建分镜' }).click()
  await expect.poll(() => submittedBody()).toMatchObject({
    story_director: {
      contract_version: 1,
      requested_shot_count: 10,
      source_node_ids: ['node-prompt-story'],
    },
  })
})

test('Script workspace exposes three-stage assets edit delete confirm localized workflow', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  const production = storyProduction('node-script-story')
  production.shots[0].framing = 'Medium close-up'
  production.shots[0].editable_fields = {
    ...production.shots[0].editable_fields,
    video_prompt_zh: '中景跟拍女孩穿过雨后街道。',
  }
  production.shots.push({
    ...structuredClone(production.shots[0]),
    shot_id: 'shot-2',
    shot_number: 2,
    visual_description: '机器狗在霓虹巷口回头。',
  })
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: production,
    source_model: 'agnes-2.0-flash',
    source_task_id: 'task-existing-story',
    source_node_id: 'node-script-story',
    source_canvas_revision: 0,
    generation_intent: 'script_draft',
    generation_locale: 'zh-CN',
    script_authoring_contract_version: 1,
  }
  await page.setViewportSize({ width: 1600, height: 1000 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })

  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const workspace = runtime.locator('[data-script-workspace]')

  const confirmStage = workspace.getByRole('button', { name: /^1 确认镜头/ })
  const assetStage = workspace.getByRole('button', { name: /^2 准备资产/ })
  const promptStage = workspace.getByRole('button', { name: /^3 合成提示词/ })
  await expect(confirmStage).toHaveAttribute('aria-current', 'step')
  await expect(assetStage).toBeEnabled()
  await expect(promptStage).toBeEnabled()
  await mkdir(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, { recursive: true })
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'script-stage-1-confirm-shots.png'),
    fullPage: true,
  })

  await expect(workspace.getByRole('textbox', { name: '镜头 1 中文景别' })).toHaveValue('中近景')
  const visualDescription = workspace.getByRole('textbox', { name: '镜头 1 画面描述' })
  await visualDescription.fill('女孩停在雨幕中，看见机器狗留下的信号。')
  await visualDescription.blur()
  await expect.poll(() => (
    (state.canvasNodes.find((node) => node.id === 'node-script-story')?.content as Record<string, any>)
      ?.story_production?.shots?.[0]?.visual_description
  )).toBe('女孩停在雨幕中，看见机器狗留下的信号。')

  await workspace.getByRole('button', { name: '删除镜头 2' }).click()
  await expect(workspace.locator('tbody tr')).toHaveCount(1)
  await expect.poll(() => (
    (state.canvasNodes.find((node) => node.id === 'node-script-story')?.content as Record<string, any>)
      ?.story_production?.shots?.map((shot: Record<string, unknown>) => [shot.shot_id, shot.shot_number])
  )).toEqual([['shot-1', 1]])

  await workspace.getByRole('button', { name: '确认镜头并进入准备资产' }).click()
  await expect(assetStage).toHaveAttribute('aria-current', 'step')

  const assets = workspace.getByRole('region', { name: '故事资产' })
  await expect(assets).toContainText('角色')
  await expect(assets).toContainText('场景')
  await expect(assets).toContainText('道具')
  await assets.getByRole('button', { name: '编辑角色 女孩' }).click()
  const assetDrawer = workspace.getByRole('dialog', { name: '编辑角色' })
  const roleDescription = assetDrawer.getByRole('textbox', { name: '角色 女孩 描述' })
  await roleDescription.fill('穿黄色雨衣、短发的女孩')
  await roleDescription.blur()
  await expect.poll(() => (
    (state.canvasNodes.find((node) => node.id === 'node-script-story')?.content as Record<string, any>)
      ?.story_production?.assets?.roles?.[0]?.description
  )).toBe('穿黄色雨衣、短发的女孩')
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'script-stage-2-asset-drawer.png'),
    fullPage: true,
  })
  await assetDrawer.getByRole('button', { name: '关闭资产编辑' }).click()

  await promptStage.click()
  await expect(promptStage).toHaveAttribute('aria-current', 'step')
  const localizedPrompt = workspace.getByRole('textbox', { name: '镜头 1 最终提示词（中文）' })
  await expect(localizedPrompt).toHaveValue('中景跟拍女孩穿过雨后街道。')
  await localizedPrompt.fill('中近景跟拍女孩穿过雨后街道，保持黄色雨衣。')
  await localizedPrompt.blur()
  await expect.poll(() => (
    (state.canvasNodes.find((node) => node.id === 'node-script-story')?.content as Record<string, any>)
      ?.story_production?.shots?.[0]?.editable_fields?.video_prompt_zh
  )).toBe('中近景跟拍女孩穿过雨后街道，保持黄色雨衣。')

  await workspace.getByRole('button', { name: '确认全部提示词' }).click()
  const promptDialog = workspace.getByRole('dialog', { name: '确认提示词' })
  await expect(promptDialog.getByRole('checkbox', { name: '选择镜头 1' })).toBeChecked()
  await page.screenshot({
    path: resolve(T6_013_LIBTV_EXPANSION_EVIDENCE_DIRECTORY, 'script-stage-3-prompt-confirmation.png'),
    fullPage: true,
  })
  await promptDialog.getByRole('button', { name: '确认所选提示词' }).click()
  await expect(promptDialog).toBeHidden()
  await expect(workspace.getByText('1/1 个提示词已确认')).toBeVisible()

  await confirmStage.click()
  await expect(workspace.getByRole('button', { name: '继续编辑镜头' })).toBeVisible()
  await expect(workspace.getByRole('textbox', { name: '镜头 1 画面描述' })).toBeDisabled()
  await workspace.getByRole('button', { name: '继续编辑镜头' }).click()
  await expect(workspace.getByRole('textbox', { name: '镜头 1 画面描述' })).toBeEnabled()
})

test('Script workspace keeps lower shots and footer reachable by mouse wheel at 1366x768', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  const production = storyProduction('node-script-story')
  production.shots.push(...Array.from({ length: 6 }, (_, offset) => ({
    ...structuredClone(production.shots[0]),
    shot_id: `shot-${offset + 2}`,
    shot_number: offset + 2,
    visual_description: `第 ${offset + 2} 个可编辑镜头。`,
  })))
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: production,
  }
  const { runtime } = await openRuntime(page, state)
  await page.setViewportSize({ width: 1366, height: 768 })
  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const workspace = runtime.locator('[data-script-workspace]')
  const lowerShot = workspace.getByRole('textbox', { name: '镜头 7 画面描述' })
  const footerAction = workspace.getByRole('button', { name: '确认镜头并进入准备资产' })

  await expect(lowerShot).not.toBeInViewport()
  await workspace.locator('.runtime-script-workspace__table-scroll').hover()
  await page.mouse.wheel(0, 900)

  await expect(lowerShot).toBeInViewport()
  await expect(footerAction).toBeInViewport()
})

test('confirmed Script shots create provider-free Image and text-to-Video node batches with undo', async ({
  page,
}) => {
  const state = createVisualState()
  addScriptFlow(state)
  const script = state.canvasNodes.find((node) => node.id === 'node-script-story')!
  const production = storyProduction('node-script-story')
  production.shots.push({
    ...structuredClone(production.shots[0]),
    shot_id: 'shot-2',
    shot_number: 2,
    visual_description: '机器狗在霓虹巷口回头。',
  })
  for (const shot of production.shots) {
    shot.locked_fields = {
      ...shot.locked_fields,
      prompt_confirmation: true,
      user_confirmation: true,
    }
  }
  script.content = {
    ...(script.content as Record<string, unknown>),
    text: '女孩在雨后城市寻找机器狗。',
    story_production: production,
  }
  const { runtime } = await openRuntime(page, state)
  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const workspace = runtime.locator('[data-script-workspace]')

  await workspace.getByRole('button', { name: '批量创建图片生成节点' }).click()
  const imageDialog = workspace.getByRole('dialog', { name: '批量创建图片生成节点' })
  await expect(imageDialog.getByRole('checkbox', { name: '选择镜头 1' })).toBeChecked()
  await expect(imageDialog.getByRole('checkbox', { name: '选择镜头 2' })).toBeChecked()
  await imageDialog.getByRole('combobox', { name: '图片比例' }).selectOption('16:9')
  await imageDialog.getByRole('combobox', { name: '图片规格' }).selectOption('2K')
  await imageDialog.getByRole('button', { name: '创建 2 个图片生成节点' }).click()

  await expect.poll(() => state.canvasNodes.filter((node) => (
    node.node_type === 'generation' &&
    (node.content as Record<string, unknown>)?.source_script_node_id === 'node-script-story' &&
    (node.content as Record<string, unknown>)?.subtype === 'image'
  )).length).toBe(2)
  expect(state.generationAttempts).toBe(0)

  await workspace.getByRole('button', { name: '返回画布' }).click()
  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect.poll(() => state.canvasNodes.filter((node) => (
    (node.content as Record<string, unknown>)?.source_script_node_id === 'node-script-story'
  )).length).toBe(0)

  await runtime.locator('[data-runtime-node="node-script-story"]')
    .getByRole('button', { name: /打开.*脚本|打开工作流/ }).click()
  const reopened = runtime.locator('[data-script-workspace]')
  await reopened.getByRole('button', { name: '批量创建视频生成节点' }).click()
  const videoDialog = reopened.getByRole('dialog', { name: '批量创建视频生成节点' })
  await videoDialog.getByRole('radio', { name: '文生视频' }).check()
  await videoDialog.getByRole('combobox', { name: '视频比例' }).selectOption('16:9')
  await videoDialog.getByRole('combobox', { name: '视频清晰度' }).selectOption('1080p')
  await videoDialog.getByRole('combobox', { name: '视频时长' }).selectOption('5')
  await videoDialog.getByRole('button', { name: '创建 2 个视频生成节点' }).click()

  await expect.poll(() => state.canvasNodes.filter((node) => (
    node.node_type === 'generation' &&
    (node.content as Record<string, unknown>)?.source_script_node_id === 'node-script-story' &&
    (node.content as Record<string, unknown>)?.subtype === 'video'
  )).length).toBe(2)
  expect(state.canvasNodes.filter((node) => (
    node.node_type === 'generation' &&
    (node.content as Record<string, unknown>)?.subtype === 'video'
  )).every((node) => (
    ((node.content as Record<string, unknown>)?.generation_parameters as {
      video?: { resolution?: string }
    })?.video?.resolution === '1080p'
  ))).toBe(true)
  expect(state.generationAttempts).toBe(0)
})
