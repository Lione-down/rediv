import axios from 'axios'
import { useAuthStore } from '../store/auth'

function readBearerToken(headers: unknown) {
  if (!headers || typeof headers !== 'object') {
    return ''
  }

  const requestHeaders = headers as {
    Authorization?: unknown
    authorization?: unknown
    get?: (name: string) => unknown
  }
  const authorization =
    requestHeaders.get?.('Authorization') ??
    requestHeaders.Authorization ??
    requestHeaders.authorization

  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return ''
  }

  return authorization.slice('Bearer '.length).trim()
}

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()

    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  },
  undefined,
  // Bind credentials before control returns so a session switch cannot retarget a mutation.
  { synchronous: true },
)

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      const failedRequestToken = readBearerToken(error.config?.headers)

      if (
        (failedRequestToken && failedRequestToken === authStore.token) ||
        (!failedRequestToken && !authStore.token)
      ) {
        authStore.clearSession()
      }
    }

    return Promise.reject(error)
  },
)
