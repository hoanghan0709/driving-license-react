import { isAxiosError } from 'axios'
import { z } from 'zod'
import { apiClient } from '../../services/api-client'

export const profileSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string(),
  current_license_type: z.string(),
  role: z.string().optional(),
})

const tokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
})

const tokensResponse = z.object({ data: tokensSchema })
const registrationResponse = z.object({ data: profileSchema })

export type Profile = z.infer<typeof profileSchema>
export type Tokens = z.infer<typeof tokensSchema>
export type Credentials = { email: string; password: string }

export function httpStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined
}

export function isAuthApiUnavailable(error: unknown) {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  return status === undefined || status === 404 || status === 502 || status === 503 || status === 504
}

export async function registerAccount(input: Credentials & { name: string }, signal: AbortSignal) {
  const { data } = await apiClient.post<unknown>('/auth/register', input, { signal })
  return registrationResponse.parse(data).data
}

export async function login(input: Credentials, signal: AbortSignal) {
  const { data } = await apiClient.post<unknown>('/auth/login', input, { signal })
  return tokensResponse.parse(data).data
}

export async function refresh(refreshToken: string) {
  const { data } = await apiClient.post<unknown>('/auth/refresh', { refresh_token: refreshToken })
  return tokensResponse.parse(data).data
}

export async function getAuthenticated<T>(path: string, schema: z.ZodType<T>, accessToken: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<unknown>(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  })
  return schema.parse(data)
}

export function getProfile(accessToken: string, signal?: AbortSignal) {
  return getAuthenticated('/api/v1/me', profileSchema, accessToken, signal)
}
