import { request } from './request'
import type { AuthResponse, CurrentUserResponse } from '../types/auth'

export function mockWechatLogin() {
  return request.post<AuthResponse>('/auth/wechat/mock', {
    openid: `mock-${Date.now()}`,
    nickname: '测试创作者',
    invitation_code: 'TEST2026',
  })
}

export function fetchCurrentUser() {
  return request.get<CurrentUserResponse>('/me')
}

export function createGuestSession() {
  return request.post<{ session_id: string; expires_at: string }>('/auth/guest')
}
