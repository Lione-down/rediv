import { expect, test } from '@playwright/test'
import {
  APP_ORIGIN,
  canvasConnections,
  canvasMetadata,
  canvasNodes,
  captureVisualEvidence,
  createVisualState,
  installMockApi,
  visualViewports,
  type MockState,
} from './authenticated-workflow-fixture'

test('authenticated project and Canvas generation workflow survives reload', async ({ page }) => {
  const state: MockState = {
    projects: [],
    canvases: [],
    canvasOrderRevision: 0,
    canvasNodes: structuredClone(canvasNodes),
    canvasConnections: structuredClone(canvasConnections),
    assets: [],
    templates: [],
    generationTasks: [],
    imageQuota: 1,
    quotaRevision: 0,
    generationAttempts: 0,
    generationBodies: [],
    authenticatedRequests: [],
  }
  await installMockApi(page, state)

  await page.goto('/login?redirect=/')
  await page.getByLabel('用户名或邮箱').fill('creator')
  await page.getByLabel('密码').fill('correct-password')
  await page.getByRole('button', { name: '登录并进入工作流' }).click()

  await expect(page).toHaveURL(`${APP_ORIGIN}/`)
  await expect(page.getByRole('heading', { name: '你的项目' })).toBeVisible()

  await page.getByRole('button', { name: '创建第一个项目' }).click()
  await page.getByLabel('项目名称').fill('E2E 夏日短片')
  await page.getByRole('button', { name: '创建项目', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'E2E 夏日短片' })).toBeVisible()

  await page.getByRole('button', { name: '进入项目 E2E 夏日短片' }).click()
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first$/)
  await page.goto('/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=legacy')
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()
  await expect(page.locator('.connection-line')).toHaveCount(1)

  const canvas = page.locator('.canvas-surface')
  await expect(canvas).toBeVisible()
  await canvas.click({ position: { x: 220, y: 180 } })
  const generationEditor = page.getByRole('region', { name: '生成任务编辑器' })
  await expect(generationEditor).toBeVisible()
  await expect(generationEditor.getByRole('textbox', { name: '生成提示词' })).toHaveValue('夏日海边电影海报')

  await generationEditor.getByRole('button', { name: '开始图片生成' }).click()
  await expect(generationEditor.getByRole('status', { name: '生成状态' })).toContainText('已完成')
  await expect.poll(() => state.canvasNodes.some((node) => (
    node.node_type === 'result'
      && (node.content as Record<string, unknown> | undefined)?.source_task_id === 'task-generated'
  ))).toBe(true)
  await expect.poll(() => state.canvasConnections.some((connection) => (
    connection.source_node_id === 'node-image'
      && state.canvasNodes.some((node) => node.id === connection.target_node_id
        && (node.content as Record<string, unknown> | undefined)?.source_task_id === 'task-generated')
  ))).toBe(true)

  await generationEditor.getByRole('button', { name: '开始图片生成' }).click()
  await expect(page.locator('.canvas-card-work-surface').getByRole('alert')).toContainText('mock provider unavailable')
  expect(state.imageQuota).toBe(3)
  expect(state.generationTasks).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'task-generated', status: 'succeeded', result_asset_id: 'asset-generated' }),
    expect.objectContaining({ id: 'task-failed', status: 'failed', error_message: 'mock provider unavailable' }),
  ]))
  expect(state.generationBodies).toEqual([
    {
      project_id: 'project-e2e', origin_canvas_id: 'canvas-first',
      client_request_id: expect.any(String),
      canvas_node_id: 'node-image', prompt: '夏日海边电影海报', aspect_ratio: '4:3',
    },
    {
      project_id: 'project-e2e', origin_canvas_id: 'canvas-first',
      client_request_id: expect.any(String),
      canvas_node_id: 'node-image', prompt: '夏日海边电影海报', aspect_ratio: '4:3',
    },
  ])

  await page.reload()
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first\?canvas_runtime=legacy$/)
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()
  await expect(page.locator('.connection-line')).toHaveCount(1)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('button', { name: '选择并定位 图片生成结果' })).toBeVisible()
  expect(state.authenticatedRequests).toContain('GET /me')
  expect(state.authenticatedRequests).toContain('GET /api/projects/project-e2e/canvases')
  expect(state.authenticatedRequests).toContain('GET /api/projects/project-e2e/canvases/canvas-first/document')
  expect(state.authenticatedRequests).not.toContain('GET /api/generation-tasks')
  expect(state.authenticatedRequests).toContain('PATCH /api/projects/project-e2e/canvases/canvas-first/document')
  expect(state.authenticatedRequests).toContain('POST /api/image-generate')
})

for (const viewport of visualViewports) {
  test(`responsive visual matrix at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    const state = createVisualState()
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await installMockApi(page, state)

    await page.goto('/login?redirect=/')
    await expect(page.getByRole('heading', { name: '登录 Revid' })).toBeVisible()
    await expect(page.getByLabel('用户名或邮箱')).toBeVisible()
    await captureVisualEvidence(page, testInfo, `${viewport.name}-login`)

    await page.getByLabel('用户名或邮箱').fill('creator')
    await page.getByLabel('密码').fill('correct-password')
    await page.getByRole('button', { name: '登录并进入工作流' }).click()
    await expect(page.getByRole('heading', { name: 'E2E Creator 的创作工作台' })).toBeVisible()
    await expect(page.getByRole('button', { name: '进入项目 E2E 夏日短片' })).toBeVisible()
    await captureVisualEvidence(page, testInfo, `${viewport.name}-home`)

    await page.getByRole('button', { name: '进入项目 E2E 夏日短片' }).click()
    await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first$/)
    await page.goto('/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=legacy')
    await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
    await expect(page.getByRole('region', { name: '项目与画布导航' })).toBeVisible()
    const projectName = page.getByText('E2E 夏日短片')
    if (viewport.width < 768) await expect(projectName).toBeHidden()
    else await expect(projectName).toBeVisible()
    await expect(page.getByRole('button', { name: '画布 1' })).toBeVisible()
    await expect(page.locator('footer[aria-label="Prompt 输入区"]')).toHaveCount(0)
    await expect(page.locator('aside.right-panel')).toHaveCount(0)
    const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
    if (viewport.width < 768) {
      await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
      await expect(stage).toHaveAttribute('aria-description', '只读审阅模式')
    } else {
      await expect(page.getByText('浏览审阅模式', { exact: true })).toHaveCount(0)
      await expect(stage).toHaveAttribute('aria-description', '可编辑画布')
    }
    await captureVisualEvidence(page, testInfo, `${viewport.name}-workspace`)

    await page.goto('/app/space')
    await expect(page.getByRole('heading', { name: 'E2E Creator 的个人空间' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '个人资产' })).toBeVisible()
    await expect(page.getByRole('button', { name: /查看资产详情/ })).toBeVisible()
    await captureVisualEvidence(page, testInfo, `${viewport.name}-space`)
  })
}

test('legacy and invalid canonical routes resolve only through the active Canvas list', async ({ page }) => {
  const state = createVisualState()
  state.canvases = [
    canvasMetadata('canvas-first', '画布 1', 0),
    canvasMetadata('canvas-second', '分镜', 1),
  ]
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
    window.localStorage.setItem(
      'revid:last-canvas:user-e2e:project-e2e',
      'canvas-second',
    )
  })

  await page.goto('/app/workspace?project_id=project-e2e&canvas_runtime=legacy')
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first\?canvas_runtime=legacy$/)
  await expect(page.getByRole('button', { name: '定位到 生成封面' })).toBeVisible()

  await page.goto('/app/projects/project-e2e/canvases/foreign-canvas?canvas_runtime=legacy')
  await expect(page).toHaveURL(/\/app\/projects\/project-e2e\/canvases\/canvas-first\?canvas_runtime=legacy$/)
  expect(state.authenticatedRequests).toContain('GET /api/projects/project-e2e/canvases')
})
