import { request } from './request'
import type { AuthResponse, CurrentUserResponse } from '../types/auth'

export interface WechatAuthorizeResponse {
  authorize_url: string
  mock: boolean
}

export interface WechatCallbackPayload {
  code: string
  state?: string
  invitation_code?: string
}

export function getWechatAuthorize(state: string) {
  return request.get<WechatAuthorizeResponse>('/auth/wechat/authorize', {
    params: { state },
  })
}

export function exchangeWechatCode(payload: WechatCallbackPayload) {
  return request.post<AuthResponse>('/auth/wechat/callback', payload)
}

export function fetchCurrentUser() {
  return request.get<CurrentUserResponse>('/me')
}

export function createGuestSession() {
  return request.post<{ session_id: string; expires_at: string }>('/auth/guest')
}
