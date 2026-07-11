async (page) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  page.removeAllListeners('pageerror')
  page.removeAllListeners('console')

  const base = 'http://127.0.0.1:9099'
  const apiOrigin = 'http://localhost:8000'
  const results = []
  const runtimeErrors = []
  let scenario = {}
  let calls = []
  let releaseCreate = null

  const user = {
    id: 'user-1',
    username: 'creator',
    email: 'creator@example.test',
    nickname: 'User Tester',
    avatar_url: '',
    role: 'user',
    status: 'active',
    generation_status: 'enabled',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
    last_login_at: '2026-07-11T00:00:00Z',
  }
  const projects = [
    {
      id: 'project-backend-1',
      user_id: user.id,
      name: '跨端发布计划与夏日海边短片素材整理',
      created_at: '2026-07-11T00:00:00Z',
    },
  ]
  const assets = [
    {
      id: 'asset-known-1',
      user_id: user.id,
      project_id: projects[0].id,
      canvas_node_id: null,
      type: 'image',
      url: 'https://assets.example.test/preview/frame-01.png?private=hidden',
      content_text: null,
      source: 'generation',
      source_model: null,
      source_task_id: null,
      status: 'active',
      created_at: '2026-07-11T02:00:00Z',
      updated_at: '2026-07-11T02:00:00Z',
    },
    {
      id: 'asset-unknown-1',
      user_id: user.id,
      project_id: null,
      canvas_node_id: null,
      type: 'constructor',
      url: null,
      content_text: '',
      source: '__proto__',
      source_model: null,
      source_task_id: null,
      status: 'toString',
      created_at: '2026-07-11T01:00:00Z',
      updated_at: '2026-07-11T01:00:00Z',
    },
  ]
  const createdProject = {
    id: 'project-created-2',
    user_id: user.id,
    name: '新建验收项目',
    created_at: '2026-07-11T03:00:00Z',
  }
  const corsHeaders = {
    'access-control-allow-origin': base,
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'Authorization,Content-Type',
    'content-type': 'application/json',
  }
  const fulfillJson = (route, status, payload) => route.fulfill({
    status,
    headers: corsHeaders,
    body: JSON.stringify(payload),
  })
  const assert = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const record = (name, details = {}) => results.push({ name, ...details })
  const count = (path, method) => calls.filter(
    (call) => call.path === path && (!method || call.method === method),
  ).length

  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.route(`${apiOrigin}/**`, async (route) => {
    const request = route.request()
    const requestPath = request.url().slice(apiOrigin.length).split('?', 1)[0]
    calls.push({
      path: requestPath,
      method: request.method(),
      body: request.method() === 'POST' ? request.postDataJSON() : null,
    })

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' })
      return
    }

    if (requestPath === '/me') {
      if (scenario.meDelay) await page.waitForTimeout(scenario.meDelay)
      if (scenario.meStatus && scenario.meStatus !== 200) {
        await fulfillJson(route, scenario.meStatus, { detail: 'session unavailable' })
        return
      }
      await fulfillJson(route, 200, {
        user: { ...user, generation_status: scenario.generationStatus || 'enabled' },
        quotas: scenario.quotas || { text: 9, image: 8, video: 7 },
      })
      return
    }

    if (requestPath === '/projects' && request.method() === 'GET') {
      if (scenario.projectDelay) await page.waitForTimeout(scenario.projectDelay)
      if (scenario.projectStatus && scenario.projectStatus !== 200) {
        await fulfillJson(route, scenario.projectStatus, { detail: '项目服务暂时不可用' })
        return
      }
      const items = scenario.projectItems === undefined ? projects : scenario.projectItems
      await fulfillJson(route, 200, { items, total: items.length })
      return
    }

    if (requestPath === '/projects' && request.method() === 'POST') {
      if (scenario.holdCreate) {
        await new Promise((resolve) => {
          releaseCreate = resolve
        })
      }
      if (scenario.createStatus && scenario.createStatus !== 201) {
        await fulfillJson(route, scenario.createStatus, { detail: '项目名称暂时无法创建' })
        return
      }
      await fulfillJson(route, 201, createdProject)
      return
    }

    if (requestPath === '/assets') {
      if (scenario.assetDelay) await page.waitForTimeout(scenario.assetDelay)
      if (scenario.assetStatus && scenario.assetStatus !== 200) {
        await fulfillJson(route, scenario.assetStatus, { detail: '资产服务暂时不可用' })
        return
      }
      const items = scenario.assetItems === undefined ? assets : scenario.assetItems
      await fulfillJson(route, 200, {
        items,
        total: scenario.assetTotal ?? items.length,
        page: 1,
        page_size: 20,
      })
      return
    }

    if (requestPath === '/auth/registration-settings') {
      await fulfillJson(route, 200, {
        registration_mode: 'open',
        wechat_login_enabled: false,
      })
      return
    }

    await fulfillJson(route, 200, {})
  })

  const reset = async (nextScenario, { waitForData = true, viewport } = {}) => {
    scenario = nextScenario
    releaseCreate = null
    if (viewport) await page.setViewportSize(viewport)
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('revid_token', 'browser-token')
    })
    calls = []
    runtimeErrors.length = 0
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'User Tester 的创作工作台' }).waitFor()
    if (waitForData) {
      await page.waitForFunction(() => {
        const regions = [...document.querySelectorAll('[aria-busy]')]
        return regions.length === 2 && regions.every((region) => region.getAttribute('aria-busy') === 'false')
      })
    }
  }

  await reset({
    quotas: { text: 0, image: 0, video: 0 },
    assetTotal: 47,
  }, { viewport: { width: 1440, height: 900 } })
  const pageText = await page.locator('body').innerText()
  const unknownRow = page.locator('.asset-row').filter({ hasText: '未命名资产' })
  assert(pageText.includes(projects[0].name), 'real project name did not render')
  assert(pageText.includes('三类额度均为零'), 'zero quota state did not render')
  assert((await unknownRow.innerText()).includes('未知 · 未知 · 未知'), 'unknown asset values were inferred')
  assert(!(await unknownRow.innerText()).includes('Video · Upload · Active'), 'unknown asset values used fabricated fallbacks')
  assert(!(await page.getByRole('region', { name: '最近资产' }).innerText()).includes('47'), 'recent asset panel exposed page length as account total')
  assert(!pageText.includes('故事脚本') && !pageText.includes('12 个可复用'), 'fabricated Home copy remains visible')
  const workspaceLinks = await page.locator('a').evaluateAll((links) => links
    .map((link) => link.href)
    .filter((href) => new URL(href).pathname === '/app/workspace'))
  assert(workspaceLinks.length === 0, 'Home still exposes an implicit Workspace link')
  assert(count('/me', 'GET') === 1, `expected one /me request, got ${count('/me', 'GET')}`)
  assert(count('/projects', 'GET') === 1, `expected one project request, got ${count('/projects', 'GET')}`)
  assert(count('/assets', 'GET') === 1, `expected one asset request, got ${count('/assets', 'GET')}`)
  assert(await page.getByRole('link', { name: '打开个人空间' }).isVisible(), 'Space navigation was removed')
  await page.keyboard.press('Tab')
  const styleCheck = await page.evaluate(() => {
    const reference = document.createElement('span')
    reference.style.color = 'var(--text-primary)'
    reference.style.borderColor = 'var(--accent-select)'
    document.body.append(reference)
    const createButton = document.querySelector('.header-action.is-primary')
    const activeElement = document.activeElement
    const result = {
      ctaColor: createButton ? getComputedStyle(createButton).color : '',
      textPrimary: getComputedStyle(reference).color,
      focusOutline: activeElement ? getComputedStyle(activeElement).outlineColor : '',
      accentSelect: getComputedStyle(reference).borderColor,
    }
    reference.remove()
    return result
  })
  assert(styleCheck.ctaColor === styleCheck.textPrimary, 'primary CTA did not use high-contrast text')
  assert(styleCheck.focusOutline === styleCheck.accentSelect, 'Home focus outline did not use solid accent')
  record('real data, zero quota, unknown values, recent semantics', {
    meCalls: count('/me', 'GET'),
    projectCalls: count('/projects', 'GET'),
    assetCalls: count('/assets', 'GET'),
  })

  await page.getByRole('button', { name: '新建项目', exact: true }).first().click()
  await page.getByLabel('项目名称').fill('Account A private draft')
  const switchedSession = await page.evaluate((nextUser) => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context.provides
    const pinia = provides && Reflect.ownKeys(provides)
      .map((key) => provides[key])
      .find((value) => value?._s?.has('auth'))
    if (!pinia) throw new Error('Pinia instance was not found')
    const authStore = pinia._s.get('auth')
    localStorage.setItem('revid_token', 'browser-token-b')
    authStore.$patch({ token: 'browser-token-b', user: nextUser })
    return { token: authStore.token, userId: authStore.user?.id }
  }, { ...user, id: 'user-2', username: 'creator-b', nickname: 'User B' })
  assert(switchedSession.token === 'browser-token-b' && switchedSession.userId === 'user-2', 'browser session switch failed')
  await page.getByRole('dialog', { name: '创建项目' }).waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: '新建项目', exact: true }).first().click()
  assert((await page.getByLabel('项目名称').inputValue()) === '', 'A draft remained visible after switching to B')
  await page.mouse.click(4, 4)
  await page.getByRole('dialog', { name: '创建项目' }).waitFor({ state: 'hidden' })
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const provides = app?._context.provides
    const pinia = provides && Reflect.ownKeys(provides)
      .map((key) => provides[key])
      .find((value) => value?._s?.has('auth'))
    const authStore = pinia?._s.get('auth')
    authStore.$patch({ user: { ...authStore.user, role: 'admin' } })
  })
  assert(await page.getByRole('link', { name: '打开 Admin' }).isVisible(), 'Admin navigation was removed')
  record('session switch clears draft and controlled modal dismisses')

  await reset({ projectItems: [], assetItems: [] })
  assert(await page.getByText('还没有项目', { exact: true }).isVisible(), 'project empty state missing')
  assert(await page.getByText('还没有最近资产', { exact: false }).isVisible(), 'asset empty state missing')
  assert(!(await page.locator('body').innerText()).includes(projects[0].name), 'empty state leaked stale project')
  record('independent empty states')

  await reset({ projectDelay: 550, assetDelay: 550 }, { waitForData: false })
  const projectsRegion = page.getByRole('region', { name: '项目列表' })
  const assetsRegion = page.getByRole('region', { name: '最近资产' })
  await projectsRegion.waitFor()
  assert((await projectsRegion.getAttribute('aria-busy')) === 'true', 'project loading state missing')
  assert((await assetsRegion.getAttribute('aria-busy')) === 'true', 'asset loading state missing')
  assert(!(await projectsRegion.innerText()).includes('还没有项目'), 'project loading flashed empty state')
  await page.waitForFunction(() => [...document.querySelectorAll('[aria-busy]')]
    .every((region) => region.getAttribute('aria-busy') === 'false'))
  assert(count('/projects', 'GET') === 1 && count('/assets', 'GET') === 1, 'loading scenario duplicated requests')
  record('loading without empty flash')

  await reset({ assetStatus: 503 })
  assert(await page.getByText(projects[0].name, { exact: true }).isVisible(), 'project success hidden by asset failure')
  assert(await assetsRegion.getByRole('alert').isVisible(), 'asset scoped error missing')
  assert((await page.locator('.intro-copy').innerText()).includes('最近资产加载失败'), 'asset failure summary still reported syncing')
  record('partial data, projects succeed')

  await reset({ projectStatus: 503 })
  assert(await page.getByText('frame-01.png', { exact: true }).isVisible(), 'asset success hidden by project failure')
  assert(await projectsRegion.getByRole('alert').isVisible(), 'project scoped error missing')
  assert((await page.locator('.intro-copy').innerText()).includes('项目加载失败'), 'project failure summary still reported syncing')
  record('partial data, assets succeed')

  await reset({ holdCreate: true })
  await page.getByRole('button', { name: '新建项目', exact: true }).first().click()
  const projectNameInput = page.getByLabel('项目名称')
  const createButton = page.getByRole('button', { name: '创建项目', exact: true })
  assert((await projectNameInput.getAttribute('aria-invalid')) === 'false', 'fresh input should not be invalid')
  await createButton.click()
  const validationAlert = page.getByRole('alert').filter({ hasText: '请输入项目名称' })
  await validationAlert.waitFor()
  assert((await projectNameInput.getAttribute('aria-invalid')) === 'true', 'invalid input missing aria-invalid')
  assert((await projectNameInput.getAttribute('aria-describedby')) === 'project-name-error', 'invalid input missing error description')
  assert(await projectNameInput.evaluate((element) => document.activeElement === element), 'invalid input did not regain focus')
  await projectNameInput.fill(createdProject.name)
  await page.waitForFunction(() => document.querySelector('#project-name')?.getAttribute('aria-invalid') === 'false')
  await createButton.click()
  await page.waitForFunction(() => {
    const buttons = [...document.querySelectorAll('button')]
    return buttons.some((button) => button.textContent?.includes('创建中') && button.disabled)
  })
  assert(typeof releaseCreate === 'function', 'create request was not held by the route mock')
  releaseCreate()
  await page.getByText(createdProject.name, { exact: true }).waitFor()
  const postCalls = calls.filter((call) => call.path === '/projects' && call.method === 'POST')
  assert(postCalls.length === 1, `expected one create POST, got ${postCalls.length}`)
  assert(
    JSON.stringify(postCalls[0].body) === JSON.stringify({ name: createdProject.name }),
    'create POST body contained fields beyond name',
  )
  assert(count('/projects', 'GET') === 1, 'successful create required an unnecessary list reload')
  await page.getByRole('button', { name: `进入项目 ${createdProject.name}` }).click()
  await page.waitForURL('**/app/workspace?project_id=project-created-2')
  const navigation = await page.evaluate(() => ({
    pathname: location.pathname,
    values: new URLSearchParams(location.search).getAll('project_id'),
  }))
  assert(navigation.pathname === '/app/workspace', 'created project did not enter Workspace')
  assert(navigation.values.length === 1 && navigation.values[0] === createdProject.id, 'Workspace project_id was not exact and scalar')
  record('create, immediate insert, duplicate guard, explicit navigation', {
    postCalls: postCalls.length,
    projectId: navigation.values[0],
  })

  await reset({ createStatus: 503 })
  await page.getByRole('button', { name: '新建项目', exact: true }).first().click()
  await page.getByLabel('项目名称').fill('失败但应保留输入')
  await page.getByRole('button', { name: '创建项目', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '项目名称暂时无法创建' }).waitFor()
  assert(await page.getByText(projects[0].name, { exact: true }).isVisible(), 'create failure cleared existing projects')
  assert((await page.getByLabel('项目名称').inputValue()) === '失败但应保留输入', 'create failure cleared input')
  record('create failure preserves list and input')

  await reset({})
  scenario.projectStatus = 401
  await page.getByRole('button', { name: '刷新项目列表' }).click()
  await page.getByRole('heading', { name: '先登录，再从真实项目开始创作。' }).waitFor()
  assert(!(await page.locator('body').innerText()).includes(projects[0].name), '401 left prior-session project visible')
  assert((await page.evaluate(() => localStorage.getItem('revid_token'))) === null, '401 did not clear token')
  record('401 synchronously clears session data')

  const responsiveScenario = { assetTotal: 47 }
  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'tablet-920', width: 920, height: 900 },
    { name: 'mobile-375', width: 375, height: 812 },
  ]
  for (const viewport of viewports) {
    await reset(responsiveScenario, { viewport: { width: viewport.width, height: viewport.height } })
    const geometry = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    assert(geometry.scrollWidth <= geometry.innerWidth, `${viewport.name} has horizontal overflow`)
    await page.screenshot({ path: `${viewport.name}.png`, fullPage: true })
    record(`${viewport.name} responsive`, geometry)
  }

  assert(runtimeErrors.length === 0, `runtime errors: ${runtimeErrors.join(' | ')}`)
  return {
    passed: results.length,
    results,
    runtimeErrors,
  }
}
