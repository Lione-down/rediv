import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createGuestSession, fetchCurrentUser, mockWechatLogin } from '../api/auth'
import type { QuotaBalance, User } from '../types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('revid_token') || '')
  const user = ref<User | null>(null)
  const quotas = ref<QuotaBalance>({ text: 0, image: 0, video: 0 })
  const guestSessionId = ref('')

  const isLoggedIn = computed(() => Boolean(token.value && user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function loginWithMockWechat() {
    const response = await mockWechatLogin()
    token.value = response.data.token
    user.value = response.data.user
    quotas.value = response.data.quotas
    localStorage.setItem('revid_token', token.value)
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
    localStorage.removeItem('revid_token')
  }

  return {
    token,
    user,
    quotas,
    guestSessionId,
    isLoggedIn,
    isAdmin,
    loginWithMockWechat,
    loadCurrentUser,
    startGuestSession,
    clearSession,
  }
})
