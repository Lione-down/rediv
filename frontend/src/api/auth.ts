import { request } from './request'
import type {
  AuthResponse,
  CurrentUserResponse,
  GuestSession,
  LoginPayload,
  RegisterPayload,
  RegistrationSettings,
} from '../types/auth'

export interface WechatAuthorizeResponse {
  authorize_url: string
  mock: boolean
  state: string
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

export function fetchRegistrationSettings() {
  return request.get<RegistrationSettings>('/auth/registration-settings')
}

export function loginWithPassword(payload: LoginPayload) {
  return request.post<AuthResponse>('/auth/login', payload)
}

export function registerWithPassword(payload: RegisterPayload) {
  return request.post<AuthResponse>('/auth/register', payload)
}

export function logoutCurrentSession(token: string) {
  return request.post<{ ok: boolean; detail: string }>('/auth/logout', undefined, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function fetchCurrentUser() {
  return request.get<CurrentUserResponse>('/me')
}

export function createGuestSession() {
  return request.post<GuestSession>('/auth/guest')
}
