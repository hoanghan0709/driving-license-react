import { useSyncExternalStore } from 'react'
import { httpStatus, refresh } from './auth-api'
import type { Tokens } from './auth-api'

const storageKey = 'driving-license.refresh-token'

function readRefreshToken() {
  try {
    return window.sessionStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function saveRefreshToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(storageKey, token)
    else window.sessionStorage.removeItem(storageKey)
  } catch {
    // The active session still works when browser storage is blocked.
  }
}

type Session = {
  id: number
  accessToken: string | null
  refreshToken: string
  renewal?: Promise<string>
}

let nextId = 0
const restoredToken = readRefreshToken()
let session: Session | null = restoredToken
  ? { id: ++nextId, accessToken: null, refreshToken: restoredToken }
  : null

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function replaceSession(next: Session | null) {
  saveRefreshToken(next?.refreshToken ?? null)
  session = next
  listeners.forEach((listener) => listener())
}

export function useSessionId() {
  return useSyncExternalStore(subscribe, () => session?.id ?? null)
}

export function startSession(tokens: Tokens) {
  replaceSession({ id: ++nextId, accessToken: tokens.access_token, refreshToken: tokens.refresh_token })
}

export function endSession() {
  replaceSession(null)
}

function assertActive(active: Session) {
  if (session !== active) throw new Error('Session changed')
}

function renewAccess(active: Session): Promise<string> {
  assertActive(active)
  // Parallel requests must share one refresh because the backend rotates the token.
  active.renewal ??= refresh(active.refreshToken)
    .then((tokens) => {
      assertActive(active)
      active.accessToken = tokens.access_token
      active.refreshToken = tokens.refresh_token
      saveRefreshToken(active.refreshToken)
      return active.accessToken
    })
    .catch((error: unknown) => {
      if (session === active && httpStatus(error) === 401) endSession()
      throw error
    })
    .finally(() => { active.renewal = undefined })
  return active.renewal
}

export async function withSession<T>(id: number, request: (accessToken: string) => Promise<T>) {
  const active = session
  if (active?.id !== id) throw new Error('Session changed')

  const token = active.accessToken ?? await renewAccess(active)
  assertActive(active)
  try {
    const result = await request(token)
    assertActive(active)
    return result
  } catch (error) {
    if (httpStatus(error) !== 401) throw error
  }

  assertActive(active)
  const replacement = active.accessToken !== token && active.accessToken
    ? active.accessToken
    : await renewAccess(active)
  assertActive(active)
  try {
    const result = await request(replacement)
    assertActive(active)
    return result
  } catch (error) {
    if (session === active && active.accessToken === replacement && httpStatus(error) === 401) endSession()
    throw error
  }
}
