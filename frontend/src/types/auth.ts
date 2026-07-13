export interface User {
  id: string
  username: string | null
  email: string | null
  nickname: string
  avatar_url: string
  role: 'user' | 'admin'
  status: 'active' | 'banned'
  generation_status: 'enabled' | 'frozen'
  created_at: string
  updated_at: string
  last_login_at: string
}

export interface AuthResponse {
  token: string
  user: User
  quotas: QuotaBalance
  quota_revision: number
}

export interface CurrentUserResponse {
  user: User
  quotas: QuotaBalance
  quota_revision: number
}

export interface QuotaBalance {
  text: number
  image: number
  video: number
}

export type RegistrationMode = 'open' | 'invite_only' | 'closed'

export interface RegistrationSettings {
  registration_mode: RegistrationMode
  wechat_login_enabled: boolean
}

export interface LoginPayload {
  identifier: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  email?: string
  invitation_code?: string
}

export interface GuestSession {
  session_id: string
  expires_at: string
}
