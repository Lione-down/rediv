import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createGuestSession,
  exchangeWechatCode,
  fetchCurrentUser,
  getWechatAuthorize,
} from '../api/auth'
import type { AuthResponse, QuotaBalance, User } from '../types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('revid_token') || '')
  const user = ref<User | null>(null)
  const quotas = ref<QuotaBalance>({ text: 0, image: 0, video: 0 })
  const guestSessionId = ref('')
  const wechatState = ref('')

  const isLoggedIn = computed(() => Boolean(token.value && user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  function applyAuth(response: { data: AuthResponse }) {
    token.value = response.data.token
    user.value = response.data.user
    quotas.value = response.data.quotas
    localStorage.setItem('revid_token', token.value)
  }

  function createWechatState() {
    return `revid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  async function loginWithWechat() {
    const state = createWechatState()
    const response = await getWechatAuthorize(state)
    const { authorize_url: authorizeUrl, mock } = response.data

    wechatState.value = state
    sessionStorage.setItem('revid_wechat_state', state)

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
    const response = await exchangeWechatCode({
      code,
      state,
      invitation_code: invitationCode,
    })
    applyAuth(response)
    sessionStorage.removeItem('revid_wechat_state')
    wechatState.value = ''
  }

  async function loadCurrentUser() {
    if (!token.value) return

    const response = await fetchCurrentUser()
    user.value = response.data.user
    quotas.value = response.data.quotas
  }

  async function startGuestSession() {
    const response = await createGuestSession()
    guestSessionId.value = response.data.session_id
  }

  function clearSession() {
    token.value = ''
    user.value = null
    quotas.value = { text: 0, image: 0, video: 0 }
    wechatState.value = ''
    localStorage.removeItem('revid_token')
    sessionStorage.removeItem('revid_wechat_state')
  }

  return {
    token,
    user,
    quotas,
    guestSessionId,
    wechatState,
    isLoggedIn,
    isAdmin,
    loginWithWechat,
    completeWechatLogin,
    loadCurrentUser,
    startGuestSession,
    clearSession,
  }
})
