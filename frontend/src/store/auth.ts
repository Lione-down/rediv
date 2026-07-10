import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createGuestSession,
  exchangeWechatCode,
  fetchCurrentUser,
  fetchRegistrationSettings,
  getWechatAuthorize,
  loginWithPassword as requestPasswordLogin,
  logoutCurrentSession,
  registerWithPassword as requestPasswordRegistration,
} from '../api/auth'
import type {
  AuthResponse,
  LoginPayload,
  QuotaBalance,
  RegisterPayload,
  RegistrationSettings,
  User,
} from '../types/auth'

const TOKEN_STORAGE_KEY = 'revid_token'
const WECHAT_STATE_STORAGE_KEY = 'revid_wechat_state'
const WECHAT_REDIRECT_STORAGE_KEY = 'revid_wechat_redirect'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const user = ref<User | null>(null)
  const quotas = ref<QuotaBalance>({ text: 0, image: 0, video: 0 })
  const guestSessionId = ref('')
  const guestSessionExpiresAt = ref('')
  const wechatState = ref('')
  const registrationSettings = ref<RegistrationSettings | null>(null)
  const isLoadingRegistrationSettings = ref(false)
  const isRestoringSession = ref(false)
  const hasRestoredSession = ref(!token.value)

  let registrationSettingsRequest: Promise<RegistrationSettings> | null = null
  let registrationSettingsGeneration = 0
  let currentUserRequest: Promise<User | null> | null = null
  let currentUserRequestToken = ''
  let isSessionRestoreSuppressed = false
  let sessionRestoreRequest: Promise<boolean> | null = null

  const isLoggedIn = computed(() => Boolean(token.value && user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')
  const canRegister = computed(
    () =>
      registrationSettings.value !== null &&
      registrationSettings.value.registration_mode !== 'closed',
  )
  const isWechatLoginEnabled = computed(
    () => registrationSettings.value?.wechat_login_enabled === true,
  )

  function applyAuth(payload: AuthResponse) {
    token.value = payload.token
    user.value = payload.user
    quotas.value = payload.quotas
    guestSessionId.value = ''
    guestSessionExpiresAt.value = ''
    hasRestoredSession.value = true
    localStorage.setItem(TOKEN_STORAGE_KEY, token.value)
  }

  function createWechatState() {
    return `revid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  function clearWechatLoginAttempt() {
    wechatState.value = ''
    sessionStorage.removeItem(WECHAT_STATE_STORAGE_KEY)
    sessionStorage.removeItem(WECHAT_REDIRECT_STORAGE_KEY)
  }

  function getPendingWechatRedirect() {
    return sessionStorage.getItem(WECHAT_REDIRECT_STORAGE_KEY) || ''
  }

  function isWechatLoginAttemptCurrent(state: string) {
    return Boolean(state && sessionStorage.getItem(WECHAT_STATE_STORAGE_KEY) === state)
  }

  function setSessionRestoreSuppressed(isSuppressed: boolean) {
    isSessionRestoreSuppressed = isSuppressed
  }

  function shouldSuppressDirectSessionLoad(ignoreCallbackPath: boolean) {
    // Root mount can overlap the initial router guard, so close that callback-only startup race.
    return (
      isSessionRestoreSuppressed ||
      (!ignoreCallbackPath && window.location.pathname === '/auth/callback/wechat')
    )
  }

  async function loginWithWechat(redirectPath = '') {
    clearWechatLoginAttempt()
    const requestedState = createWechatState()
    const response = await getWechatAuthorize(requestedState)
    const { authorize_url: authorizeUrl, mock, state } = response.data

    wechatState.value = state
    sessionStorage.setItem(WECHAT_STATE_STORAGE_KEY, state)
    if (redirectPath) {
      sessionStorage.setItem(WECHAT_REDIRECT_STORAGE_KEY, redirectPath)
    }

    if (mock) {
      const callbackUrl = new URL(`${window.location.origin}/auth/callback/wechat`)
      callbackUrl.searchParams.set('code', `mock-${Date.now()}`)
      callbackUrl.searchParams.set('state', state)
      window.location.assign(callbackUrl.toString())
      return
    }

    window.location.assign(authorizeUrl)
  }

  async function completeWechatLogin(code: string, state?: string, invitationCode?: string) {
    const requestedState = state || ''
    const redirectPath = getPendingWechatRedirect()
    const response = await exchangeWechatCode({
      code,
      state,
      invitation_code: invitationCode,
    })

    if (!isWechatLoginAttemptCurrent(requestedState)) {
      return { isApplied: false, redirectPath: '' }
    }

    applyAuth(response.data)
    clearWechatLoginAttempt()
    return { isApplied: true, redirectPath }
  }

  async function loadRegistrationSettings(force = false) {
    if (!force && registrationSettings.value) {
      return registrationSettings.value
    }

    if (registrationSettingsRequest) {
      return registrationSettingsRequest
    }

    isLoadingRegistrationSettings.value = true
    const requestGeneration = registrationSettingsGeneration
    const currentRequest = fetchRegistrationSettings().then((response) => {
      if (requestGeneration === registrationSettingsGeneration) {
        registrationSettings.value = response.data
      }
      return response.data
    })
    registrationSettingsRequest = currentRequest

    try {
      return await currentRequest
    } finally {
      if (registrationSettingsRequest === currentRequest) {
        registrationSettingsRequest = null
        isLoadingRegistrationSettings.value = false
      }
    }
  }

  function overrideRegistrationMode(mode: RegistrationSettings['registration_mode']) {
    registrationSettingsGeneration += 1
    registrationSettingsRequest = null
    isLoadingRegistrationSettings.value = false
    registrationSettings.value = {
      registration_mode: mode,
      wechat_login_enabled: registrationSettings.value?.wechat_login_enabled ?? false,
    }
  }

  async function loginWithPassword(payload: LoginPayload) {
    const response = await requestPasswordLogin(payload)
    applyAuth(response.data)
    clearWechatLoginAttempt()
    return response.data.user
  }

  async function registerWithPassword(payload: RegisterPayload) {
    const response = await requestPasswordRegistration(payload)
    applyAuth(response.data)
    clearWechatLoginAttempt()
    return response.data.user
  }

  async function loadCurrentUser(ignoreCallbackPath = false): Promise<User | null> {
    if (shouldSuppressDirectSessionLoad(ignoreCallbackPath)) {
      return user.value
    }

    const requestedToken = token.value

    if (!requestedToken) {
      return null
    }

    if (currentUserRequest && currentUserRequestToken === requestedToken) {
      return currentUserRequest
    }

    const request = (async () => {
      const response = await fetchCurrentUser()

      if (token.value !== requestedToken) {
        return user.value
      }

      user.value = response.data.user
      quotas.value = response.data.quotas
      hasRestoredSession.value = true
      return response.data.user
    })()
    currentUserRequest = request
    currentUserRequestToken = requestedToken

    try {
      return await request
    } finally {
      if (currentUserRequest === request) {
        currentUserRequest = null
        currentUserRequestToken = ''
      }
    }
  }

  async function restoreSession() {
    if (isSessionRestoreSuppressed) {
      return isLoggedIn.value
    }

    if (hasRestoredSession.value) {
      return isLoggedIn.value
    }

    if (sessionRestoreRequest) {
      return sessionRestoreRequest
    }

    isRestoringSession.value = true
    sessionRestoreRequest = (async () => {
      try {
        if (!token.value) {
          return false
        }

        const restoredUser = await loadCurrentUser(true)
        hasRestoredSession.value = true
        return Boolean(restoredUser && token.value)
      } catch (error) {
        if (!token.value) {
          hasRestoredSession.value = true
          return false
        }

        throw error
      } finally {
        isRestoringSession.value = false
      }
    })()

    try {
      return await sessionRestoreRequest
    } finally {
      sessionRestoreRequest = null
    }
  }

  async function startGuestSession() {
    const response = await createGuestSession()
    guestSessionId.value = response.data.session_id
    guestSessionExpiresAt.value = response.data.expires_at
    clearWechatLoginAttempt()
    return response.data
  }

  async function logout() {
    const hadToken = Boolean(token.value)
    clearSession()
    clearWechatLoginAttempt()

    if (!hadToken) {
      return
    }

    try {
      await logoutCurrentSession()
    } catch {
      // The backend logout endpoint is acknowledgement-only; local token removal is authoritative.
    }
  }

  function clearSession() {
    token.value = ''
    user.value = null
    quotas.value = { text: 0, image: 0, video: 0 }
    hasRestoredSession.value = true
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }

  return {
    token,
    user,
    quotas,
    guestSessionId,
    guestSessionExpiresAt,
    wechatState,
    registrationSettings,
    isLoadingRegistrationSettings,
    isRestoringSession,
    hasRestoredSession,
    isLoggedIn,
    isAdmin,
    canRegister,
    isWechatLoginEnabled,
    loadRegistrationSettings,
    overrideRegistrationMode,
    loginWithPassword,
    registerWithPassword,
    loginWithWechat,
    completeWechatLogin,
    getPendingWechatRedirect,
    isWechatLoginAttemptCurrent,
    clearWechatLoginAttempt,
    setSessionRestoreSuppressed,
    loadCurrentUser,
    restoreSession,
    startGuestSession,
    logout,
    clearSession,
  }
})
