async (page) => {
  const base = 'http://127.0.0.1:9099'
  const apiOrigin = 'http://localhost:8000'
  const results = []
  let scenario = {}
  let calls = []

  const user = (role) => ({
    id: role === 'admin' ? 'admin-1' : 'user-1',
    username: role === 'admin' ? 'admin' : 'creator',
    email: `${role}@example.test`,
    nickname: role === 'admin' ? 'Admin Tester' : 'User Tester',
    avatar_url: '',
    role,
    status: 'active',
    generation_status: 'enabled',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
    last_login_at: '2026-07-11T00:00:00Z',
  })
  const authPayload = (role, token = `fresh-${role}-token`) => ({
    token,
    user: user(role),
    quotas: { text: 9, image: 8, video: 7 },
  })
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

  await page.route(`${apiOrigin}/**`, async (route) => {
    const request = route.request()
    const requestPath = request.url().slice(apiOrigin.length).split('?', 1)[0]
    calls.push({ path: requestPath, method: request.method() })

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' })
      return
    }

    if (requestPath === '/auth/registration-settings') {
      await fulfillJson(route, 200, {
        registration_mode: scenario.registrationMode || 'open',
        wechat_login_enabled: scenario.wechatEnabled === true,
      })
      return
    }

    if (requestPath === '/me') {
      if (scenario.meDelay) await page.waitForTimeout(scenario.meDelay)
      if (scenario.meRole === 'admin' || scenario.meRole === 'user') {
        await fulfillJson(route, 200, {
          user: user(scenario.meRole),
          quotas: { text: 9, image: 8, video: 7 },
        })
      } else if (scenario.meStatus === 503) {
        await fulfillJson(route, 503, { detail: 'temporary outage' })
      } else {
        await fulfillJson(route, 401, { detail: 'Invalid token' })
      }
      return
    }

    if (requestPath === '/auth/login') {
      await fulfillJson(route, 200, authPayload(scenario.loginRole || 'user'))
      return
    }

    if (requestPath === '/auth/register') {
      await fulfillJson(route, 200, authPayload(scenario.registerRole || 'user'))
      return
    }

    if (requestPath === '/auth/wechat/callback') {
      if (scenario.callbackDelay) {
        await page.waitForTimeout(scenario.callbackDelay)
      }
      if (scenario.callbackStatus) {
        await fulfillJson(route, scenario.callbackStatus, { detail: 'Wechat provider unavailable' })
        return
      }
      await fulfillJson(route, 200, authPayload(scenario.callbackRole || 'user', 'fresh-wechat-token'))
      return
    }

    if (requestPath === '/assets') {
      await fulfillJson(route, 200, { items: [] })
      return
    }

    await fulfillJson(route, 200, {})
  })

  await page.addInitScript(() => {
    window.__revidLoginSeen = false
    const inspect = () => {
      if (document.body?.innerText.includes('登录 Revid')) window.__revidLoginSeen = true
    }
    new MutationObserver(inspect).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    document.addEventListener('DOMContentLoaded', inspect)
  })

  const assert = (condition, message) => {
    if (!condition) throw new Error(message)
  }
  const settle = async (milliseconds = 250) => {
    await page.waitForFunction(() => Boolean(document.querySelector('main')))
    await page.waitForTimeout(milliseconds)
  }
  const reset = async (nextScenario, path, storage = {}) => {
    scenario = nextScenario
    await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(150)
    await page.evaluate(({ token, session }) => {
      localStorage.clear()
      sessionStorage.clear()
      if (token) localStorage.setItem('revid_token', token)
      for (const [key, value] of Object.entries(session || {})) {
        sessionStorage.setItem(key, value)
      }
    }, storage)
    calls = []
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded' })
    await settle(nextScenario.settle || 250)
  }
  const record = (name, details) => results.push({ name, ...details })
  const count = (path) => calls.filter((call) => call.path === path && call.method !== 'OPTIONS').length
  const currentLocation = () => page.evaluate(() => ({
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    redirect: new URLSearchParams(window.location.search).get('redirect'),
  }))

  await reset({}, '/app/workspace?project_id=p-1#node-a')
  let url = await currentLocation()
  assert(url.pathname === '/login', 'anonymous workspace did not redirect to login')
  assert(
    url.redirect === '/app/workspace?project_id=p-1#node-a',
    'workspace redirect target was not preserved',
  )
  assert(count('/me') === 0, 'anonymous navigation unexpectedly called /me')
  record('anonymous protected route', { path: url.pathname, meCalls: count('/me') })

  await reset({}, '/admin')
  url = await currentLocation()
  assert(
    url.pathname === '/login' && url.redirect === '/admin',
    'anonymous admin route did not preserve /admin redirect',
  )
  record('anonymous admin route', {
    path: url.pathname,
    redirect: url.redirect,
  })

  await reset({}, '/app/space', { token: 'invalid-token' })
  url = await currentLocation()
  const invalidTokenRemaining = await page.evaluate(() => localStorage.getItem('revid_token'))
  assert(url.pathname === '/login', 'invalid token did not return to login')
  assert(invalidTokenRemaining === null, 'invalid token was not cleared')
  assert(count('/me') === 1, `invalid token expected one /me call, got ${count('/me')}`)
  record('invalid token', { path: url.pathname, meCalls: count('/me'), tokenCleared: true })

  await reset(
    { meRole: 'user', meDelay: 350, settle: 450 },
    '/app/space',
    { token: 'valid-user-token' },
  )
  url = await currentLocation()
  const sawLoginDuringRestore = await page.evaluate(() => window.__revidLoginSeen)
  assert(url.pathname === '/app/space', 'valid user refresh did not stay on Space')
  assert(count('/me') === 1, `valid refresh expected one /me call, got ${count('/me')}`)
  assert(sawLoginDuringRestore === false, 'valid protected refresh flashed the login page')
  record('valid protected refresh', {
    path: url.pathname,
    meCalls: count('/me'),
    loginFlash: false,
  })

  await reset({ meRole: 'user' }, '/admin', { token: 'valid-user-token' })
  url = await currentLocation()
  assert(url.pathname === '/', 'normal user was not rejected from Admin')
  assert(count('/me') === 1, 'normal-user Admin guard did not restore exactly once')
  record('normal user admin guard', { path: url.pathname, meCalls: count('/me') })

  await reset({ meRole: 'admin' }, '/admin', { token: 'valid-admin-token' })
  url = await currentLocation()
  assert(url.pathname === '/admin', 'Admin did not reach Admin dashboard')
  assert(
    (await page.locator('body').innerText()).includes('Revid Admin'),
    'Admin dashboard content did not render',
  )
  assert(count('/me') === 1, 'Admin guard did not restore exactly once')
  record('admin guard', { path: url.pathname, meCalls: count('/me') })

  await reset(
    { meRole: 'user' },
    '/login?redirect=%2Fapp%2Fspace',
    { token: 'valid-user-token' },
  )
  url = await currentLocation()
  assert(url.pathname === '/app/space', 'authenticated auth-entry redirect was not honored')
  record('authenticated auth entry', { path: url.pathname })

  await reset(
    { loginRole: 'user' },
    '/login?redirect=%2Fapp%2Fspace%3Ftab%3Dmine%23assets',
  )
  await page.locator('#login-identifier').fill('creator')
  await page.locator('#login-password').fill('password1')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/app/space?tab=mine#assets')
  url = await currentLocation()
  assert(
    url.pathname === '/app/space' && url.search === '?tab=mine' && url.hash === '#assets',
    'safe password redirect lost path/query/hash',
  )
  record('safe password redirect', { path: `${url.pathname}${url.search}${url.hash}` })

  await reset({ loginRole: 'user' }, '/login?redirect=%2F%2Fevil.example%2Fsteal')
  await page.locator('#login-identifier').fill('creator')
  await page.locator('#login-password').fill('password1')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/app/workspace')
  url = await currentLocation()
  assert(
    url.origin === base && url.pathname === '/app/workspace',
    'protocol-relative redirect escaped or missed fallback',
  )
  record('unsafe password redirect', { origin: url.origin, path: url.pathname })

  const rejectedRedirects = [
    ['external', 'https%3A%2F%2Fevil.example%2Fsteal'],
    ['backslash', '%2F%5Cevil.example%2Fsteal'],
    ['encoded-control', '%2Fapp%2F%250Aevil'],
    ['auth-entry-loop', '%2Flogin'],
    ['normalized-double-slash', '%2Fsafe%2F..%2F%2Fevil.example'],
  ]
  for (const [label, redirect] of rejectedRedirects) {
    await reset(
      { meRole: 'user' },
      `/login?redirect=${redirect}`,
      { token: `valid-${label}-token` },
    )
    url = await currentLocation()
    assert(
      url.origin === base && url.pathname === '/app/workspace',
      `${label} redirect escaped or missed the Workspace fallback`,
    )
  }
  record('additional unsafe redirects', {
    rejected: rejectedRedirects.map(([label]) => label),
    fallback: '/app/workspace',
  })

  await reset(
    { registrationMode: 'open', registerRole: 'user' },
    '/register?redirect=%2Fapp%2Fspace',
  )
  await page.locator('#register-username').fill('newcreator')
  await page.locator('#register-email').fill('new@example.test')
  await page.locator('#register-password').fill('password1')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/app/space')
  url = await currentLocation()
  assert(url.pathname === '/app/space', 'registration did not preserve safe redirect')
  record('registration redirect', { path: url.pathname })

  await reset(
    { callbackRole: 'user', callbackDelay: 150, settle: 450 },
    '/auth/callback/wechat?code=mock-code&state=signed-state',
    {
      token: 'stale-token',
      session: {
        revid_wechat_state: 'signed-state',
        revid_wechat_redirect: '/app/space?from=wechat',
      },
    },
  )
  url = await currentLocation()
  const callbackStorage = await page.evaluate(() => ({
    state: sessionStorage.getItem('revid_wechat_state'),
    redirect: sessionStorage.getItem('revid_wechat_redirect'),
    tokenPresent: Boolean(localStorage.getItem('revid_token')),
  }))
  assert(
    url.pathname === '/app/space' && url.search === '?from=wechat',
    'WeChat callback did not preserve stored destination',
  )
  assert(
    count('/auth/wechat/callback') === 1,
    'WeChat callback exchange did not run exactly once',
  )
  assert(
    callbackStorage.state === null && callbackStorage.redirect === null,
    'WeChat callback storage was not cleared',
  )
  assert(callbackStorage.tokenPresent, 'WeChat callback did not establish the new token')
  assert(count('/me') === 0, 'WeChat callback did not suppress legacy App session restoration')
  record('wechat callback redirect', {
    path: `${url.pathname}${url.search}`,
    callbackCalls: count('/auth/wechat/callback'),
    meCalls: count('/me'),
    attemptStorageCleared: true,
  })

  scenario = { callbackRole: 'user', callbackDelay: 350 }
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(150)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('revid_token', 'older-token')
    sessionStorage.setItem('revid_wechat_state', 'stale-state')
    sessionStorage.setItem('revid_wechat_redirect', '/admin')
  })
  calls = []
  await page.goto(
    `${base}/auth/callback/wechat?code=stale-code&state=stale-state`,
    { waitUntil: 'domcontentloaded' },
  )
  await page.waitForTimeout(100)
  await page.evaluate(() => {
    sessionStorage.removeItem('revid_wechat_state')
    sessionStorage.removeItem('revid_wechat_redirect')
    localStorage.setItem('revid_token', 'newer-token')
  })
  await page.waitForTimeout(450)
  url = await currentLocation()
  assert(url.pathname === '/auth/callback/wechat', 'stale callback still changed navigation')
  assert(
    (await page.evaluate(() => localStorage.getItem('revid_token'))) === 'newer-token',
    'stale callback overwrote the newer token',
  )
  assert(count('/auth/wechat/callback') === 1, 'stale callback exchange did not run once')
  record('stale callback completion', {
    path: url.pathname,
    newerTokenPreserved: true,
    navigationPreserved: true,
  })

  await reset(
    { callbackStatus: 502, meRole: 'user' },
    '/auth/callback/wechat?code=failed-code&state=failed-state',
    {
      token: 'valid-user-token',
      session: {
        revid_wechat_state: 'failed-state',
        revid_wechat_redirect: '/app/space',
      },
    },
  )
  url = await currentLocation()
  assert(url.pathname === '/app/space', 'failed callback did not preserve the valid account route')
  assert(
    Boolean(await page.evaluate(() => localStorage.getItem('revid_token'))),
    'failed callback cleared the valid account token',
  )
  record('failed callback preserves session', { path: url.pathname, tokenPreserved: true })

  await reset(
    { meRole: 'user' },
    '/auth/callback/wechat?code=mock-code&state=unbound-state&redirect=%2Fapp%2Fspace',
    { token: 'valid-user-token' },
  )
  url = await currentLocation()
  assert(url.pathname === '/app/space', 'missing stored state did not preserve the valid session')
  assert(count('/auth/wechat/callback') === 0, 'missing stored state still called the callback API')
  record('missing callback state', { path: url.pathname, callbackCalls: 0, tokenPreserved: true })

  await reset(
    { callbackRole: 'user', meRole: 'user' },
    '/auth/callback/wechat?code=mock-code&state=tampered-state',
    {
      token: 'stale-token',
      session: {
        revid_wechat_state: 'signed-state',
        revid_wechat_redirect: '/app/space',
      },
    },
  )
  url = await currentLocation()
  assert(
    url.pathname === '/app/space',
    'state mismatch did not preserve the existing valid session',
  )
  assert(count('/auth/wechat/callback') === 0, 'state mismatch still called the callback API')
  assert(
    Boolean(await page.evaluate(() => localStorage.getItem('revid_token'))),
    'state mismatch cleared the existing valid session',
  )
  record('wechat state mismatch', {
    path: url.pathname,
    callbackCalls: count('/auth/wechat/callback'),
    tokenPreserved: true,
  })

  return {
    passed: results.length,
    results,
    finalPath: (await currentLocation()).pathname,
  }
}
