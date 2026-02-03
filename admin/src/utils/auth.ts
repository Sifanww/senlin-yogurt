export type AdminUser = {
  id: number
  phone: string
  nickname?: string
  avatar?: string
}

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export function setUser(user: AdminUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem(USER_KEY)
}

export function clearAuth() {
  clearToken()
  clearUser()
}
