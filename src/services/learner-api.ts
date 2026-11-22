import { z } from 'zod'
import { withSession } from '../features/auth/auth-session'
import { apiClient } from './api-client'

type Params = Record<string, string | number | boolean>

export function learnerRequest<T>(
  session: number,
  path: string,
  schema: z.ZodType<T>,
  options: { signal?: AbortSignal; params?: Params; method?: 'PUT' | 'POST'; data?: object } = {},
) {
  return withSession(session, async (token) => {
    const { data } = await apiClient.request<unknown>({
      ...options,
      url: '/api/v1' + path,
      headers: { Authorization: `Bearer ${token}` },
    })
    return schema.parse(data)
  })
}

export const idSchema = z.number().int().positive()
export const countSchema = z.number().int().nonnegative()
export const dateSchema = z.iso.datetime({ offset: true })
export const catalogSchema = z.object({ data: z.array(z.object({ code: z.string(), name: z.string() })) })

export function pageSchema<T>(item: z.ZodType<T>) {
  return z.object({ data: z.array(item).nullable().transform((rows) => rows ?? []),
    total: countSchema, page: idSchema, limit: idSchema })
}

export function mediaUrl(value: string) {
  if (!value) return undefined
  try {
    const backend = new URL((apiClient.defaults.baseURL || '/backend').replace(/\/$/, '') + '/', window.location.origin)
    const url = new URL(value.replace(/^\/(?!\/)/, ''), backend)
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
  } catch {
    return undefined
  }
}
