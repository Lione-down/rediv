export interface User {
  id: string
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
}

export interface CurrentUserResponse {
  user: User
  quotas: QuotaBalance
}

export interface QuotaBalance {
  text: number
  image: number
  video: number
}
