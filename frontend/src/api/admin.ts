import { request } from './request'

export function devAdminLogin(adminKey: string) {
  return request.post('/admin/dev-login', null, {
    headers: { 'X-Revid-Dev-Admin-Key': adminKey },
  })
}

export function fetchAdminDashboard() {
  return request.get('/admin/dashboard')
}

export function fetchAdminUsers() {
  return request.get('/admin/users')
}
