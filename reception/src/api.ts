const BASE = 'https://utec-gym.duckdns.org/api/v1'

let token = ''

export function setToken(t: string) { token = t }
export function getToken() { return token }

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Error desconocido')
  }
  return res.json()
}

export const api = {
  login: (email: string, password: string) =>
    req('POST', '/auth/login', { email, password }),

  checkin: (qr_token: string) =>
    req('POST', '/sessions/checkin', { qr_token }),

  recent: (limit = 8) =>
    req('GET', `/sessions/recent?limit=${limit}`),

  req: (method: string, path: string, body?: unknown) =>
    req(method, path, body),
}
